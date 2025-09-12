import { ConsoleLogger } from '../shared/logger/console-logger.js';
import { MessageType, OpenFloatingRequest } from '../shared/types/messages.js';

export class FloatingWindowManager {
  private logger = new ConsoleLogger();
  private floatingWindowId: number | null = null;

  async openFloatingChat(): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.OPEN_FLOATING,
      } as OpenFloatingRequest);
    } catch (error) {
      this.logger.error('Failed to open floating chat', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async closeFloatingChat(): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.CLOSE_FLOATING,
      });
    } catch (error) {
      this.logger.error('Failed to close floating chat', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async isFloatingChatOpen(): Promise<boolean> {
    return this.floatingWindowId !== null;
  }

  private supportsDocumentPiP(): boolean {
    return 'documentPictureInPicture' in window && 'requestWindow' in (window as any).documentPictureInPicture;
  }

  async openDocumentPiP(): Promise<void> {
    if (!this.supportsDocumentPiP()) {
      throw new Error('Document Picture-in-Picture not supported');
    }

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 420,
        height: 560,
      });

      pipWindow.document.head.innerHTML = `
        <title>AI Chat Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${chrome.runtime.getURL('styles.css')}">
      `;

      const response = await fetch(chrome.runtime.getURL('pip.html'));
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      pipWindow.document.body.innerHTML = doc.body.innerHTML;

      const script = pipWindow.document.createElement('script');
      script.type = 'module';
      script.src = chrome.runtime.getURL('src/platform/pip.js');
      pipWindow.document.head.appendChild(script);

      pipWindow.addEventListener('pagehide', () => {
        this.floatingWindowId = null;
        this.logger.info('Document PiP window closed');
      });

      this.logger.info('Document PiP window opened successfully');
    } catch (error) {
      this.logger.error('Failed to open Document PiP window', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async openPopupWindow(): Promise<void> {
    try {
      const window = await chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 420,
        height: 560,
        focused: true,
      });

      if (window?.id) {
        this.floatingWindowId = window.id;
        this.logger.info('Popup window opened', { windowId: window.id });
      }
    } catch (error) {
      this.logger.error('Failed to open popup window', error instanceof Error ? error : undefined);
      throw error;
    }
  }
}