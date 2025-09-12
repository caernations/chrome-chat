import { ChromeSyncStorage } from '../adapters/storage/chrome-storage.js';
import { ConfigStorage } from '../adapters/storage/config-storage.js';
import { ConsoleLogger } from '../shared/logger/console-logger.js';
import { Config, ConfigSchema, PartialConfig } from '../shared/types/config.js';

class OptionsApp {
  private configStorage: ConfigStorage;
  private logger = new ConsoleLogger();
  private currentConfig: Config | null = null;

  constructor() {
    const storage = new ChromeSyncStorage();
    this.configStorage = new ConfigStorage(storage);
    this.logger.info('Options app initializing');
    this.init();
  }

  private init(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.render();
      });
    } else {
      this.render();
    }
  }

  private async render(): Promise<void> {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      this.logger.error('App container not found');
      return;
    }

    try {
      this.currentConfig = await this.configStorage.getConfig();
      this.renderOptionsForm(appContainer);
      this.setupEventListeners();
      this.logger.info('Options app initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize options app', error instanceof Error ? error : undefined);
      this.renderError(appContainer, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private renderOptionsForm(container: HTMLElement): void {
    container.innerHTML = `
      <div class="options-view">
        <div class="options-header">
          <h1>AI Chat Assistant Settings</h1>
          <p>Configure your chat assistant preferences and API settings.</p>
        </div>

        <form class="options-form" id="options-form">
          <div class="form-section">
            <h2>API Configuration</h2>
            
            <div class="form-field">
              <label for="fireworks-api-key">Fireworks API Key *</label>
              <div class="input-group">
                <input 
                  type="password" 
                  id="fireworks-api-key" 
                  name="fireworksApiKey"
                  value="${this.currentConfig?.fireworksApiKey || ''}" 
                  required
                  placeholder="Enter your Fireworks API key"
                />
                <button type="button" class="toggle-password" data-target="fireworks-api-key">
                  <span class="show-text">Show</span>
                  <span class="hide-text">Hide</span>
                </button>
              </div>
              <small class="field-help">
                Get your API key from <a href="https://fireworks.ai/account/api-keys" target="_blank">Fireworks AI Dashboard</a>
              </small>
            </div>

            <div class="form-field">
              <label for="model-id">Model</label>
              <select id="model-id" name="modelId">
                <option value="accounts/fireworks/models/llama-v3p1-70b-instruct" 
                  ${this.currentConfig?.modelId === 'accounts/fireworks/models/llama-v3p1-70b-instruct' ? 'selected' : ''}>
                  Llama 3.1 70B Instruct
                </option>
                <option value="accounts/fireworks/models/llama-v3p1-8b-instruct"
                  ${this.currentConfig?.modelId === 'accounts/fireworks/models/llama-v3p1-8b-instruct' ? 'selected' : ''}>
                  Llama 3.1 8B Instruct
                </option>
                <option value="accounts/fireworks/models/llama-v3p1-405b-instruct"
                  ${this.currentConfig?.modelId === 'accounts/fireworks/models/llama-v3p1-405b-instruct' ? 'selected' : ''}>
                  Llama 3.1 405B Instruct
                </option>
              </select>
              <small class="field-help">Choose the AI model for chat responses</small>
            </div>
          </div>

          <div class="form-section">
            <h2>Generation Parameters</h2>
            
            <div class="form-field">
              <label for="temperature">Temperature: <span class="value-display">${this.currentConfig?.temperature || 0.7}</span></label>
              <input 
                type="range" 
                id="temperature" 
                name="temperature" 
                min="0" 
                max="2" 
                step="0.1" 
                value="${this.currentConfig?.temperature || 0.7}"
              />
              <small class="field-help">Controls randomness (0 = deterministic, 2 = very creative)</small>
            </div>

            <div class="form-field">
              <label for="max-tokens">Max Tokens: <span class="value-display">${this.currentConfig?.maxTokens || 2048}</span></label>
              <input 
                type="range" 
                id="max-tokens" 
                name="maxTokens" 
                min="256" 
                max="8192" 
                step="256" 
                value="${this.currentConfig?.maxTokens || 2048}"
              />
              <small class="field-help">Maximum length of AI responses</small>
            </div>
          </div>

          <div class="form-section">
            <h2>Interface Settings</h2>
            
            <div class="form-field">
              <label for="window-mode">Window Mode</label>
              <select id="window-mode" name="windowMode">
                <option value="doc-pip" ${this.currentConfig?.windowMode === 'doc-pip' ? 'selected' : ''}>
                  Document Picture-in-Picture (Recommended)
                </option>
                <option value="popup" ${this.currentConfig?.windowMode === 'popup' ? 'selected' : ''}>
                  Popup Window
                </option>
              </select>
              <small class="field-help">How the floating chat window appears</small>
            </div>

            <div class="form-field">
              <label for="theme">Theme</label>
              <select id="theme" name="theme">
                <option value="auto" ${this.currentConfig?.theme === 'auto' ? 'selected' : ''}>
                  System Default
                </option>
                <option value="light" ${this.currentConfig?.theme === 'light' ? 'selected' : ''}>
                  Light
                </option>
                <option value="dark" ${this.currentConfig?.theme === 'dark' ? 'selected' : ''}>
                  Dark
                </option>
              </select>
              <small class="field-help">Choose your preferred color scheme</small>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" id="save-btn">
              <span class="btn-text">Save Settings</span>
              <span class="btn-saving" style="display: none;">Saving...</span>
            </button>
            <button type="button" class="btn-secondary" id="reset-btn">
              Reset to Defaults
            </button>
            <button type="button" class="btn-danger" id="clear-history-btn">
              Clear Chat History
            </button>
          </div>
        </form>

        <div class="status-message" id="status-message" style="display: none;">
          <div class="status-content">
            <span class="status-text"></span>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const form = document.getElementById('options-form') as HTMLFormElement;
    const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    const clearHistoryBtn = document.getElementById('clear-history-btn') as HTMLButtonElement;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    resetBtn.addEventListener('click', () => {
      this.resetToDefaults();
    });

    clearHistoryBtn.addEventListener('click', () => {
      this.clearChatHistory();
    });

    this.setupPasswordToggle();
    this.setupRangeInputs();
    this.setupFormValidation();
  }

  private setupPasswordToggle(): void {
    document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target;
        const input = document.getElementById(target!) as HTMLInputElement;
        const showText = button.querySelector('.show-text') as HTMLElement;
        const hideText = button.querySelector('.hide-text') as HTMLElement;

        if (input.type === 'password') {
          input.type = 'text';
          showText.style.display = 'none';
          hideText.style.display = 'inline';
        } else {
          input.type = 'password';
          showText.style.display = 'inline';
          hideText.style.display = 'none';
        }
      });
    });
  }

  private setupRangeInputs(): void {
    document.querySelectorAll('input[type="range"]').forEach(input => {
      const valueDisplay = input.parentElement?.querySelector('.value-display');
      
      input.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        if (valueDisplay) {
          valueDisplay.textContent = value;
        }
      });
    });
  }

  private setupFormValidation(): void {
    const apiKeyInput = document.getElementById('fireworks-api-key') as HTMLInputElement;
    
    apiKeyInput.addEventListener('input', () => {
      this.validateForm();
    });
  }

  private validateForm(): boolean {
    const apiKey = (document.getElementById('fireworks-api-key') as HTMLInputElement).value;
    const isValid = apiKey.trim().length > 0;
    
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    saveBtn.disabled = !isValid;
    
    return isValid;
  }

  private async saveSettings(): Promise<void> {
    if (!this.validateForm()) {
      this.showStatus('Please fill in all required fields', 'error');
      return;
    }

    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    const btnText = saveBtn.querySelector('.btn-text') as HTMLElement;
    const btnSaving = saveBtn.querySelector('.btn-saving') as HTMLElement;

    btnText.style.display = 'none';
    btnSaving.style.display = 'inline';
    saveBtn.disabled = true;

    try {
      const formData = new FormData(document.getElementById('options-form') as HTMLFormElement);
      const config: PartialConfig = {
        fireworksApiKey: formData.get('fireworksApiKey') as string,
        modelId: formData.get('modelId') as string,
        temperature: parseFloat(formData.get('temperature') as string),
        maxTokens: parseInt(formData.get('maxTokens') as string),
        windowMode: formData.get('windowMode') as 'doc-pip' | 'popup',
        theme: formData.get('theme') as 'light' | 'dark' | 'auto',
      };

      ConfigSchema.parse(config);

      await this.configStorage.setConfig(config);
      this.currentConfig = await this.configStorage.getConfig();
      
      this.showStatus('Settings saved successfully!', 'success');
      this.logger.info('Settings saved successfully');
    } catch (error) {
      this.logger.error('Failed to save settings', error instanceof Error ? error : undefined);
      this.showStatus(
        error instanceof Error ? error.message : 'Failed to save settings', 
        'error'
      );
    } finally {
      btnText.style.display = 'inline';
      btnSaving.style.display = 'none';
      saveBtn.disabled = false;
    }
  }

  private async resetToDefaults(): Promise<void> {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      await this.configStorage.clearConfig();
      this.currentConfig = await this.configStorage.getConfig();
      
      const container = document.getElementById('app') as HTMLElement;
      this.renderOptionsForm(container);
      this.setupEventListeners();
      
      this.showStatus('Settings reset to defaults', 'success');
    } catch (error) {
      this.logger.error('Failed to reset settings', error instanceof Error ? error : undefined);
      this.showStatus('Failed to reset settings', 'error');
    }
  }

  private async clearChatHistory(): Promise<void> {
    if (!confirm('Clear all chat history? This cannot be undone.')) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
      this.showStatus('Chat history cleared', 'success');
    } catch (error) {
      this.logger.error('Failed to clear chat history', error instanceof Error ? error : undefined);
      this.showStatus('Failed to clear chat history', 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    const statusMessage = document.getElementById('status-message') as HTMLElement;
    const statusText = statusMessage.querySelector('.status-text') as HTMLElement;
    
    statusText.textContent = message;
    statusMessage.className = `status-message status-message--${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }

  private renderError(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="error-container">
        <div class="error-content">
          <h3>Failed to Load Settings</h3>
          <p>${message}</p>
          <button onclick="window.location.reload()" class="error-retry">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

new OptionsApp();