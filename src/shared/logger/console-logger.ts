import { Logger } from '../../domain/ports.js';

export class ConsoleLogger implements Logger {
  private readonly prefix = '[AI-Chat]';

  debug(message: string, ...args: unknown[]): void {
    console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix} [INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix} [WARN] ${message}`, ...args);
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (error) {
      console.error(`${this.prefix} [ERROR] ${message}`, error, ...args);
    } else {
      console.error(`${this.prefix} [ERROR] ${message}`, ...args);
    }
  }

  private redactSecrets(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactSecrets(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSecretKey(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = this.redactSecrets(value);
      }
    }
    return result;
  }

  private isSecretKey(key: string): boolean {
    const secretKeys = ['apikey', 'api_key', 'token', 'password', 'secret'];
    return secretKeys.some(secretKey => key.toLowerCase().includes(secretKey));
  }
}