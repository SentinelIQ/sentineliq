/**
 * WebSocket Server Setup
 * Centralized module to initialize all WebSocket servers
 * Avoids circular dependencies and standardizes initialization
 */

import type { Server as HTTPServer } from 'http';
import { notificationWebSocketServer } from './notificationWebSocket';
import { initializeUploadWebSocket } from './uploadWebSocket';

/**
 * Initialize all WebSocket servers
 * Called by Wasp's serverSetup hook in sentry.ts
 */
export function setupWebSocket(server: HTTPServer): void {
  try {
    // Initialize notification WebSocket (native ws protocol)
    notificationWebSocketServer.initialize(server);
    (global as any).__notificationWebSocketServer = notificationWebSocketServer;
    console.log('✅ Notification WebSocket initialized on /ws/notifications');

    // Initialize upload WebSocket (Socket.IO protocol)
    const uploadIO = initializeUploadWebSocket(server);
    (global as any).__uploadWebSocketServer = uploadIO;
    console.log('✅ Upload WebSocket initialized on /socket.io/upload');
  } catch (error: any) {
    console.error('❌ Failed to initialize WebSocket servers:', error);
    throw error;
  }
}
