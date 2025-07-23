import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Settings } from 'lucide-react';

type TScreenshotData = {
  id: string;
  timestamp: number;
  url: string;
  dataUrl: string;
};

const App = () => {
  const [screenshots, setScreenshots] = useState<TScreenshotData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  return (
    <div className="flex h-full w-full flex-col bg-gray-50">
      {/* Header */}
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

      {/* Capture Button */}
      <div className="border-b border-gray-200 bg-white p-4">
        <Button
          onClick={() => {}}
          disabled={isCapturing}
          className="w-full"
        >
          <Camera className="mr-2 h-4 w-4" />
          {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
        </Button>
      </div>

      {/* Screenshots List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {screenshots.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <Camera className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p>No screenshots yet</p>
            <p className="text-sm">Click "Capture Screenshot" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
