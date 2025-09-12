import { ChatStore, ChatState } from '../state/chat-store.js';
import { ChatService } from '../services/chat-service.js';
import { MessageList } from './message-list.js';
import { ChatInput } from './chat-input.js';

export class ChatView {
  private store: ChatStore;
  private service: ChatService;
  private messageList!: MessageList;
  private chatInput!: ChatInput;
  private container: HTMLElement;
  private unsubscribe?: () => void;
  private isPinned: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.store = new ChatStore();
    this.service = new ChatService(this.store);
    
    this.render();
    this.initializeComponents();
    this.subscribeToStore();
    this.loadInitialData();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="chat-view">
        <div class="chat-header">
          <div class="chat-header__title">
            <h2>AI Chat Assistant</h2>
          </div>
          <div class="chat-header__actions">
            <button class="chat-header__clear" type="button" aria-label="Clear chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </button>
            <button class="chat-header__pin" type="button" aria-label="Pin chat window">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m13 3 3.5 2L12 14l-4 4-3-3 4-4L18.5 6.5 21 10"></path>
              </svg>
            </button>
            <button class="chat-header__minimize" type="button" aria-label="Minimize">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button class="chat-header__close" type="button" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="chat-messages" id="chat-messages"></div>
        
        <div class="chat-error" id="chat-error" style="display: none;">
          <div class="chat-error__content">
            <span class="chat-error__message"></span>
            <button class="chat-error__close" type="button" aria-label="Dismiss error">×</button>
          </div>
        </div>
        
        <div class="chat-metrics" id="chat-metrics" style="display: none;">
          <div class="chat-metrics__content">
            <span class="chat-metrics__tokens"></span>
            <span class="chat-metrics__latency"></span>
          </div>
        </div>
        
        <div class="chat-input-container" id="chat-input-container"></div>
      </div>
    `;
  }

  private initializeComponents(): void {
    const messagesContainer = this.container.querySelector('#chat-messages') as HTMLElement;
    const inputContainer = this.container.querySelector('#chat-input-container') as HTMLElement;

    this.messageList = new MessageList(messagesContainer);
    this.chatInput = new ChatInput(inputContainer, {
      onSend: (content) => this.service.sendMessage(content),
      onStop: () => this.service.stopStream(),
    });

    this.setupHeaderActions();
    this.setupKeyboardShortcuts();
  }

  private setupHeaderActions(): void {
    const clearButton = this.container.querySelector('.chat-header__clear') as HTMLButtonElement;
    const pinButton = this.container.querySelector('.chat-header__pin') as HTMLButtonElement;
    const minimizeButton = this.container.querySelector('.chat-header__minimize') as HTMLButtonElement;
    const closeButton = this.container.querySelector('.chat-header__close') as HTMLButtonElement;

    clearButton?.addEventListener('click', () => {
      if (confirm('Clear all chat history?')) {
        this.service.clearHistory();
      }
    });

    pinButton?.addEventListener('click', () => {
      this.togglePin();
    });

    minimizeButton?.addEventListener('click', () => {
      this.minimizeWindow();
    });

    closeButton?.addEventListener('click', () => {
      this.closeWindow();
    });

    const errorClose = this.container.querySelector('.chat-error__close') as HTMLButtonElement;
    errorClose?.addEventListener('click', () => {
      this.service.clearError();
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (confirm('Clear all chat history?')) {
          this.service.clearHistory();
        }
      }
      
      if (e.key === 'Escape') {
        if (this.store.getState().isStreaming) {
          this.service.stopStream();
        } else if (!this.isPinned) {
          window.close();
        }
      }
    });
  }

  private subscribeToStore(): void {
    this.unsubscribe = this.store.subscribe((state) => {
      this.updateView(state);
    });
  }

  private updateView(state: ChatState): void {
    this.messageList.render(state.messages, state.currentStreamContent);
    this.chatInput.setStreaming(state.isStreaming);
    this.updateError(state.error);
    this.updateMetrics(state.metrics);
  }

  private updateError(error: string | null): void {
    const errorContainer = this.container.querySelector('#chat-error') as HTMLElement;
    const errorMessage = this.container.querySelector('.chat-error__message') as HTMLElement;

    if (error) {
      errorMessage.textContent = error;
      errorContainer.style.display = 'block';
    } else {
      errorContainer.style.display = 'none';
    }
  }

  private updateMetrics(metrics: { tokenCount?: number; latencyMs?: number }): void {
    const metricsContainer = this.container.querySelector('#chat-metrics') as HTMLElement;
    const tokensSpan = this.container.querySelector('.chat-metrics__tokens') as HTMLElement;
    const latencySpan = this.container.querySelector('.chat-metrics__latency') as HTMLElement;

    if (metrics.tokenCount || metrics.latencyMs) {
      if (metrics.tokenCount) {
        tokensSpan.textContent = `${metrics.tokenCount} tokens`;
      }
      if (metrics.latencyMs) {
        latencySpan.textContent = `${metrics.latencyMs}ms`;
      }
      metricsContainer.style.display = 'block';
      setTimeout(() => {
        metricsContainer.style.display = 'none';
      }, 3000);
    }
  }

  private async loadInitialData(): Promise<void> {
    try {
      await this.service.loadHistory();
      this.chatInput.focus();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  private togglePin(): void {
    this.isPinned = !this.isPinned;
    const pinButton = this.container.querySelector('.chat-header__pin') as HTMLButtonElement;
    
    if (this.isPinned) {
      pinButton?.classList.add('chat-header__pin--active');
      pinButton?.setAttribute('aria-label', 'Unpin chat window');
      this.updateWindowState();
    } else {
      pinButton?.classList.remove('chat-header__pin--active');
      pinButton?.setAttribute('aria-label', 'Pin chat window');
      this.updateWindowState();
    }
  }

  private async updateWindowState(): Promise<void> {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      if (currentWindow.id) {
        if (this.isPinned) {
          chrome.windows.update(currentWindow.id, { focused: true });
        }
      }
    } catch (error) {
    }
  }

  private async minimizeWindow(): Promise<void> {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      if (currentWindow.id) {
        await chrome.windows.update(currentWindow.id, { state: 'minimized' });
      }
    } catch (error) {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        if (currentWindow.id) {
          chrome.windows.update(currentWindow.id, { focused: false });
        }
      } catch {
      }
    }
  }

  private async closeWindow(): Promise<void> {
    if (this.isPinned) {
      this.minimizeWindow();
    } else {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        if (currentWindow.id) {
          await chrome.windows.remove(currentWindow.id);
        }
      } catch (error) {
        window.close();
      }
    }
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}