export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface StreamDelta {
  content: string;
  finished: boolean;
}

export interface ChatParams {
  temperature: number;
  maxTokens: number;
  model: string;
}

export interface ChatMetrics {
  tokenCount?: number;
  latencyMs?: number;
  tokensPerSecond?: number;
}