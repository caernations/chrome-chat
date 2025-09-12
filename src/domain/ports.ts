import { ChatMessage, ChatParams, StreamDelta } from './message.js';

export interface ChatGateway {
  startStream(messages: ChatMessage[], params: ChatParams): AsyncIterable<StreamDelta>;
  stopStream(): void;
}

export interface StoragePort {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface RuntimePort {
  sendMessage<T = unknown, R = unknown>(message: T): Promise<R>;
  onMessage<T = unknown>(handler: (message: T, sender: chrome.runtime.MessageSender) => void | Promise<void>): void;
  openWindow(options: chrome.windows.CreateData): Promise<chrome.windows.Window>;
  closeWindow(windowId: number): Promise<void>;
  focusWindow(windowId: number): Promise<void>;
}

export interface WindowManagerPort {
  openFloatingChat(): Promise<void>;
  closeFloatingChat(): Promise<void>;
  isFloatingChatOpen(): Promise<boolean>;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
}