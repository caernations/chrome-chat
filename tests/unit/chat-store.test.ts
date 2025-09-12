import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatStore, ChatEvent } from '../../src/features/chat/state/chat-store';
import { ChatMessage } from '../../src/domain/message';

describe('ChatStore', () => {
  let store: ChatStore;

  beforeEach(() => {
    store = new ChatStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      
      expect(state.messages).toEqual([]);
      expect(state.isStreaming).toBe(false);
      expect(state.currentStreamContent).toBe('');
      expect(state.metrics).toEqual({});
      expect(state.error).toBeNull();
    });
  });

  describe('MESSAGE_ADDED', () => {
    it('should add message to state', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      store.dispatch({ type: 'MESSAGE_ADDED', payload: message });
      
      const state = store.getState();
      expect(state.messages).toContain(message);
      expect(state.error).toBeNull();
    });
  });

  describe('STREAM_STARTED', () => {
    it('should set streaming state', () => {
      store.dispatch({ type: 'STREAM_STARTED' });
      
      const state = store.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.currentStreamContent).toBe('');
      expect(state.metrics).toEqual({});
      expect(state.error).toBeNull();
    });
  });

  describe('STREAM_DELTA', () => {
    it('should append to current stream content', () => {
      store.dispatch({ type: 'STREAM_STARTED' });
      store.dispatch({ type: 'STREAM_DELTA', payload: 'Hello' });
      store.dispatch({ type: 'STREAM_DELTA', payload: ' world' });
      
      const state = store.getState();
      expect(state.currentStreamContent).toBe('Hello world');
    });
  });

  describe('STREAM_ENDED', () => {
    it('should create assistant message and update state', () => {
      store.dispatch({ type: 'STREAM_STARTED' });
      store.dispatch({ type: 'STREAM_DELTA', payload: 'Hello world' });
      
      const metrics = { tokenCount: 10, latencyMs: 500 };
      store.dispatch({ type: 'STREAM_ENDED', payload: metrics });
      
      const state = store.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.currentStreamContent).toBe('');
      expect(state.metrics).toEqual(metrics);
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe('assistant');
      expect(state.messages[0].content).toBe('Hello world');
    });
  });

  describe('STREAM_ERROR', () => {
    it('should set error and stop streaming', () => {
      store.dispatch({ type: 'STREAM_STARTED' });
      store.dispatch({ type: 'STREAM_ERROR', payload: 'Network error' });
      
      const state = store.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.currentStreamContent).toBe('');
      expect(state.error).toBe('Network error');
    });
  });

  describe('HISTORY_LOADED', () => {
    it('should replace messages with loaded history', () => {
      const messages: ChatMessage[] = [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
      ];

      store.dispatch({ type: 'HISTORY_LOADED', payload: messages });
      
      const state = store.getState();
      expect(state.messages).toEqual(messages);
    });
  });

  describe('HISTORY_CLEARED', () => {
    it('should clear all messages', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      store.dispatch({ type: 'MESSAGE_ADDED', payload: message });
      store.dispatch({ type: 'HISTORY_CLEARED' });
      
      const state = store.getState();
      expect(state.messages).toEqual([]);
    });
  });

  describe('ERROR_CLEARED', () => {
    it('should clear error state', () => {
      store.dispatch({ type: 'STREAM_ERROR', payload: 'Some error' });
      store.dispatch({ type: 'ERROR_CLEARED' });
      
      const state = store.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('subscription', () => {
    it('should notify subscribers on state change', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      store.dispatch({ type: 'MESSAGE_ADDED', payload: message });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([message])
        })
      );

      unsubscribe();
      listener.mockClear();
      
      store.dispatch({ type: 'ERROR_CLEARED' });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not notify if state does not change', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.dispatch({ type: 'ERROR_CLEARED' }); 
      expect(listener).not.toHaveBeenCalled();
    });
  });
});