import { StreamError } from '../../domain/errors.js';
import { StreamDelta } from '../../domain/message.js';

export interface FireworksStreamChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

export class StreamParser {
  private buffer = '';

  parseChunk(chunk: string): StreamDelta[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    const deltas: StreamDelta[] = [];

    for (const line of lines) {
      if (line.trim() === '') continue;
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data.trim() === '[DONE]') {
          deltas.push({ content: '', finished: true });
          continue;
        }

        try {
          const parsed: FireworksStreamChunk = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (choice?.delta?.content) {
            deltas.push({
              content: choice.delta.content,
              finished: false,
            });
          }
          if (choice?.finish_reason) {
            deltas.push({ content: '', finished: true });
          }
        } catch (error) {
          throw new StreamError(
            `Failed to parse stream chunk: ${data}`,
            error instanceof Error ? error : undefined
          );
        }
      }
    }

    return deltas;
  }

  reset(): void {
    this.buffer = '';
  }
}