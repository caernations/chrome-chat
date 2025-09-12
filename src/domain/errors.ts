export class ChatError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export class ConfigurationError extends ChatError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIGURATION_ERROR', cause);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends ChatError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', cause);
    this.name = 'NetworkError';
  }
}

export class StreamError extends ChatError {
  constructor(message: string, cause?: Error) {
    super(message, 'STREAM_ERROR', cause);
    this.name = 'StreamError';
  }
}

export class StorageError extends ChatError {
  constructor(message: string, cause?: Error) {
    super(message, 'STORAGE_ERROR', cause);
    this.name = 'StorageError';
  }
}