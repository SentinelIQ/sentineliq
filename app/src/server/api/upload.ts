/**
 * File Upload API Endpoint
 * 
 * Handles multipart/form-data file uploads to MinIO/S3.
 * Supports workspace branding (logos) and other file types.
 */

import type { UploadFile } from 'wasp/server/api';
import multer from 'multer';
import type { Request, Response } from 'express';
import { StorageService, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../storage';
import { createLogger } from '../../core/logs/logger';
import { emitUploadStart, emitUploadProcessing, emitUploadComplete, emitUploadError } from '../uploadWebSocket';
import crypto from 'crypto';

const logger = createLogger('upload-api');

/**
 * Middleware config for upload API
 * Allows context to be passed to handler
 */
export function uploadFileMiddlewareConfig(middlewareConfig: any) {
  return middlewareConfig;
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});

/**
 * Upload file API handler
 * 
 * Request body (multipart/form-data):
 * - file: File to upload (required)
 * - workspaceId: Workspace ID (required)
 * - folder: Target folder (optional, default: 'uploads')
 * - type: Upload type ('logo', 'avatar', 'document', etc.)
 */
export const uploadFileApi: UploadFile = async (req, res, context) => {
  try {
    // Authenticate user
    if (!context.user) {
      logger.warn('Unauthorized upload attempt', {
        component: 'UploadAPI',
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse multipart form data
    await new Promise<void>((resolve, reject) => {
      upload.single('file')(req as Request, res as Response, (err: any) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return reject(new Error('File size exceeds maximum allowed (5MB)'));
            }
            return reject(new Error(`Upload error: ${err.message}`));
          }
          return reject(err);
        }
        resolve();
      });
    });

    // Extract file from request
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      logger.warn('No file provided in upload request', {
        component: 'UploadAPI',
        userId: context.user.id,
      });
      return res.status(400).json({ error: 'No file provided' });
    }

    // Extract form fields
    const workspaceId = (req as any).body.workspaceId as string;
    const folder = (req as any).body.folder as string | undefined;
    const type = (req as any).body.type as string | undefined;
    
    // Generate unique upload ID for tracking
    const uploadId = crypto.randomBytes(16).toString('hex');

    if (!workspaceId) {
      logger.warn('No workspaceId provided in upload request', {
        component: 'UploadAPI',
        userId: context.user.id,
      });
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    // Emit upload start event
    emitUploadStart(uploadId, workspaceId, context.user.id, file.originalname, file.size);

    // Verify workspace access
    const workspace = await context.entities.Workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: context.user.id },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      logger.warn('User attempted to upload to workspace without access', {
        component: 'UploadAPI',
        userId: context.user.id,
        workspaceId,
      });
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // Validate file type
    if (!StorageService.validateFileType(file.mimetype, ALLOWED_IMAGE_TYPES)) {
      logger.warn('Invalid file type uploaded', {
        component: 'UploadAPI',
        userId: context.user.id,
        mimetype: file.mimetype,
      });
      return res.status(400).json({
        error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG',
      });
    }

    // Validate file size
    if (!StorageService.validateFileSize(file.size, MAX_IMAGE_SIZE)) {
      logger.warn('File size exceeds limit', {
        component: 'UploadAPI',
        userId: context.user.id,
        size: file.size,
      });
      return res.status(400).json({
        error: 'File size exceeds maximum allowed (5MB)',
      });
    }

    // Check storage quota before upload
    const hasQuota = await StorageService.checkStorageQuota(workspaceId, file.size, context);
    if (!hasQuota) {
      logger.warn('Workspace storage quota exceeded', {
        component: 'UploadAPI',
        userId: context.user.id,
        workspaceId,
        fileSize: file.size,
      });
      emitUploadError(
        uploadId,
        workspaceId,
        context.user.id,
        file.originalname,
        'Storage quota exceeded. Please upgrade your plan or delete old files.'
      );
      return res.status(403).json({
        error: 'Storage quota exceeded. Please upgrade your plan or delete old files.',
      });
    }

    // Emit processing event (image optimization happens in StorageService.uploadFile)
    emitUploadProcessing(uploadId, workspaceId, context.user.id, file.originalname);

    // Upload file to storage (with auto-optimization)
    const targetFolder = folder || (type === 'logo' ? 'logos' : 'uploads');
    const uploadResult = await StorageService.uploadFile(file.buffer, file.originalname, {
      workspaceId,
      userId: context.user.id,
      folder: targetFolder,
      makePublic: true,
      contentType: file.mimetype,
      optimizeImage: true, // Enable auto-optimization
    });

    // Update workspace storage usage
    await StorageService.updateStorageUsage(workspaceId, uploadResult.size, context, 'add');

    // Emit upload complete event
    emitUploadComplete(uploadId, workspaceId, context.user.id, file.originalname, uploadResult.publicUrl);

    logger.info('File uploaded successfully via API', {
      component: 'UploadAPI',
      userId: context.user.id,
      workspaceId,
      key: uploadResult.key,
      size: uploadResult.size,
      type,
      uploadId,
    });

    return res.status(200).json({
      success: true,
      uploadId,
      file: {
        key: uploadResult.key,
        url: uploadResult.publicUrl,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
      },
    });
  } catch (error) {
    logger.error('File upload failed', {
      component: 'UploadAPI',
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: context.user?.id,
    });

    // Emit error event if we have upload context
    const workspaceId = (req as any).body?.workspaceId;
    const uploadId = crypto.randomBytes(16).toString('hex');
    if (workspaceId && context.user) {
      emitUploadError(
        uploadId,
        workspaceId,
        context.user.id,
        (req as any).file?.originalname || 'unknown',
        error instanceof Error ? error.message : 'Upload failed'
      );
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload file',
    });
  }
};
