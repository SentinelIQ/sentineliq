import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from 'wasp/client/auth';

/**
 * Hook para conectar ao WebSocket e receber atualizações em tempo real do Eclipse
 * 
 * @example
 * ```tsx
 * const { isConnected, lastUpdate } = useEclipseRealtime({
 *   onAlertCreated: (data) => {
 *     // Recarregar lista de alertas
 *     refetch();
 *   },
 *   onBrandUpdated: (data) => {
 *     // Atualizar brand no estado
 *   }
 * });
 * ```
 */

export interface EclipseRealtimeOptions {
  workspaceId: string;
  onBrandCreated?: (data: any) => void;
  onBrandUpdated?: (data: any) => void;
  onBrandDeleted?: (data: any) => void;
  onMonitorStatusChanged?: (data: any) => void;
  onAlertCreated?: (data: any) => void;
  onAlertEscalated?: (data: any) => void;
  onInfringementCreated?: (data: any) => void;
  onInfringementUpdated?: (data: any) => void;
  onActionCreated?: (data: any) => void;
  onActionAssigned?: (data: any) => void;
  onAnyUpdate?: (eventType: string, data: any) => void;
}

export interface EclipseRealtimeState {
  isConnected: boolean;
  lastUpdate: {
    eventType: string;
    timestamp: string;
    data: any;
  } | null;
  connectionError: string | null;
}

export function useEclipseRealtime(options: EclipseRealtimeOptions): EclipseRealtimeState {
  const { data: user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const [state, setState] = useState<EclipseRealtimeState>({
    isConnected: false,
    lastUpdate: null,
    connectionError: null,
  });

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      // Filtrar apenas eventos Eclipse
      if (message.type !== 'eclipse_update') {
        return;
      }

      const { eventType, resourceType, resourceId, data, timestamp } = message;

      // Atualizar estado
      setState((prev) => ({
        ...prev,
        lastUpdate: { eventType, timestamp, data },
      }));

      // Disparar callbacks específicos
      switch (eventType) {
        case 'eclipse.brand.created':
          options.onBrandCreated?.(data);
          break;
        case 'eclipse.brand.updated':
          options.onBrandUpdated?.(data);
          break;
        case 'eclipse.brand.deleted':
          options.onBrandDeleted?.(data);
          break;
        case 'eclipse.monitor.status_changed':
          options.onMonitorStatusChanged?.(data);
          break;
        case 'eclipse.alert.created':
          options.onAlertCreated?.(data);
          break;
        case 'eclipse.alert.escalated':
          options.onAlertEscalated?.(data);
          break;
        case 'eclipse.infringement.created':
          options.onInfringementCreated?.(data);
          break;
        case 'eclipse.infringement.updated':
          options.onInfringementUpdated?.(data);
          break;
        case 'eclipse.action.created':
          options.onActionCreated?.(data);
          break;
        case 'eclipse.action.assigned':
          options.onActionAssigned?.(data);
          break;
      }

      // Callback genérico
      options.onAnyUpdate?.(eventType, data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [options]);

  const connect = useCallback(() => {
    if (!user?.id || !options.workspaceId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Eclipse WebSocket connected');
        
        // Autenticar
        ws.send(JSON.stringify({
          type: 'auth',
          payload: {
            userId: user.id,
            workspaceId: options.workspaceId,
          },
        }));

        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }));

        reconnectAttempts.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('Eclipse WebSocket error:', error);
        setState((prev) => ({
          ...prev,
          connectionError: 'Erro de conexão WebSocket',
        }));
      };

      ws.onclose = () => {
        console.log('Eclipse WebSocket disconnected');
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));

        // Tentar reconectar com backoff exponencial
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnecting... (attempt ${reconnectAttempts.current})`);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState((prev) => ({
        ...prev,
        connectionError: 'Falha ao criar conexão WebSocket',
      }));
    }
  }, [user, options.workspaceId, handleMessage]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return state;
}

/**
 * Hook simplificado para auto-refresh de queries quando houver atualizações Eclipse
 */
export function useEclipseAutoRefresh(workspaceId: string, refetchFn: () => void, resourceTypes?: string[]) {
  useEclipseRealtime({
    workspaceId,
    onAnyUpdate: (eventType, data) => {
      // Se resourceTypes especificado, filtrar
      if (resourceTypes && resourceTypes.length > 0) {
        const eventResourceType = eventType.split('.')[1]; // ex: 'eclipse.brand.created' -> 'brand'
        if (!resourceTypes.includes(eventResourceType)) {
          return;
        }
      }

      // Auto-refresh
      refetchFn();
    },
  });
}
