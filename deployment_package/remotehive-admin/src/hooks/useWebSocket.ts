'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectBackoffRate?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  enableExponentialBackoff?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
  onReconnectFailed?: () => void;
  shouldReconnect?: (closeEvent: CloseEvent) => boolean;
}

export interface WebSocketState {
  socket: WebSocket | null;
  lastMessage: WebSocketMessage | null;
  readyState: number;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectCount: number;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  connectionDuration: number;
  totalReconnectAttempts: number;
  isReconnecting: boolean;
  currentReconnectInterval: number;
}

const READY_STATE_CONNECTING = 0;
const READY_STATE_OPEN = 1;
const READY_STATE_CLOSING = 2;
const READY_STATE_CLOSED = 3;

export const useWebSocket = (options: WebSocketOptions) => {
  const {
    url,
    protocols,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    maxReconnectInterval = 30000,
    reconnectBackoffRate = 1.5,
    heartbeatInterval = 30000,
    connectionTimeout = 10000,
    enableExponentialBackoff = true,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnectAttempt,
    onReconnectFailed,
    shouldReconnect
  } = options;

  const [state, setState] = useState<WebSocketState>({
    socket: null,
    lastMessage: null,
    readyState: READY_STATE_CLOSED,
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectCount: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    connectionDuration: 0,
    totalReconnectAttempts: 0,
    isReconnecting: false,
    currentReconnectInterval: reconnectInterval
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentReconnectIntervalRef = useRef(reconnectInterval);
  const connectedAtRef = useRef<number | null>(null);

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((socket: WebSocket) => {
    if (heartbeatInterval > 0) {
      heartbeatTimeoutRef.current = setTimeout(() => {
        if (socket.readyState === READY_STATE_OPEN) {
          socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
          startHeartbeat(socket);
        }
      }, heartbeatInterval);
    }
  }, [heartbeatInterval]);

  const connect = useCallback(() => {
    if (state.isConnecting || state.isConnected) {
      return;
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      isConnected: false,
      readyState: READY_STATE_CONNECTING,
      error: null,
      isReconnecting: reconnectCountRef.current > 0
    }));

    try {
      const socket = new WebSocket(url, protocols);

      // Guard against hanging CONNECTING state
      if (connectionTimeout > 0) {
        connectionTimeoutRef.current = setTimeout(() => {
          try {
            if (socket.readyState === READY_STATE_CONNECTING) {
              socket.close(4000, 'Connection timeout');
            }
          } catch (e) {
            // no-op
          }
        }, connectionTimeout);
      }

      socket.onopen = (event) => {
        console.log('WebSocket connected:', url);
        reconnectCountRef.current = 0;
        currentReconnectIntervalRef.current = reconnectInterval;
        connectedAtRef.current = Date.now();
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setState(prev => ({
          ...prev,
          socket,
          readyState: socket.readyState,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectCount: 0,
          lastConnectedAt: new Date(),
          isReconnecting: false,
          currentReconnectInterval: reconnectInterval,
          connectionDuration: 0
        }));
        startHeartbeat(socket);
        onOpen?.(event);
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        clearTimeouts();

        const now = Date.now();
        const duration = connectedAtRef.current ? now - connectedAtRef.current : 0;
        connectedAtRef.current = null;

        setState(prev => ({
          ...prev,
          socket: null,
          readyState: READY_STATE_CLOSED,
          isConnected: false,
          isConnecting: false,
          reconnectCount: reconnectCountRef.current,
          lastDisconnectedAt: new Date(),
          connectionDuration: duration
        }));
        onClose?.(event);

        const underMaxAttempts = reconnectCountRef.current < reconnectAttempts;
        const normalClosure = event.code === 1000;
        const canReconnectByPolicy = shouldReconnect ? shouldReconnect(event) : true;
        const shouldAttemptReconnect = shouldReconnectRef.current && canReconnectByPolicy && underMaxAttempts && !normalClosure;

        if (shouldAttemptReconnect) {
          reconnectCountRef.current++;
          const attemptNumber = reconnectCountRef.current;
          setState(prev => ({
            ...prev,
            totalReconnectAttempts: prev.totalReconnectAttempts + 1,
            isReconnecting: true
          }));
          onReconnectAttempt?.(attemptNumber, reconnectAttempts);

          const delay = currentReconnectIntervalRef.current;
          console.log(`Attempting to reconnect (${attemptNumber}/${reconnectAttempts}) in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);

          if (enableExponentialBackoff) {
            const next = Math.min(maxReconnectInterval!, Math.floor(currentReconnectIntervalRef.current * reconnectBackoffRate!));
            currentReconnectIntervalRef.current = next;
            setState(prev => ({ ...prev, currentReconnectInterval: next }));
          }
        } else if (!shouldAttemptReconnect && reconnectCountRef.current >= reconnectAttempts) {
          onReconnectFailed?.();
          setState(prev => ({ ...prev, isReconnecting: false }));
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false
        }));
        onError?.(event);
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'pong') {
            return;
          }
          setState(prev => ({
            ...prev,
            lastMessage: message
          }));
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      setState(prev => ({ ...prev, socket }));
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        isConnecting: false
      }));
    }
  }, [
    url,
    protocols,
    reconnectAttempts,
    reconnectInterval,
    maxReconnectInterval,
    reconnectBackoffRate,
    heartbeatInterval,
    connectionTimeout,
    enableExponentialBackoff,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnectAttempt,
    onReconnectFailed,
    shouldReconnect,
    startHeartbeat,
    clearTimeouts,
    state.isConnecting,
    state.isConnected
  ]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimeouts();

    if (state.socket) {
      state.socket.close(1000, 'Manual disconnect');
    }
    setState(prev => ({ ...prev, isReconnecting: false }));
  }, [state.socket, clearTimeouts]);

  const sendMessage = useCallback((message: any) => {
    if (state.socket && state.socket.readyState === READY_STATE_OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      state.socket.send(messageString);
      return true;
    }
    console.warn('WebSocket is not connected. Message not sent:', message);
    return false;
  }, [state.socket]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectCountRef.current = 0;
    currentReconnectIntervalRef.current = reconnectInterval;
    setState(prev => ({
      ...prev,
      isReconnecting: true,
      currentReconnectInterval: reconnectInterval
    }));
    setTimeout(connect, 100);
  }, [connect, disconnect, reconnectInterval]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      shouldReconnectRef.current = false;
      clearTimeouts();
      if (state.socket) {
        state.socket.close();
      }
    };
  }, []);

  // Update ready state when socket changes without polling
  useEffect(() => {
    if (state.socket) {
      setState(prev => ({
        ...prev,
        readyState: state.socket.readyState,
        isConnected: state.socket.readyState === READY_STATE_OPEN
      }));
    }
  }, [state.socket]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    getReadyState: () => state.readyState,
    getConnectionState: () => ({
      connecting: state.readyState === READY_STATE_CONNECTING,
      open: state.readyState === READY_STATE_OPEN,
      closing: state.readyState === READY_STATE_CLOSING,
      closed: state.readyState === READY_STATE_CLOSED
    })
  };
};

export default useWebSocket;