import { ChatMessage, ChatMetrics } from '../../../domain/message.js';

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamContent: string;
  metrics: ChatMetrics;
  error: string | null;
}

export type ChatEvent = 
  | { type: 'MESSAGE_ADDED'; payload: ChatMessage }
  | { type: 'STREAM_STARTED' }
  | { type: 'STREAM_DELTA'; payload: string }
  | { type: 'STREAM_ENDED'; payload: ChatMetrics }
  | { type: 'STREAM_ERROR'; payload: string }
  | { type: 'HISTORY_LOADED'; payload: ChatMessage[] }
  | { type: 'HISTORY_CLEARED' }
  | { type: 'ERROR_CLEARED' };

export class ChatStore {
  private state: ChatState = {
    messages: [],
    isStreaming: false,
    currentStreamContent: '',
    metrics: {},
    error: null,
  };

  private listeners: Array<(state: ChatState) => void> = [];

  getState(): ChatState {
    return { ...this.state };
  }

  subscribe(listener: (state: ChatState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  dispatch(event: ChatEvent): void {
    const newState = this.reduce(this.state, event);
    if (newState !== this.state) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  private reduce(state: ChatState, event: ChatEvent): ChatState {
    switch (event.type) {
      case 'MESSAGE_ADDED':
        return {
          ...state,
          messages: [...state.messages, event.payload],
          error: null,
        };

      case 'STREAM_STARTED':
        return {
          ...state,
          isStreaming: true,
          currentStreamContent: '',
          metrics: {},
          error: null,
        };

      case 'STREAM_DELTA':
        return {
          ...state,
          currentStreamContent: state.currentStreamContent + event.payload,
        };

      case 'STREAM_ENDED':
        const assistantMessage: ChatMessage = {
          id: this.generateId(),
          role: 'assistant',
          content: state.currentStreamContent,
          timestamp: Date.now(),
        };

        return {
          ...state,
          isStreaming: false,
          currentStreamContent: '',
          messages: [...state.messages, assistantMessage],
          metrics: event.payload,
        };

      case 'STREAM_ERROR':
        return {
          ...state,
          isStreaming: false,
          currentStreamContent: '',
          error: event.payload,
        };

      case 'HISTORY_LOADED':
        return {
          ...state,
          messages: event.payload,
        };

      case 'HISTORY_CLEARED':
        return {
          ...state,
          messages: [],
        };

      case 'ERROR_CLEARED':
        return {
          ...state,
          error: null,
        };

      default:
        return state;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}