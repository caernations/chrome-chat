import { StorageError } from '../../domain/errors.js';
import { StoragePort } from '../../domain/ports.js';

export class ChromeSyncStorage implements StoragePort {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] as T | undefined;
    } catch (error) {
      throw new StorageError(
        `Failed to get value for key: ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      throw new StorageError(
        `Failed to set value for key: ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove key: ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      throw new StorageError(
        'Failed to clear storage',
        error instanceof Error ? error : undefined
      );
    }
  }
}

export class ChromeLocalStorage implements StoragePort {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] as T | undefined;
    } catch (error) {
      throw new StorageError(
        `Failed to get value for key: ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      throw new StorageError(
        `Failed to set value for key: ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove key: ${key}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      throw new StorageError(
        'Failed to clear storage',
        error instanceof Error ? error : undefined
      );
    }
  }
}