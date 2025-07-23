import { BridgeMessage } from '@/lib/enums/bridge';
import { sendMessage } from '@/entrypoints/background/messaging/messaging';

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    function onPageLoad() {
      console.info('Page loaded successfully!');

      document.addEventListener(
        'click',
        async (event) => {
          if (!event.metaKey) {
            return;
          }

          const clickedElement = event.target as Element;
          const box = clickedElement.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const response = await sendMessage(BridgeMessage.CreateScreenshot, {
            rect: {
              x: box.x * dpr,
              y: box.y * dpr,
              width: box.width * dpr,
              height: box.height * dpr,
            },
          });

          console.info('Screenshot response:', response);
        },
        true,
      );
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onPageLoad);
    } else {
      onPageLoad();
    }

    window.addEventListener('load', () => {
      console.info('🖼️ Page fully loaded with all resources');
    });
  },
});
