import { ChatMessage, ChatParams, StreamDelta } from '../../domain/message.js';

export const MessageType = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  STREAM_DELTA: 'STREAM_DELTA',
  STREAM_END: 'STREAM_END',
  STREAM_ERROR: 'STREAM_ERROR',
  STOP_STREAM: 'STOP_STREAM',
  OPEN_FLOATING: 'OPEN_FLOATING',
  CLOSE_FLOATING: 'CLOSE_FLOATING',
  GET_CONFIG: 'GET_CONFIG',
  SET_CONFIG: 'SET_CONFIG',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  GET_HISTORY: 'GET_HISTORY',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export interface SendMessageRequest {
  type: typeof MessageType.SEND_MESSAGE;
  payload: {
    messages: ChatMessage[];
    params: ChatParams;
  };
}

export interface StreamDeltaMessage {
  type: typeof MessageType.STREAM_DELTA;
  payload: StreamDelta;
}

export interface StreamEndMessage {
  type: typeof MessageType.STREAM_END;
}

export interface StreamErrorMessage {
  type: typeof MessageType.STREAM_ERROR;
  payload: {
    error: string;
    code: string;
  };
}

export interface StopStreamRequest {
  type: typeof MessageType.STOP_STREAM;
}

export interface OpenFloatingRequest {
  type: typeof MessageType.OPEN_FLOATING;
}

export interface CloseFloatingRequest {
  type: typeof MessageType.CLOSE_FLOATING;
}

export interface GetConfigRequest {
  type: typeof MessageType.GET_CONFIG;
}

export interface SetConfigRequest {
  type: typeof MessageType.SET_CONFIG;
  payload: Record<string, unknown>;
}

export interface ClearHistoryRequest {
  type: typeof MessageType.CLEAR_HISTORY;
}

export interface GetHistoryRequest {
  type: typeof MessageType.GET_HISTORY;
}

export type RuntimeMessage =
  | SendMessageRequest
  | StreamDeltaMessage
  | StreamEndMessage
  | StreamErrorMessage
  | StopStreamRequest
  | OpenFloatingRequest
  | CloseFloatingRequest
  | GetConfigRequest
  | SetConfigRequest
  | ClearHistoryRequest
  | GetHistoryRequest;