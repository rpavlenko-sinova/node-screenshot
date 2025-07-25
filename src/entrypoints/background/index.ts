import { registerScreenshotHandlers } from '@/entrypoints/background/messagingHandlers/screenshotHandler';
import { registerVideoHandlers } from '@/entrypoints/background/messagingHandlers/videoHandler';

export default defineBackground(() => {
  console.info('Hello background!');
  // will output the different result based on if was built with :client or not
  console.info('VARIABLE:', import.meta.env.WXT_VARIABLE);
  registerScreenshotHandlers();
  registerVideoHandlers();
  browser.action.onClicked.addListener((tab) => {
    if (tab.id) {
      browser.sidePanel.open({ tabId: tab.id }).catch(console.error);
    }
  });
});
