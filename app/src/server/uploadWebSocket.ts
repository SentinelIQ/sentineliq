/**
 * WebSocket Server for Upload Progress Tracking
 * 
 * Provides real-time upload progress updates to clients.
 * Uses Socket.IO for WebSocket communication.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createLogger } from '../core/logs/logger';

// Lazy initialization to avoid circular dependency issues
let _logger: any = null;
const getLogger = () => {
  if (!_logger) _logger = createLogger('upload-websocket');
  return _logger;
};

/**
 * Progress event data
 */
export interface UploadProgressEvent {
  uploadId: string;
  workspaceId: string;
  userId: string;
  filename: string;
  progress: number; // 0-100
  bytesUploaded: number;
  totalBytes: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  error?: string;
}

/**
 * Get Socket.IO server instance from global
 */
function getUploadWebSocketInstance(): SocketIOServer | null {
  return (global as any).__uploadWebSocketServer || null;
}

/**
 * Initialize WebSocket server for upload progress
 * Called by websocketSetup.ts during server initialization
 */
export function initializeUploadWebSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/upload',
  });

  io.on('connection', (socket: Socket) => {
    getLogger().info('Client connected to upload WebSocket', {
      component: 'UploadWebSocket',
      socketId: socket.id,
    });

    // Join workspace-specific room for upload events
    socket.on('join-workspace', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      getLogger().debug('Client joined workspace room', {
        component: 'UploadWebSocket',
        socketId: socket.id,
        workspaceId,
      });
    });

    // Leave workspace room
    socket.on('leave-workspace', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      getLogger().debug('Client left workspace room', {
        component: 'UploadWebSocket',
        socketId: socket.id,
        workspaceId,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      getLogger().info('Client disconnected from upload WebSocket', {
        component: 'UploadWebSocket',
        socketId: socket.id,
      });
    });
  });

  getLogger().info('Upload WebSocket server initialized', {
    component: 'UploadWebSocket',
    path: '/socket.io/upload',
  });

  return io;
}

/**
 * Get Socket.IO server instance
 */
export function getUploadWebSocket(): SocketIOServer | null {
  return getUploadWebSocketInstance();
}

/**
 * Emit upload progress event to client
 */
export function emitUploadProgress(event: UploadProgressEvent): void {
  const io = getUploadWebSocketInstance();
  if (!io) {
    getLogger().warn('Cannot emit upload progress: WebSocket not initialized');
    return;
  }

  // Emit to specific workspace room
  io.to(`workspace:${event.workspaceId}`).emit('upload-progress', event);

  getLogger().debug('Upload progress emitted', {
    component: 'UploadWebSocket',
    uploadId: event.uploadId,
    workspaceId: event.workspaceId,
    progress: event.progress,
    status: event.status,
  });
}

/**
 * Emit upload start event
 */
export function emitUploadStart(
  uploadId: string,
  workspaceId: string,
  userId: string,
  filename: string,
  totalBytes: number
): void {
  emitUploadProgress({
    uploadId,
    workspaceId,
    userId,
    filename,
    progress: 0,
    bytesUploaded: 0,
    totalBytes,
    status: 'uploading',
    message: 'Upload started',
  });
}

/**
 * Emit upload processing event (e.g., image optimization)
 */
export function emitUploadProcessing(
  uploadId: string,
  workspaceId: string,
  userId: string,
  filename: string
): void {
  emitUploadProgress({
    uploadId,
    workspaceId,
    userId,
    filename,
    progress: 90,
    bytesUploaded: 0,
    totalBytes: 0,
    status: 'processing',
    message: 'Processing file...',
  });
}

/**
 * Emit upload complete event
 */
export function emitUploadComplete(
  uploadId: string,
  workspaceId: string,
  userId: string,
  filename: string,
  fileUrl: string
): void {
  emitUploadProgress({
    uploadId,
    workspaceId,
    userId,
    filename,
    progress: 100,
    bytesUploaded: 0,
    totalBytes: 0,
    status: 'complete',
    message: 'Upload complete',
  });
}

/**
 * Emit upload error event
 */
export function emitUploadError(
  uploadId: string,
  workspaceId: string,
  userId: string,
  filename: string,
  error: string
): void {
  emitUploadProgress({
    uploadId,
    workspaceId,
    userId,
    filename,
    progress: 0,
    bytesUploaded: 0,
    totalBytes: 0,
    status: 'error',
    message: 'Upload failed',
    error,
  });
}
