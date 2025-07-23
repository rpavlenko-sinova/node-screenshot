export type TOffscreenMessage = {
  type: string;
  data?: any;
};

export type TOffscreenResponse = {
  success: boolean;
  data?: any;
  croppedDataUrl?: string;
  error?: string;
};

export async function sendToOffscreen(message: TOffscreenMessage): Promise<TOffscreenResponse> {
  try {
    if (!(await browser.offscreen.hasDocument())) {
      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Processing DOM operations and screenshots',
      });
    }

    const response = await browser.runtime.sendMessage(message);
    console.info('Offscreen response:', response);
    return response as TOffscreenResponse;
  } catch (error) {
    console.error('Error sending message to offscreen page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function closeOffscreen(): Promise<void> {
  try {
    await browser.offscreen.closeDocument();
  } catch (error) {
    console.error('Error closing offscreen page:', error);
  }
}

export async function isOffscreenOpen(): Promise<boolean> {
  try {
    await browser.offscreen.hasDocument();
    return true;
  } catch {
    return false;
  }
}
