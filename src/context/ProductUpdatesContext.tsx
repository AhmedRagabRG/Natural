'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';

interface ProductUpdateEvent {
  type: 'connected' | 'product_updated' | 'product_created' | 'product_deleted';
  data?: {
    product_id?: number;
    category_id?: number;
    [key: string]: unknown;
  };
  timestamp: number;
  clientId?: string;
}

type UpdateListener = (event: ProductUpdateEvent) => void;

interface ProductUpdatesContextType {
  isConnected: boolean;
  lastUpdate: ProductUpdateEvent | null;
  connectionError: string | null;
  subscribe: (listener: UpdateListener) => () => void;
}

const ProductUpdatesContext = createContext<ProductUpdatesContextType>({
  isConnected: false,
  lastUpdate: null,
  connectionError: null,
  subscribe: () => () => {},
});

export function ProductUpdatesProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ProductUpdateEvent | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));
  const listenersRef = useRef<Set<UpdateListener>>(new Set());

  const subscribe = useCallback((listener: UpdateListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const eventSource = new EventSource(
          `/api/products/updates?clientId=${clientIdRef.current}`
        );
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setConnectionError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data: ProductUpdateEvent = JSON.parse(event.data);
            setLastUpdate(data);

            if (data.type !== 'connected') {
              listenersRef.current.forEach((listener) => listener(data));
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setConnectionError('Connection lost');
          eventSource.close();

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        setConnectionError('Failed to connect');
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return (
    <ProductUpdatesContext.Provider value={{ isConnected, lastUpdate, connectionError, subscribe }}>
      {children}
    </ProductUpdatesContext.Provider>
  );
}

/**
 * Hook to subscribe to product updates from the shared SSE connection.
 * No new EventSource is created — all consumers share a single connection.
 */
export function useSharedProductUpdates(options: {
  onUpdate?: (event: ProductUpdateEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
} = {}) {
  const { isConnected, lastUpdate, connectionError, subscribe } = useContext(ProductUpdatesContext);
  const { onUpdate, onConnect, onDisconnect } = options;

  // Subscribe to update events
  useEffect(() => {
    if (!onUpdate) return;
    return subscribe(onUpdate);
  }, [subscribe, onUpdate]);

  // Notify connect/disconnect
  const prevConnected = useRef(isConnected);
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      onConnect?.();
    } else if (!isConnected && prevConnected.current) {
      onDisconnect?.();
    }
    prevConnected.current = isConnected;
  }, [isConnected, onConnect, onDisconnect]);

  return { isConnected, lastUpdate, connectionError };
}
