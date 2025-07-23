import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Settings, Video, Trash2 } from 'lucide-react';
import { storage } from '#imports';
import { sendMessage } from '@/entrypoints/background/messaging/messaging';
import { BridgeMessage } from '@/lib/enums/bridge';

type TScreenshotData = {
  id: string;
  timestamp: number;
  url: string;
  dataUrl: string;
};

type TVideoData = {
  id: string;
  timestamp: number;
  blob: Blob;
  size: number;
  type: string;
};

const DB_NAME = 'VideoRecordingsDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function saveVideoToIndexedDB(blob: Blob): Promise<string> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const id = `video_${Date.now()}`;
  const videoData = {
    id,
    timestamp: Date.now(),
    blob: blob,
    size: blob.size,
    type: blob.type,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(videoData);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function getVideosFromIndexedDB(): Promise<TVideoData[]> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const videos = request.result;
      const processedVideos = videos.map((video) => ({
        ...video,
        blob: video.blob instanceof Blob ? video.blob : new Blob([video.blob], { type: video.type }),
      }));
      resolve(processedVideos);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteVideoFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const App = () => {
  const [screenshots, setScreenshots] = useState<any>();
  const [videos, setVideos] = useState<TVideoData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  useEffect(() => {
    storage.getItem(`local:screenshots`).then((screenshots) => {
      console.info(screenshots);
      if (screenshots) {
        setScreenshots(screenshots);
      }
    });

    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const videos = await getVideosFromIndexedDB();
      setVideos(videos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const startVideoRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingProgress(0);

      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) {
        throw new Error('No active tab found');
      }

      const response = await sendMessage(BridgeMessage.StartVideoRecording, {
        tabId: currentTab.id,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start recording');
      }

      const stream = await new Promise<MediaStream>((resolve, reject) => {
        browser.tabCapture.capture(
          {
            audio: true,
            video: true,
          },
          (stream) => {
            if (browser.runtime.lastError) {
              reject(new Error(browser.runtime.lastError.message));
              return;
            }
            if (!stream) {
              reject(new Error('Failed to capture stream'));
              return;
            }
            resolve(stream);
          },
        );
      });

      let recordedChunks: BlobPart[] = [];

      const supportedTypes = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];

      let mimeType = 'video/webm';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log('Using MIME type:', mimeType);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event, data size:', event.data.size);
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log('Added chunk, total chunks:', recordedChunks.length);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        setRecordingProgress(0);
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder onstop called, recordedChunks length:', recordedChunks.length);

        if (recordedChunks.length === 0) {
          console.error('No recorded chunks available');
          setIsRecording(false);
          setRecordingProgress(0);
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        const blob = new Blob(recordedChunks, {
          type: 'video/webm',
        });

        console.log('Recording stopped. Blob size:', blob.size);
        console.log('Blob type:', blob.type);

        if (blob.size === 0) {
          console.error('Created blob has zero size');
          setIsRecording(false);
          setRecordingProgress(0);
          recordedChunks = [];
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        try {
          const videoId = await saveVideoToIndexedDB(blob);
          console.log('Video saved with ID:', videoId);

          loadVideos();
        } catch (error) {
          console.error('Failed to save video:', error);
        }

        setIsRecording(false);
        setRecordingProgress(0);
        recordedChunks = [];

        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      };

      mediaRecorder.start(1000); // Request data every second
      console.log('Recording started for tab:', currentTab.id);

      const startTime = Date.now();
      const duration = 5000; // 5 seconds

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setRecordingProgress(progress);

        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100);

      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          console.log('5-second recording completed.');
        }
      }, 5000);

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.onended = () => {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            console.log('Stream track ended, stopping recording.');
          }
        };
      });
    } catch (error) {
      console.error('Failed to start video recording:', error);
      setIsRecording(false);
      setRecordingProgress(0);
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      await deleteVideoFromIndexedDB(videoId);
      setVideos(videos.filter((video) => video.id !== videoId));
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Node Screenshot</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-md font-medium text-gray-900">Video Recording</h2>
          <Button
            onClick={startVideoRecording}
            disabled={isRecording}
            className="flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            {isRecording ? 'Recording...' : 'Record 5s Video'}
          </Button>
        </div>

        {!!isRecording && (
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-100"
              style={{ width: `${recordingProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {videos.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-md mb-4 font-medium text-gray-900">Recorded Videos</h3>
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Video {video.id}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>Size: {formatFileSize(video.size)}</div>
                  <div>Recorded: {formatTimestamp(video.timestamp)}</div>
                </div>
                <video
                  controls
                  className="mt-3 w-full rounded border"
                  src={URL.createObjectURL(video.blob)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots List */}
      {!!screenshots && (
        <div className="flex flex-col gap-4 p-4">
          <img
            src={screenshots.dataUrl}
            alt="Screenshot"
          />
        </div>
      )}
    </div>
  );
};

export default App;
