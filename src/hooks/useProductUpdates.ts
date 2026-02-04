import { useEffect, useRef, useState } from 'react';

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

interface UseProductUpdatesOptions {
  onUpdate?: (event: ProductUpdateEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export function useProductUpdates(options: UseProductUpdatesOptions = {}) {
  const {
    onUpdate,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectDelay = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ProductUpdateEvent | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));

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
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data: ProductUpdateEvent = JSON.parse(event.data);
          setLastUpdate(data);
          
          if (data.type !== 'connected') {
            onUpdate?.(data);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost');
        onDisconnect?.();
        
        eventSource.close();
        
        // Auto-reconnect if enabled
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionError('Failed to connect');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
  };

  const reconnect = () => {
    disconnect();
    connect();
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
    connectionError,
    connect,
    disconnect,
    reconnect
  };
}