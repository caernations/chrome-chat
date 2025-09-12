export interface ChatInputOptions {
  placeholder?: string;
  maxLength?: number;
  onSend?: (content: string) => void;
  onStop?: () => void;
}

export class ChatInput {
  private textarea: HTMLTextAreaElement;
  private sendButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private container: HTMLElement;
  private options: ChatInputOptions;
  private lastSendTime = 0;

  constructor(container: HTMLElement, options: ChatInputOptions = {}) {
    this.container = container;
    this.options = {
      placeholder: 'Type your message...',
      maxLength: 4000,
      ...options,
    };
    
    this.render();
    this.textarea = this.container.querySelector('.chat-input__textarea') as HTMLTextAreaElement;
    this.sendButton = this.container.querySelector('.chat-input__send') as HTMLButtonElement;
    this.stopButton = this.container.querySelector('.chat-input__stop') as HTMLButtonElement;
    
    this.setupEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="chat-input">
        <div class="chat-input__field">
          <textarea 
            class="chat-input__textarea" 
            placeholder="${this.options.placeholder}"
            maxlength="${this.options.maxLength}"
            rows="1"
          ></textarea>
        </div>
        <div class="chat-input__actions">
          <button class="chat-input__send" type="button" aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
          <button class="chat-input__stop" type="button" aria-label="Stop generation" style="display: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.textarea.addEventListener('input', () => {
      this.autoResize();
      this.updateSendButton();
    });

    this.sendButton.addEventListener('click', () => {
      this.handleSend();
    });

    this.stopButton.addEventListener('click', () => {
      this.handleStop();
    });
  }

  private handleSend(): void {
    const now = Date.now();
    if (now - this.lastSendTime < 500) {
      return;
    }
    this.lastSendTime = now;
    
    const content = this.textarea.value.trim();
    if (content && this.options.onSend && !this.textarea.disabled) {
      this.options.onSend(content);
      this.clear();
    }
  }

  private handleStop(): void {
    if (this.options.onStop) {
      this.options.onStop();
    }
  }

  private autoResize(): void {
    this.textarea.style.height = 'auto';
    const maxHeight = 120;
    const scrollHeight = Math.min(this.textarea.scrollHeight, maxHeight);
    this.textarea.style.height = scrollHeight + 'px';
  }

  private updateSendButton(): void {
    const hasContent = this.textarea.value.trim().length > 0;
    this.sendButton.disabled = !hasContent;
    this.sendButton.classList.toggle('chat-input__send--disabled', !hasContent);
  }

  setStreaming(isStreaming: boolean): void {
    if (isStreaming) {
      this.sendButton.style.display = 'none';
      this.stopButton.style.display = 'flex';
      this.textarea.disabled = true;
    } else {
      this.sendButton.style.display = 'flex';
      this.stopButton.style.display = 'none';
      this.textarea.disabled = false;
    }
  }

  focus(): void {
    this.textarea.focus();
  }

  clear(): void {
    this.textarea.value = '';
    this.autoResize();
    this.updateSendButton();
  }

  getValue(): string {
    return this.textarea.value;
  }

  setValue(value: string): void {
    this.textarea.value = value;
    this.autoResize();
    this.updateSendButton();
  }
}