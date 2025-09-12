import { ChatView } from '../features/chat/components/chat-view.js';
import { ConsoleLogger } from '../shared/logger/console-logger.js';

class PopupApp {
  private logger = new ConsoleLogger();
  private chatView?: ChatView;

  constructor() {
    this.logger.info('Popup app initializing');
    this.init();
  }

  private init(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.render();
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.render();
      });
    } else {
      this.render();
    }
  }

  private render(): void {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      this.logger.error('App container not found');
      return;
    }

    try {
      this.chatView = new ChatView(appContainer);
      this.setupPopupBehavior();
      this.logger.info('Popup app initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize popup app', error instanceof Error ? error : undefined);
      this.renderError(appContainer, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private setupPopupBehavior(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.chatView) {
        this.chatView.destroy();
      }
    });

    window.addEventListener('blur', () => {
      document.body.classList.add('window-unfocused');
    });

    window.addEventListener('focus', () => {
      document.body.classList.remove('window-unfocused');
    });
  }

  private renderError(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="error-container">
        <div class="error-content">
          <h3>Failed to Load Chat</h3>
          <p>${message}</p>
          <button onclick="window.location.reload()" class="error-retry">
            Retry
          </button>
          <button onclick="chrome.runtime.openOptionsPage()" class="error-settings">
            Open Settings
          </button>
        </div>
      </div>
    `;
  }
}

new PopupApp();