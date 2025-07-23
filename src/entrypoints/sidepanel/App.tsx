import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Settings } from 'lucide-react';
import { storage } from '#imports';

type TScreenshotData = {
  id: string;
  timestamp: number;
  url: string;
  dataUrl: string;
};

const App = () => {
  const [screenshots, setScreenshots] = useState<any>();
  useEffect(() => {
    storage.getItem(`local:screenshots`).then((screenshots) => {
      console.info(screenshots);
      if (screenshots) {
        setScreenshots(screenshots);
      }
    });
  }, []);

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
