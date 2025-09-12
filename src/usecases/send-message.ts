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

    let assistantContent = '';

    try {
      for await (const delta of this.chatGateway.startStream(messages, params)) {
        assistantContent += delta.content;
        yield delta;
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };

      await this.saveAssistantMessage(assistantMessage);
    } catch (error) {
      this.logger.error(
        'Failed to send message',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private async saveAssistantMessage(message: ChatMessage): Promise<void> {
    try {
      const existingHistory = await this.storage.get<ChatMessage[]>('chat-history') || [];
      const newHistory = [...existingHistory, message].slice(-100);
      await this.storage.set('chat-history', newHistory);
    } catch (error) {
      this.logger.warn(
        'Failed to save assistant message to history',
        error instanceof Error ? error : undefined
      );
    }
  }
}