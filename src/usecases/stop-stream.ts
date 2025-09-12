import { ChatGateway, Logger } from '../domain/ports.js';

export class StopStreamUseCase {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly logger: Logger
  ) {}

  execute(): void {
    this.logger.info('Stopping stream');
    this.chatGateway.stopStream();
  }
}