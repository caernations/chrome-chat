import { ChatMessage, ChatParams } from '../../../domain/message.js';
import { ConsoleLogger } from '../../../shared/logger/console-logger.js';
import { MessageType, RuntimeMessage } from '../../../shared/types/messages.js';
import { ChatStore } from '../state/chat-store.js';

export class ChatService {
  private logger = new ConsoleLogger();

  constructor(private store: ChatStore) {
    this.setupMessageListeners();
  }

  async sendMessage(content: string, params: Partial<ChatParams> = {}): Promise<void> {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    this.store.dispatch({ type: 'MESSAGE_ADDED', payload: userMessage });

    try {
      await chrome.runtime.sendMessage({
        type: MessageType.SAVE_USER_MESSAGE,
        payload: userMessage
      });
    } catch (error) {
      this.logger.error('Failed to save user message', error instanceof Error ? error : undefined);
    }

    const messages = [...this.store.getState().messages, userMessage];
    const chatParams: ChatParams = {
      model: params.model || 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens || 2048,
    };

    this.store.dispatch({ type: 'STREAM_STARTED' });

    try {
      await chrome.runtime.sendMessage({
        type: MessageType.SEND_MESSAGE,
        payload: { messages, params: chatParams },
      });
    } catch (error) {
      this.logger.error('Failed to send message', error instanceof Error ? error : undefined);
      this.store.dispatch({ 
        type: 'STREAM_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  }

  async stopStream(): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.STOP_STREAM,
      });
    } catch (error) {
      this.logger.error('Failed to stop stream', error instanceof Error ? error : undefined);
    }
  }

  async loadHistory(): Promise<void> {
    try {
      const messages = await chrome.runtime.sendMessage({
        type: MessageType.GET_HISTORY,
      }) as ChatMessage[];

      this.store.dispatch({ type: 'HISTORY_LOADED', payload: messages });
    } catch (error) {
      this.logger.error('Failed to load history', error instanceof Error ? error : undefined);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.CLEAR_HISTORY,
      });

      this.store.dispatch({ type: 'HISTORY_CLEARED' });
    } catch (error) {
      this.logger.error('Failed to clear history', error instanceof Error ? error : undefined);
    }
  }

  clearError(): void {
    this.store.dispatch({ type: 'ERROR_CLEARED' });
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
      switch (message.type) {
        case MessageType.STREAM_DELTA:
          this.store.dispatch({ 
            type: 'STREAM_DELTA', 
            payload: message.payload.content 
          });
          break;

        case MessageType.STREAM_END:
          this.store.dispatch({ 
            type: 'STREAM_ENDED', 
            payload: {} 
          });
          break;

        case MessageType.STREAM_ERROR:
          this.store.dispatch({ 
            type: 'STREAM_ERROR', 
            payload: message.payload.error 
          });
          break;
      }
    });
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}