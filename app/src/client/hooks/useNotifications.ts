import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from 'wasp/client/auth';
import useWorkspace from './useWorkspace';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  link?: string | null;
  createdAt: Date;
  isRead: boolean;
}

interface NotificationMessage {
  type: 'connected' | 'auth_success' | 'auth_error' | 'new_notification' | 'notification_read' | 'unread_count' | 'workspace_switched' | 'error' | 'pong';
  notification?: Notification;
  notificationId?: string;
  count?: number;
  message?: string;
  userId?: string;
  workspaceId?: string;
  unreadCount?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  reconnect: () => void;
}

/**
 * Hook for real-time notifications via WebSocket
 */
export function useNotifications(): UseNotificationsReturn {
  const { data: user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!user || !currentWorkspace) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/notifications`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Notifications] WebSocket connected');
        setIsConnecting(false);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Authenticate connection
        ws.send(JSON.stringify({
          type: 'auth',
          payload: {
            userId: user.id,
            workspaceId: currentWorkspace.id,
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('[Notifications] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Notifications] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('[Notifications] WebSocket closed');
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[Notifications] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };

      // Setup ping/pong for keepalive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // 30 seconds

      // Cleanup on unmount
      return () => {
        clearInterval(pingInterval);
      };
    } catch (err: any) {
      console.error('[Notifications] Failed to connect:', err);
      setIsConnecting(false);
      setError(err.message || 'Failed to connect');
    }
  }, [user, currentWorkspace]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((message: NotificationMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('[Notifications] Server acknowledged connection');
        break;

      case 'auth_success':
        console.log('[Notifications] Authenticated successfully');
        break;

      case 'auth_error':
        console.error('[Notifications] Authentication failed:', message.message);
        setError(message.message || 'Authentication failed');
        break;

      case 'new_notification':
        if (message.notification) {
          handleNewNotification(message.notification);
        }
        break;

      case 'notification_read':
        if (message.notificationId) {
          handleNotificationRead(message.notificationId);
        }
        break;

      case 'unread_count':
        if (typeof message.count === 'number') {
          setUnreadCount(message.count);
        }
        break;

      case 'workspace_switched':
        console.log('[Notifications] Workspace switched:', message.workspaceId);
        if (typeof message.unreadCount === 'number') {
          setUnreadCount(message.unreadCount);
        }
        // Clear existing notifications when switching workspace
        setNotifications([]);
        break;

      case 'error':
        console.error('[Notifications] Server error:', message.message);
        toast.error(message.message || 'Server error');
        break;

      case 'pong':
        // Keepalive response
        break;

      default:
        console.warn('[Notifications] Unknown message type:', message.type);
    }
  }, []);

  /**
   * Handle new notification
   */
  const handleNewNotification = useCallback((notification: Notification) => {
    // Add to local state
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast based on notification type
    const toastMessage = `${notification.title}: ${notification.message}`;
    
    switch (notification.type) {
      case 'CRITICAL':
      case 'ERROR':
        toast.error(toastMessage, {
          duration: 6000,
          action: notification.link ? {
            label: 'View',
            onClick: () => window.location.href = notification.link!,
          } : undefined,
        });
        break;

      case 'WARNING':
        toast.warning(toastMessage, {
          duration: 5000,
          action: notification.link ? {
            label: 'View',
            onClick: () => window.location.href = notification.link!,
          } : undefined,
        });
        break;

      case 'SUCCESS':
        toast.success(toastMessage, {
          duration: 4000,
        });
        break;

      case 'INFO':
      default:
        toast.info(toastMessage, {
          duration: 4000,
        });
        break;
    }
  }, []);

  /**
   * Handle notification marked as read
   */
  const handleNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Add notification manually (for testing or local-only notifications)
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    handleNotificationRead(notificationId);
    
    // Note: The actual database update should be done via the markAsRead operation
    // This is just for local state update
  }, [handleNotificationRead]);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    setError(null);
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    connect();
  }, [connect]);

  /**
   * Subscribe to workspace changes
   */
  useEffect(() => {
    if (isConnected && currentWorkspace && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        payload: {
          workspaceId: currentWorkspace.id,
        },
      }));
    }
  }, [currentWorkspace, isConnected]);

  /**
   * Connect on mount and cleanup on unmount
   */
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isConnecting,
    error,
    addNotification,
    markAsRead,
    clearAll,
    reconnect,
  };
}

export default useNotifications;
