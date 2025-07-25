import React from 'react';
import ReactDOM from 'react-dom/client';
import { OffscreenApp } from '@/entrypoints/offscreen/App';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <OffscreenApp />
  </React.StrictMode>,
);

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response: any) => void) => {
  console.log('Offscreen received message:', message);

  if (message.type === 'SCREENSHOT_REQUEST') {
    handleScreenshotModify(message, sendResponse);
    return true;
  }

  return true;
});

function handleScreenshotModify(message: any, sendResponse: (response: any) => void) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    const cropX = message.data.screenshotData.dimensions.x;
    const cropY = message.data.screenshotData.dimensions.y;
    const cropWidth = message.data.screenshotData.dimensions.width;
    const cropHeight = message.data.screenshotData.dimensions.height;

    const rectX = message.data.rect.realX;
    const rectY = message.data.rect.realY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    if (!ctx) {
      sendResponse({
        success: false,
        error: 'Failed to get canvas context',
      });
      return;
    }

    ctx.drawImage(img, rectX, rectY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 10;
    ctx.strokeRect(25, 25, cropWidth - 50, cropHeight - 50);

    const croppedDataUrl = canvas.toDataURL('image/png');

    sendResponse({
      success: true,
      data: 'Screenshot cropped',
      croppedDataUrl: croppedDataUrl,
    });
  };

  img.onerror = () => {
    sendResponse({
      success: false,
      error: 'Failed to load image',
    });
  };

  img.src = message.data.screenshotData.dataUrl;
}

function handleDOMOperation(message: any, sendResponse: (response: any) => void) {
  console.log('Processing DOM operation:', message);

  sendResponse({ success: true, data: 'DOM operation completed' });
}
