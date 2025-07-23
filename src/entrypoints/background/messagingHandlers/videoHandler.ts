import { BridgeMessage } from '@/lib/enums/bridge';
import { onMessage } from '@/entrypoints/background/messaging/messaging';

const mediaRecorder: MediaRecorder | null = null;
let recordingTimeout: number | null = null;

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

async function getVideosFromIndexedDB(): Promise<any[]> {
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

export function registerVideoHandlers() {
  onMessage(BridgeMessage.StartVideoRecording, async (data) => {
    try {
      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error starting video recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  });

  onMessage(BridgeMessage.StopVideoRecording, async (data) => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
      }
      return {
        success: true,
        timestamp: Date.now(),
      };
    }
    return {
      success: false,
      error: 'No active recording to stop',
      timestamp: Date.now(),
    };
  });

  onMessage(BridgeMessage.GetVideoRecordings, async () => {
    try {
      const videos = await getVideosFromIndexedDB();
      return {
        success: true,
        videos,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  });

  onMessage(BridgeMessage.DeleteVideoRecording, async (data) => {
    try {
      await deleteVideoFromIndexedDB((data as any).id);
      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  });

  onMessage(BridgeMessage.SaveVideoRecording, async (data) => {
    try {
      const { blobData, blobType, blobSize } = data.data as any;

      if (!blobData) {
        throw new Error('No blob data received');
      }

      if (blobSize === 0) {
        throw new Error('Blob has zero size');
      }

      const blob = new Blob([blobData], { type: blobType });

      const videoId = await saveVideoToIndexedDB(blob);

      return {
        success: true,
        videoId,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  });
}
