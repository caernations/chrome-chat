import { ChatGateway } from '../../domain/ports.js';
import { ChatMessage, ChatParams, StreamDelta } from '../../domain/message.js';
import { NetworkError, StreamError } from '../../domain/errors.js';
import { StreamParser } from '../../shared/utils/stream-parser.js';

export interface FireworksMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FireworksRequest {
  model: string;
  messages: FireworksMessage[];
  temperature?: number;
  max_tokens?: number;
  stream: boolean;
}

export class FireworksClient implements ChatGateway {
  private readonly baseUrl = 'https://api.fireworks.ai/inference/v1';
  private abortController: AbortController | null = null;
  private readonly parser = new StreamParser();

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Fireworks API key is required');
    }
  }

  async *startStream(
    messages: ChatMessage[],
    params: ChatParams
  ): AsyncIterable<StreamDelta> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.parser.reset();

    const request: FireworksRequest = {
      model: params.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new NetworkError(
          `Fireworks API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      if (!response.body) {
        throw new StreamError('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const deltas = this.parser.parseChunk(chunk);
          
          for (const delta of deltas) {
            yield delta;
            if (delta.finished) {
              return;
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        throw new StreamError(
          'Error reading stream',
          error instanceof Error ? error : undefined
        );
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  stopStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}