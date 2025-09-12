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

export class DeduplicateHistoryUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly logger: Logger
  ) {}

  async execute(): Promise<void> {
    try {
      const history = await this.storage.get<ChatMessage[]>('chat-history') || [];
      const deduplicatedHistory = this.deduplicateMessages(history);
      
      if (deduplicatedHistory.length !== history.length) {
        await this.storage.set('chat-history', deduplicatedHistory);
        this.logger.info(`Deduplicated history: ${history.length} -> ${deduplicatedHistory.length} messages`);
      }
    } catch (error) {
      this.logger.error(
        'Failed to deduplicate chat history',
        error instanceof Error ? error : undefined
      );
    }
  }

  private deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
    const seen = new Set<string>();
    return messages.filter(message => {
      const key = `${message.role}-${message.content}-${message.timestamp}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}