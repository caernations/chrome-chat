import { ChromeRuntime } from '../adapters/runtime/chrome-runtime.js';
import { ChromeSyncStorage, ChromeLocalStorage } from '../adapters/storage/chrome-storage.js';
import { ConfigStorage } from '../adapters/storage/config-storage.js';
import { FireworksClient } from '../adapters/fireworks/client.js';
import { ConsoleLogger } from '../shared/logger/console-logger.js';
import { SendMessageUseCase } from '../usecases/send-message.js';
import { StopStreamUseCase } from '../usecases/stop-stream.js';
import { LoadHistoryUseCase, ClearHistoryUseCase } from '../usecases/manage-history.js';
import { ConfigurationError } from '../domain/errors.js';
import { 
  MessageType, 
  RuntimeMessage, 
  SendMessageRequest,
  StopStreamRequest,
  OpenFloatingRequest,
  CloseFloatingRequest,
  GetConfigRequest,
  SetConfigRequest,
  GetHistoryRequest,
  ClearHistoryRequest
} from '../shared/types/messages.js';

class BackgroundService {
  private runtime = new ChromeRuntime();
  private syncStorage = new ChromeSyncStorage();
  private localStorage = new ChromeLocalStorage();
  private configStorage = new ConfigStorage(this.syncStorage);
  private logger = new ConsoleLogger();
  
  private currentChatGateway: FireworksClient | null = null;
  private floatingWindowId: number | null = null;

  constructor() {
    this.runtime.onMessage(this.handleMessage.bind(this));
    this.setupActionHandler();
    this.logger.info('Background service initialized');
  }

  private setupActionHandler(): void {
    chrome.action.onClicked.addListener(async () => {
      try {
        await this.openFloatingChat();
      } catch (error) {
        this.logger.error('Failed to open floating chat', error instanceof Error ? error : undefined);
      }
    });
  }

  private async handleMessage(
    message: RuntimeMessage, 
    sender: chrome.runtime.MessageSender
  ): Promise<unknown> {
    try {
      switch (message.type) {
        case MessageType.SEND_MESSAGE:
          await this.handleSendMessage(message as SendMessageRequest, sender);
          return;
        
        case MessageType.STOP_STREAM:
          await this.handleStopStream(message as StopStreamRequest);
          return;
        
        case MessageType.OPEN_FLOATING:
          await this.handleOpenFloating(message as OpenFloatingRequest);
          return;
        
        case MessageType.CLOSE_FLOATING:
          await this.handleCloseFloating(message as CloseFloatingRequest);
          return;
        
        case MessageType.GET_CONFIG:
          return await this.handleGetConfig(message as GetConfigRequest);
        
        case MessageType.SET_CONFIG:
          await this.handleSetConfig(message as SetConfigRequest);
          return;
        
        case MessageType.GET_HISTORY:
          return await this.handleGetHistory(message as GetHistoryRequest);
        
        case MessageType.CLEAR_HISTORY:
          await this.handleClearHistory(message as ClearHistoryRequest);
          return;
        
        default:
          throw new Error(`Unknown message type: ${(message as { type: string }).type}`);
      }
    } catch (error) {
      this.logger.error('Error handling message', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  private async handleSendMessage(
    request: SendMessageRequest,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    const config = await this.configStorage.getConfig();
    
    if (!config.fireworksApiKey) {
      throw new ConfigurationError('Fireworks API key not configured');
    }

    this.currentChatGateway = new FireworksClient(config.fireworksApiKey);
    
    const sendMessageUseCase = new SendMessageUseCase(
      this.currentChatGateway,
      this.localStorage,
      this.logger
    );

    const chatParams = {
      model: request.payload.params.model || config.modelId,
      temperature: request.payload.params.temperature ?? config.temperature,
      maxTokens: request.payload.params.maxTokens || config.maxTokens,
    };

    try {
      for await (const delta of sendMessageUseCase.execute(
        request.payload.messages,
        chatParams
      )) {
        // Send to tab if from content script, or broadcast to all runtime contexts
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: MessageType.STREAM_DELTA,
            payload: delta,
          });
        } else {
          // Broadcast to all extension contexts (popup, etc.)
          chrome.runtime.sendMessage({
            type: MessageType.STREAM_DELTA,
            payload: delta,
          }).catch(() => {
            // Ignore error if no listeners
          });
        }
      }

      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: MessageType.STREAM_END,
        });
      } else {
        chrome.runtime.sendMessage({
          type: MessageType.STREAM_END,
        }).catch(() => {
          // Ignore error if no listeners
        });
      }
    } catch (error) {
      this.logger.error('Stream error', error instanceof Error ? error : undefined);
      
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: MessageType.STREAM_ERROR,
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
            code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN',
          },
        });
      } else {
        chrome.runtime.sendMessage({
          type: MessageType.STREAM_ERROR,
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
            code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN',
          },
        }).catch(() => {
          // Ignore error if no listeners
        });
      }
    }
  }

  private async handleStopStream(_request: StopStreamRequest): Promise<void> {
    if (this.currentChatGateway) {
      const stopStreamUseCase = new StopStreamUseCase(this.currentChatGateway, this.logger);
      stopStreamUseCase.execute();
    }
  }

  private async handleOpenFloating(_request: OpenFloatingRequest): Promise<void> {
    await this.openFloatingChat();
  }

  private async handleCloseFloating(_request: CloseFloatingRequest): Promise<void> {
    await this.closeFloatingChat();
  }

  private async handleGetConfig(_request: GetConfigRequest): Promise<unknown> {
    return this.configStorage.getConfig();
  }

  private async handleSetConfig(request: SetConfigRequest): Promise<void> {
    await this.configStorage.setConfig(request.payload);
  }

  private async handleGetHistory(_request: GetHistoryRequest): Promise<unknown> {
    const loadHistoryUseCase = new LoadHistoryUseCase(this.localStorage, this.logger);
    return loadHistoryUseCase.execute();
  }

  private async handleClearHistory(_request: ClearHistoryRequest): Promise<void> {
    const clearHistoryUseCase = new ClearHistoryUseCase(this.localStorage, this.logger);
    await clearHistoryUseCase.execute();
  }

  private async openFloatingChat(): Promise<void> {
    if (this.floatingWindowId) {
      try {
        await this.runtime.focusWindow(this.floatingWindowId);
        return;
      } catch {
        this.floatingWindowId = null;
      }
    }

    const config = await this.configStorage.getConfig();
    
    if (config.windowMode === 'doc-pip' && 'documentPictureInPicture' in window) {
      await this.openDocumentPiP();
    } else {
      await this.openPopupWindow();
    }
  }

  private async openDocumentPiP(): Promise<void> {
    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 420,
        height: 560,
      });

      pipWindow.document.head.innerHTML = `
        <title>AI Chat Assistant</title>
        <link rel="stylesheet" href="${chrome.runtime.getURL('styles.css')}">
      `;

      const response = await fetch(chrome.runtime.getURL('pip.html'));
      const html = await response.text();
      pipWindow.document.body.innerHTML = html;

      const script = pipWindow.document.createElement('script');
      script.type = 'module';
      script.src = chrome.runtime.getURL('src/platform/pip.js');
      pipWindow.document.head.appendChild(script);

      pipWindow.addEventListener('pagehide', () => {
        this.floatingWindowId = null;
      });

      this.logger.info('Document PiP window opened');
    } catch (error) {
      this.logger.error('Failed to open Document PiP, falling back to popup', error instanceof Error ? error : undefined);
      await this.openPopupWindow();
    }
  }

  private async openPopupWindow(): Promise<void> {
    const window = await this.runtime.openWindow({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 420,
      height: 560,
      focused: true,
    });

    if (window.id) {
      this.floatingWindowId = window.id;
      this.logger.info('Popup window opened', { windowId: window.id });
    }
  }

  private async closeFloatingChat(): Promise<void> {
    if (this.floatingWindowId) {
      try {
        await this.runtime.closeWindow(this.floatingWindowId);
        this.floatingWindowId = null;
        this.logger.info('Floating chat closed');
      } catch (error) {
        this.logger.error('Failed to close floating chat', error instanceof Error ? error : undefined);
      }
    }
  }
}

new BackgroundService();