import { ChatGateway, Logger, StoragePort } from '../domain/ports.js';
import { ChatMessage, ChatParams, StreamDelta } from '../domain/message.js';
import { ConfigurationError } from '../domain/errors.js';

export class SendMessageUseCase {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly storage: StoragePort,
    private readonly logger: Logger
  ) {}

  async *execute(
    messages: ChatMessage[],
    params: ChatParams
  ): AsyncIterable<StreamDelta> {
    this.logger.info('Starting message send', { messageCount: messages.length });

    if (messages.length === 0) {
      throw new ConfigurationError('No messages provided');
    }

    try {
      await this.saveToHistory(messages);

      for await (const delta of this.chatGateway.startStream(messages, params)) {
        yield delta;
      }
    } catch (error) {
      this.logger.error(
        'Failed to send message',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private async saveToHistory(messages: ChatMessage[]): Promise<void> {
    try {
      const existingHistory = await this.storage.get<ChatMessage[]>('chat-history') || [];
      const newHistory = [...existingHistory, ...messages].slice(-100);
      await this.storage.set('chat-history', newHistory);
    } catch (error) {
      this.logger.warn(
        'Failed to save to history',
        error instanceof Error ? error : undefined
      );
    }
  }
}