import { BridgeMessage } from '@/lib/enums/bridge';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging/messaging';
import { storage } from '#imports';
import { sendToOffscreen } from '@/lib/functions/offscreen';

export function registerScreenshotHandlers() {
  onMessage(BridgeMessage.CreateScreenshot, async (data) => {
    console.info('Received screenshot data:', data);

    const { rect } = data.data;
    const screenshot = await browser.tabs.captureVisibleTab(data.sender.tab.windowId, { format: 'png' });

    const screenshotData = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      url: data.sender.tab.url,
      dimensions: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
      },
      dataUrl: screenshot,
    };

    storage.setItem(`local:screenshots`, screenshotData);
    console.info(storage.getItem(`local:screenshots`));

    const offscreenResponse = await sendToOffscreen({
      type: 'SCREENSHOT_REQUEST',
      data: {
        screenshotData,
        rect,
        tabUrl: data.sender.tab.url,
      },
    });

    if (offscreenResponse.success) {
      const croppedScreenshotData = {
        ...screenshotData,
        dataUrl: offscreenResponse.croppedDataUrl,
      };

      await storage.setItem(`local:screenshots`, croppedScreenshotData);
      console.info('Updated storage with cropped screenshot:', croppedScreenshotData);

      return { success: true, timestamp: Date.now(), data: offscreenResponse.data };
    }

    return { success: true, timestamp: Date.now() };
  });
}
