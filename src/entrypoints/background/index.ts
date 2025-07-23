import { registerStorageHandlers } from '@/entrypoints/background/messagingHandlers/storageHandler';
import { registerScreenshotHandlers } from '@/entrypoints/background/messagingHandlers/screenshotHandler';

export default defineBackground(() => {
  console.info('Hello background!');
  // will output the different result based on if was built with :client or not
  console.info('VARIABLE:', import.meta.env.WXT_VARIABLE);
  registerStorageHandlers();
  registerScreenshotHandlers();

  browser.action.onClicked.addListener((tab) => {
    if (tab.id) {
      browser.sidePanel.open({ tabId: tab.id }).catch(console.error);
    }
  });
});
