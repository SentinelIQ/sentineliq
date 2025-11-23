import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import { createLogger } from '../core/logs/logger';
import { notificationEventBus } from '../core/notifications/eventBus';
import type { WorkspaceEvent } from '../core/notifications/types';
import { prisma } from 'wasp/server';

// Lazy initialization to avoid circular dependency issues
let _logger: any = null;
const getLogger = () => {
  if (!_logger) _logger = createLogger('notification-ws');
  return _logger;
};

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  workspaceId?: string;
  isAlive?: boolean;
}

interface ClientConnection {
  ws: AuthenticatedWebSocket;
  userId: string;
  workspaceId: string;
}

/**
 * WebSocket Server for real-time notifications
 */
class NotificationWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, ClientConnection[]> = new Map(); // userId -> connections
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/notifications'
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    // Setup heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          this.removeConnection(ws);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    // Register with notification event bus
    this.registerEventBusHandler();

    getLogger().info('WebSocket server initialized for notifications', {
      path: '/ws/notifications',
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: AuthenticatedWebSocket) {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error: any) {
        getLogger().error('Failed to parse WebSocket message', {
          error: error.message,
        });
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      this.removeConnection(ws);
    });

    ws.on('error', (error) => {
      getLogger().error('WebSocket error', { error: error.message });
      this.removeConnection(ws);
    });

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to notification server',
    }));
  }

  /**
   * Handle messages from client
   */
  private async handleMessage(ws: AuthenticatedWebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case 'auth':
        await this.handleAuth(ws, payload);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'subscribe':
        // Client can switch workspace
        if (ws.userId && payload.workspaceId) {
          await this.handleWorkspaceSwitch(ws, payload.workspaceId);
        }
        break;

      default:
        getLogger().warn('Unknown message type', { type });
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuth(ws: AuthenticatedWebSocket, payload: any) {
    const { userId, workspaceId, token } = payload;

    if (!userId || !workspaceId) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Missing userId or workspaceId',
      }));
      return;
    }

    try {
      // Verify user has access to workspace
      const member = await prisma.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId,
        },
      });

      if (!member) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'User not authorized for this workspace',
        }));
        ws.close();
        return;
      }

      // Authenticate the connection
      ws.userId = userId;
      ws.workspaceId = workspaceId;

      // Add to connections map
      this.addConnection(ws, userId, workspaceId);

      // Send auth success
      ws.send(JSON.stringify({
        type: 'auth_success',
        userId,
        workspaceId,
      }));

      // Send unread count
      const unreadCount = await this.getUnreadCount(userId, workspaceId);
      ws.send(JSON.stringify({
        type: 'unread_count',
        count: unreadCount,
      }));

      getLogger().info('WebSocket authenticated', { userId, workspaceId });
    } catch (error: any) {
      getLogger().error('Auth failed', { error: error.message, userId, workspaceId });
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed',
      }));
      ws.close();
    }
  }

  /**
   * Handle workspace switch
   */
  private async handleWorkspaceSwitch(ws: AuthenticatedWebSocket, newWorkspaceId: string) {
    if (!ws.userId) return;

    try {
      // Verify access to new workspace
      const member = await prisma.workspaceMember.findFirst({
        where: {
          userId: ws.userId,
          workspaceId: newWorkspaceId,
        },
      });

      if (!member) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not authorized for this workspace',
        }));
        return;
      }

      // Remove from old workspace
      if (ws.workspaceId) {
        this.removeConnection(ws);
      }

      // Add to new workspace
      ws.workspaceId = newWorkspaceId;
      this.addConnection(ws, ws.userId, newWorkspaceId);

      // Send unread count for new workspace
      const unreadCount = await this.getUnreadCount(ws.userId, newWorkspaceId);
      ws.send(JSON.stringify({
        type: 'workspace_switched',
        workspaceId: newWorkspaceId,
        unreadCount,
      }));

      getLogger().info('Workspace switched', {
        userId: ws.userId,
        workspaceId: newWorkspaceId,
      });
    } catch (error: any) {
      getLogger().error('Workspace switch failed', {
        error: error.message,
        userId: ws.userId,
        workspaceId: newWorkspaceId,
      });
    }
  }

  /**
   * Add connection to tracking map
   */
  private addConnection(ws: AuthenticatedWebSocket, userId: string, workspaceId: string) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, []);
    }

    this.connections.get(userId)!.push({
      ws,
      userId,
      workspaceId,
    });

    getLogger().debug('Connection added', {
      userId,
      workspaceId,
      totalConnections: this.connections.get(userId)!.length,
    });
  }

  /**
   * Remove connection from tracking map
   */
  private removeConnection(ws: AuthenticatedWebSocket) {
    if (!ws.userId) return;

    const userConnections = this.connections.get(ws.userId);
    if (!userConnections) return;

    const index = userConnections.findIndex(conn => conn.ws === ws);
    if (index !== -1) {
      userConnections.splice(index, 1);
      
      if (userConnections.length === 0) {
        this.connections.delete(ws.userId);
      }

      getLogger().debug('Connection removed', {
        userId: ws.userId,
        remainingConnections: userConnections.length,
      });
    }
  }

  /**
   * Register handler with notification event bus
   */
  private registerEventBusHandler() {
    notificationEventBus.on('*', async (event: WorkspaceEvent) => {
      // Only emit real-time updates for events that create in-app notifications
      if (!event.notificationData) return;

      try {
        await this.broadcastNotification(event);
      } catch (error: any) {
        getLogger().error('Failed to broadcast notification', {
          error: error.message,
          eventType: event.eventType,
        });
      }
    });
  }

  /**
   * Broadcast notification to relevant users
   */
  private async broadcastNotification(event: WorkspaceEvent) {
    const { workspaceId, userId: actorId, notificationData } = event;

    if (!notificationData) return;

    // Get all workspace members (excluding the actor)
    const members = await prisma.workspaceMember.findMany({
      where: { 
        workspaceId,
        userId: actorId ? { not: actorId } : undefined,
      },
      select: { userId: true },
    });

    // Get latest notification for each user
    const notifications = await prisma.notification.findMany({
      where: {
        workspaceId,
        eventType: event.eventType,
        userId: { in: members.map(m => m.userId) },
      },
      orderBy: { createdAt: 'desc' },
      take: members.length,
    });

    // Send to each connected user
    let sentCount = 0;
    for (const member of members) {
      const notification = notifications.find(n => n.userId === member.userId);
      if (notification) {
        const sent = this.sendToUser(member.userId, workspaceId, {
          type: 'new_notification',
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            createdAt: notification.createdAt,
            isRead: false,
          },
        });

        if (sent) sentCount++;
      }
    }

    if (sentCount > 0) {
      getLogger().info('Notification broadcasted', {
        workspaceId,
        eventType: event.eventType,
        recipientCount: sentCount,
      });
    }
  }

  /**
   * Send message to specific user in specific workspace
   */
  private sendToUser(userId: string, workspaceId: string, data: any): boolean {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.length === 0) {
      return false;
    }

    // Send to all connections for this user in this workspace
    let sent = false;
    for (const conn of userConnections) {
      if (conn.workspaceId === workspaceId && conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(JSON.stringify(data));
          sent = true;
        } catch (error: any) {
          getLogger().error('Failed to send to user', {
            error: error.message,
            userId,
            workspaceId,
          });
        }
      }
    }

    return sent;
  }

  /**
   * Broadcast to all users in a workspace
   */
  broadcastToWorkspace(workspaceId: string, data: any) {
    let sentCount = 0;

    for (const [userId, connections] of this.connections.entries()) {
      for (const conn of connections) {
        if (conn.workspaceId === workspaceId && conn.ws.readyState === WebSocket.OPEN) {
          try {
            conn.ws.send(JSON.stringify(data));
            sentCount++;
          } catch (error: any) {
            getLogger().error('Failed to broadcast to workspace', {
              error: error.message,
              userId,
              workspaceId,
            });
          }
        }
      }
    }

    if (sentCount > 0) {
      getLogger().debug('Broadcasted to workspace', { workspaceId, recipientCount: sentCount });
    }
  }

  /**
   * Notify user when notification is marked as read
   */
  notifyMarkAsRead(userId: string, workspaceId: string, notificationId: string) {
    this.sendToUser(userId, workspaceId, {
      type: 'notification_read',
      notificationId,
    });
  }

  /**
   * Notify user of updated unread count
   */
  async notifyUnreadCount(userId: string, workspaceId: string) {
    const count = await this.getUnreadCount(userId, workspaceId);
    this.sendToUser(userId, workspaceId, {
      type: 'unread_count',
      count,
    });
  }

  /**
   * Get unread notification count
   */
  private async getUnreadCount(userId: string, workspaceId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        workspaceId,
        isRead: false,
      },
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    let totalConnections = 0;
    for (const connections of this.connections.values()) {
      totalConnections += connections.length;
    }

    return {
      totalUsers: this.connections.size,
      totalConnections,
      clients: this.wss?.clients.size || 0,
    };
  }

  /**
   * Shutdown server
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.wss?.clients.forEach((ws) => {
      ws.close();
    });

    this.wss?.close(() => {
      getLogger().info('WebSocket server closed');
    });

    this.connections.clear();
  }
}

// Singleton instance
export const notificationWebSocketServer = new NotificationWebSocketServer();

// Export for use in operations
export { NotificationWebSocketServer };
