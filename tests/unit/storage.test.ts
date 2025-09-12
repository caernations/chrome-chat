import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChromeSyncStorage } from '../../src/adapters/storage/chrome-storage';
import { ConfigStorage } from '../../src/adapters/storage/config-storage';
import { StorageError } from '../../src/domain/errors';

describe('ChromeSyncStorage', () => {
  let storage: ChromeSyncStorage;

  beforeEach(() => {
    storage = new ChromeSyncStorage();
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve value from chrome.storage.sync', async () => {
      const testValue = { foo: 'bar' };
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({ testKey: testValue });

      const result = await storage.get('testKey');
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('testKey');
      expect(result).toEqual(testValue);
    });

    it('should return undefined for non-existent key', async () => {
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({});

      const result = await storage.get('nonExistent');
      
      expect(result).toBeUndefined();
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('Storage failed');
      vi.mocked(chrome.storage.sync.get).mockRejectedValue(error);

      await expect(storage.get('testKey')).rejects.toThrow(StorageError);
    });
  });

  describe('set', () => {
    it('should store value in chrome.storage.sync', async () => {
      const testValue = { foo: 'bar' };
      vi.mocked(chrome.storage.sync.set).mockResolvedValue();

      await storage.set('testKey', testValue);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ testKey: testValue });
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('Storage failed');
      vi.mocked(chrome.storage.sync.set).mockRejectedValue(error);

      await expect(storage.set('testKey', 'value')).rejects.toThrow(StorageError);
    });
  });
});

describe('ConfigStorage', () => {
  let configStorage: ConfigStorage;
  let mockStorage: ChromeSyncStorage;

  beforeEach(() => {
    mockStorage = new ChromeSyncStorage();
    configStorage = new ConfigStorage(mockStorage);
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default config when no stored config exists', async () => {
      vi.spyOn(mockStorage, 'get').mockResolvedValue(undefined);

      const config = await configStorage.getConfig();

      expect(config.modelId).toBe('accounts/fireworks/models/llama-v3p1-70b-instruct');
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(2048);
      expect(config.windowMode).toBe('doc-pip');
    });

    it('should merge stored config with defaults', async () => {
      const storedConfig = {
        fireworksApiKey: 'test-key',
        temperature: 0.9,
      };
      vi.spyOn(mockStorage, 'get').mockResolvedValue(storedConfig);

      const config = await configStorage.getConfig();

      expect(config.fireworksApiKey).toBe('test-key');
      expect(config.temperature).toBe(0.9);
      expect(config.modelId).toBe('accounts/fireworks/models/llama-v3p1-70b-instruct'); // default
    });
  });

  describe('setConfig', () => {
    it('should update config with new values', async () => {
      const existingConfig = {
        fireworksApiKey: 'old-key',
        temperature: 0.7,
      };
      const newConfig = {
        fireworksApiKey: 'new-key',
        maxTokens: 1024,
      };

      vi.spyOn(mockStorage, 'get').mockResolvedValue(existingConfig);
      vi.spyOn(mockStorage, 'set').mockResolvedValue();

      await configStorage.setConfig(newConfig);

      expect(mockStorage.set).toHaveBeenCalledWith(
        'ai-chat-config',
        expect.objectContaining({
          fireworksApiKey: 'new-key',
          maxTokens: 1024,
          temperature: 0.7, 
        })
      );
    });
  });
});