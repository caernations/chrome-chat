import { ChatView } from '../features/chat/components/chat-view.js';
import { ConsoleLogger } from '../shared/logger/console-logger.js';

class PiPApp {
  private logger = new ConsoleLogger();
  private chatView?: ChatView;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor() {
    this.logger.info('PiP app initializing');
    this.init();
  }

  private init(): void {
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
      this.setupDragHandle();
      this.chatView = new ChatView(appContainer);
      this.setupPiPBehavior();
      this.logger.info('PiP app initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PiP app', error instanceof Error ? error : undefined);
      this.renderError(appContainer, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private setupDragHandle(): void {
    const handle = document.getElementById('pip-handle');
    if (!handle) return;

    handle.addEventListener('mousedown', (e) => {
      this.startDrag(e);
    });

    document.addEventListener('mousemove', (e) => {
      this.drag(e);
    });

    document.addEventListener('mouseup', () => {
      this.stopDrag();
    });

    handle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrag(touch);
    });

    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.drag(touch);
    });

    document.addEventListener('touchend', () => {
      this.stopDrag();
    });
  }

  private startDrag(event: MouseEvent | Touch): void {
    this.isDragging = true;
    document.body.classList.add('dragging');
    
    const rect = document.body.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private drag(event: MouseEvent | Touch): void {
    if (!this.isDragging) return;

    const newX = event.screenX - this.dragOffset.x;
    const newY = event.screenY - this.dragOffset.y;

    const maxX = screen.width - window.outerWidth;
    const maxY = screen.height - window.outerHeight;

    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    window.moveTo(clampedX, clampedY);
  }

  private stopDrag(): void {
    this.isDragging = false;
    document.body.classList.remove('dragging');
  }

  private setupPiPBehavior(): void {
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

    const resizeObserver = new ResizeObserver(() => {
      this.adjustLayoutForSize();
    });
    resizeObserver.observe(document.body);
  }

  private adjustLayoutForSize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    document.body.classList.toggle('compact', width < 300 || height < 400);
    document.body.classList.toggle('mini', width < 250 || height < 300);
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
        </div>
      </div>
    `;
  }
}

new PiPApp();