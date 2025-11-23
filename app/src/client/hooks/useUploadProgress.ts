/**
 * React Hook for Upload Progress Tracking
 * 
 * Provides real-time upload progress updates via WebSocket.
 * Usage: const { progress, isUploading, error } = useUploadProgress(uploadId, workspaceId);
 */

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number; // 0-100
  bytesUploaded: number;
  totalBytes: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  error?: string;
}

interface UseUploadProgressReturn {
  progress: number;
  status: UploadProgress['status'] | 'idle';
  message?: string;
  error?: string;
  isUploading: boolean;
  isProcessing: boolean;
  isComplete: boolean;
  hasError: boolean;
}

let socket: Socket | null = null;

/**
 * Initialize WebSocket connection (singleton)
 */
function getSocket(): Socket {
  if (!socket) {
    const serverUrl = import.meta.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    socket = io(serverUrl, {
      path: '/socket.io/upload',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to upload server');
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from upload server');
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  }

  return socket;
}

/**
 * Hook to track upload progress for a specific upload
 */
export function useUploadProgress(
  uploadId: string | null,
  workspaceId: string
): UseUploadProgressReturn {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<UploadProgress['status'] | 'idle'>('idle');
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!uploadId || !workspaceId) return;

    const socket = getSocket();

    // Join workspace room to receive upload events
    socket.emit('join-workspace', workspaceId);

    // Listen for upload progress events
    const handleProgress = (event: UploadProgress) => {
      // Only handle events for our upload
      if (event.uploadId === uploadId) {
        setProgress(event.progress);
        setStatus(event.status);
        setMessage(event.message);
        setError(event.error);
      }
    };

    socket.on('upload-progress', handleProgress);

    // Cleanup
    return () => {
      socket.off('upload-progress', handleProgress);
      socket.emit('leave-workspace', workspaceId);
    };
  }, [uploadId, workspaceId]);

  return {
    progress,
    status,
    message,
    error,
    isUploading: status === 'uploading',
    isProcessing: status === 'processing',
    isComplete: status === 'complete',
    hasError: status === 'error',
  };
}

/**
 * Hook to track multiple uploads in a workspace
 */
export function useWorkspaceUploads(workspaceId: string) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  useEffect(() => {
    if (!workspaceId) return;

    const socket = getSocket();

    // Join workspace room
    socket.emit('join-workspace', workspaceId);

    // Listen for all upload events in this workspace
    const handleProgress = (event: UploadProgress) => {
      setUploads((prev) => {
        const updated = new Map(prev);
        updated.set(event.uploadId, event);
        
        // Remove completed/errored uploads after 5 seconds
        if (event.status === 'complete' || event.status === 'error') {
          setTimeout(() => {
            setUploads((current) => {
              const newMap = new Map(current);
              newMap.delete(event.uploadId);
              return newMap;
            });
          }, 5000);
        }
        
        return updated;
      });
    };

    socket.on('upload-progress', handleProgress);

    // Cleanup
    return () => {
      socket.off('upload-progress', handleProgress);
      socket.emit('leave-workspace', workspaceId);
    };
  }, [workspaceId]);

  return {
    uploads: Array.from(uploads.values()),
    activeUploads: Array.from(uploads.values()).filter(
      (u) => u.status === 'uploading' || u.status === 'processing'
    ),
    completedUploads: Array.from(uploads.values()).filter((u) => u.status === 'complete'),
    failedUploads: Array.from(uploads.values()).filter((u) => u.status === 'error'),
  };
}

/**
 * Disconnect WebSocket (call on app unmount)
 */
export function disconnectUploadWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
