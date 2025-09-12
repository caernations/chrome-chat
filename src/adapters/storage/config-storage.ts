import { StoragePort } from '../../domain/ports.js';
import { Config, ConfigSchema, PartialConfig } from '../../shared/types/config.js';

export class ConfigStorage {
  private static readonly CONFIG_KEY = 'ai-chat-config';

  constructor(private readonly storage: StoragePort) {}

  async getConfig(): Promise<Config> {
    const stored = await this.storage.get<PartialConfig>(ConfigStorage.CONFIG_KEY);
    return ConfigSchema.parse(stored || {});
  }

  async setConfig(config: PartialConfig): Promise<void> {
    const current = await this.getConfig();
    const updated = { ...current, ...config };
    const validated = ConfigSchema.parse(updated);
    await this.storage.set(ConfigStorage.CONFIG_KEY, validated);
  }

  async clearConfig(): Promise<void> {
    await this.storage.remove(ConfigStorage.CONFIG_KEY);
  }
}