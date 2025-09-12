import { ChatMessage } from '../../../domain/message.js';

export class MessageList {
  private container: HTMLElement;
  private autoScroll = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupScrollListener();
  }

  render(messages: ChatMessage[], currentStreamContent: string = ''): void {
    const messagesHtml = messages.map(message => this.renderMessage(message)).join('');
    
    const streamHtml = currentStreamContent ? 
      this.renderStreamMessage(currentStreamContent) : '';

    this.container.innerHTML = messagesHtml + streamHtml;
    
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  private renderMessage(message: ChatMessage): string {
    const roleClass = message.role === 'user' ? 'user' : 'assistant';
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    return `
      <div class="message message--${roleClass}">
        <div class="message__avatar">
          ${message.role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="message__content">
          <div class="message__text">${this.formatContent(message.content)}</div>
          <div class="message__timestamp">${timestamp}</div>
        </div>
      </div>
    `;
  }

  private renderStreamMessage(content: string): string {
    return `
      <div class="message message--assistant message--streaming">
        <div class="message__avatar">🤖</div>
        <div class="message__content">
          <div class="message__text">${this.formatContent(content)}<span class="cursor">|</span></div>
          <div class="message__timestamp">Now</div>
        </div>
      </div>
    `;
  }

  private formatContent(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  private setupScrollListener(): void {
    this.container.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      this.autoScroll = isNearBottom;
    });
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }

  clear(): void {
    this.container.innerHTML = '';
  }
}