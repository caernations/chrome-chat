import { RuntimePort } from '../../domain/ports.js';

export class ChromeRuntime implements RuntimePort {
  async sendMessage<T = unknown, R = unknown>(message: T): Promise<R> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response: R) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  onMessage<T = unknown>(
    handler: (message: T, sender: chrome.runtime.MessageSender) => void | Promise<unknown>
  ): void {
    chrome.runtime.onMessage.addListener(
      (message: T, sender: chrome.runtime.MessageSender, sendResponse) => {
        const result = handler(message, sender);
        if (result instanceof Promise) {
          result
            .then((response) => {
              if (response !== undefined) {
                sendResponse(response);
              }
            })
            .catch((error) => {
              console.error('Message handler error:', error);
              sendResponse({ error: error.message });
            });
          return true; 
        }
        return false;
      }
    );
  }

  async openWindow(options: chrome.windows.CreateData): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      chrome.windows.create(options, (window) => {
        if (chrome.runtime.lastError || !window) {
          reject(new Error(chrome.runtime.lastError?.message || 'Failed to create window'));
        } else {
          resolve(window);
        }
      });
    });
  }

  async closeWindow(windowId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.windows.remove(windowId, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async focusWindow(windowId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.windows.update(windowId, { focused: true }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}