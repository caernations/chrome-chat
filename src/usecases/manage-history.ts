import { Logger, StoragePort } from '../domain/ports.js';
import { ChatMessage } from '../domain/message.js';

export class LoadHistoryUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly logger: Logger
  ) {}

  async execute(): Promise<ChatMessage[]> {
    try {
      const history = await this.storage.get<ChatMessage[]>('chat-history');
      this.logger.debug('Loaded chat history', { count: history?.length || 0 });
      return history || [];
    } catch (error) {
      this.logger.error(
        'Failed to load history',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }
}

export class ClearHistoryUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly logger: Logger
  ) {}

  async execute(): Promise<void> {
    try {
      await this.storage.remove('chat-history');
      this.logger.info('Cleared chat history');
    } catch (error) {
      this.logger.error(
        'Failed to clear history',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }
}