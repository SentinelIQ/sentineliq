/**
 * Storage Service - MinIO/S3 Integration
 * 
 * Handles file uploads, downloads, and management using AWS SDK v3.
 * Compatible with MinIO (S3-compatible) and AWS S3.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger } from '../core/logs/logger';
import { ImageOptimizer } from './imageOptimizer';

const logger = createLogger('storage');

// Environment variables
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'sentineliq';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'sentineliq123456';
const S3_BUCKET_DEV = process.env.S3_BUCKET_DEV || 'sentineliq-dev';
const S3_BUCKET_PROD = process.env.S3_BUCKET_PROD || 'sentineliq-prod';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || S3_ENDPOINT;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Get current bucket based on environment
const getCurrentBucket = (): string => {
  return NODE_ENV === 'production' ? S3_BUCKET_PROD : S3_BUCKET_DEV;
};

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

// Allowed MIME types for uploads
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File upload options
 */
export interface UploadOptions {
  workspaceId: string;
  userId: string;
  folder?: string;
  makePublic?: boolean;
  contentType?: string;
  optimizeImage?: boolean; // Auto-optimize images
  maxWidth?: number; // Max width for image optimization
  maxHeight?: number; // Max height for image optimization
}

/**
 * Upload result
 */
export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
}

/**
 * Storage Service Class
 */
export class StorageService {
  /**
   * Upload a file to S3/MinIO with optional image optimization
   */
  static async uploadFile(
    file: Buffer,
    filename: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const { workspaceId, userId, folder = 'uploads', makePublic = true, contentType, optimizeImage = true, maxWidth, maxHeight } = options;
      const bucketName = getCurrentBucket();

      let fileBuffer = file;
      let finalContentType = contentType;
      let optimizationInfo: any = {};

      // ✅ Auto-optimize images if enabled and file is an image
      if (optimizeImage && contentType && ALLOWED_IMAGE_TYPES.includes(contentType)) {
        try {
          const isValidImage = await ImageOptimizer.validateImage(file);
          
          if (isValidImage) {
            logger.info('Optimizing image before upload', {
              component: 'StorageService',
              originalSize: file.length,
              contentType,
              workspaceId,
            });

            // For logos, use specific optimization
            const optimizationResult = folder === 'logos'
              ? await ImageOptimizer.optimizeLogo(file)
              : await ImageOptimizer.optimize(file, {
                  maxWidth: maxWidth || 1200,
                  maxHeight: maxHeight || 1200,
                  quality: 80,
                  format: 'webp',
                  fit: 'inside',
                });

            fileBuffer = optimizationResult.buffer;
            finalContentType = `image/${optimizationResult.format}`;

            optimizationInfo = {
              optimized: true,
              originalSize: optimizationResult.originalSize,
              newSize: optimizationResult.size,
              compressionRatio: optimizationResult.compressionRatio.toFixed(2) + '%',
              format: optimizationResult.format,
            };

            // Update filename extension to match new format
            const filenameParts = filename.split('.');
            if (filenameParts.length > 1) {
              filenameParts[filenameParts.length - 1] = optimizationResult.format;
              filename = filenameParts.join('.');
            }
          }
        } catch (error) {
          logger.warn('Image optimization failed, uploading original', {
            component: 'StorageService',
            error: error instanceof Error ? error.message : 'Unknown error',
            workspaceId,
          });
          // Continue with original file if optimization fails
        }
      }

      // Generate unique key with workspace isolation
      // Structure: workspaces/{workspaceId}/{folder}/{timestamp}-{filename}
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `workspaces/${workspaceId}/${folder}/${timestamp}-${sanitizedFilename}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: finalContentType,
        Metadata: {
          workspaceId,
          userId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
          environment: NODE_ENV,
          ...(optimizationInfo.optimized && {
            originalSize: optimizationInfo.originalSize.toString(),
            compressionRatio: optimizationInfo.compressionRatio,
          }),
        },
        ...(makePublic && { ACL: 'public-read' }),
      });

      await s3Client.send(command);

      const url = `${S3_ENDPOINT}/${bucketName}/${key}`;
      const publicUrl = `${S3_PUBLIC_URL}/${bucketName}/${key}`;

      logger.info('File uploaded successfully', {
        component: 'StorageService',
        key,
        bucket: bucketName,
        workspaceId,
        userId,
        size: fileBuffer.length,
        environment: NODE_ENV,
        ...optimizationInfo,
      });

      return {
        key,
        url,
        publicUrl,
        size: fileBuffer.length,
        contentType: finalContentType || 'application/octet-stream',
      };
    } catch (error) {
      logger.error('Failed to upload file', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: options.workspaceId,
      });
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Check if workspace has enough storage quota for a file
   */
  static async checkStorageQuota(
    workspaceId: string,
    fileSizeBytes: number,
    context: any
  ): Promise<boolean> {
    try {
      const workspace = await context.entities.Workspace.findUnique({
        where: { id: workspaceId },
        select: {
          storageUsed: true,
          storageQuota: true,
        },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const storageUsed = Number(workspace.storageUsed);
      const storageQuota = Number(workspace.storageQuota);

      return storageUsed + fileSizeBytes <= storageQuota;
    } catch (error) {
      logger.error('Failed to check storage quota', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId,
      });
      return false;
    }
  }

  /**
   * Update workspace storage usage after upload
   */
  static async updateStorageUsage(
    workspaceId: string,
    sizeBytes: number,
    context: any,
    operation: 'add' | 'subtract' = 'add'
  ): Promise<void> {
    try {
      const workspace = await context.entities.Workspace.findUnique({
        where: { id: workspaceId },
        select: { storageUsed: true },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const currentUsage = Number(workspace.storageUsed);
      const newUsage = operation === 'add' 
        ? currentUsage + sizeBytes 
        : Math.max(0, currentUsage - sizeBytes);

      await context.entities.Workspace.update({
        where: { id: workspaceId },
        data: { storageUsed: BigInt(newUsage) },
      });

      logger.info('Workspace storage usage updated', {
        component: 'StorageService',
        workspaceId,
        operation,
        sizeBytes,
        newUsage,
      });
    } catch (error) {
      logger.error('Failed to update storage usage', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId,
      });
    }
  }

  /**
   * Get workspace storage statistics
   */
  static async getStorageStats(
    workspaceId: string,
    context: any
  ): Promise<{
    used: number;
    quota: number;
    available: number;
    usagePercent: number;
  }> {
    try {
      const workspace = await context.entities.Workspace.findUnique({
        where: { id: workspaceId },
        select: {
          storageUsed: true,
          storageQuota: true,
        },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const used = Number(workspace.storageUsed);
      const quota = Number(workspace.storageQuota);
      const available = Math.max(0, quota - used);
      const usagePercent = quota > 0 ? Math.round((used / quota) * 100) : 0;

      return {
        used,
        quota,
        available,
        usagePercent,
      };
    } catch (error) {
      logger.error('Failed to get storage stats', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId,
      });
      throw new Error('Failed to get storage statistics');
    }
  }

  /**
   * Delete a file from S3/MinIO
   */
  static async deleteFile(key: string, workspaceId: string, bucketName?: string): Promise<void> {
    try {
      // Verify workspace ownership in key
      if (!key.includes(workspaceId)) {
        throw new Error('Unauthorized: File does not belong to workspace');
      }

      const bucket = bucketName || getCurrentBucket();

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await s3Client.send(command);

      logger.info('File deleted successfully', {
        component: 'StorageService',
        key,
        bucket,
        workspaceId,
      });
    } catch (error) {
      logger.error('Failed to delete file', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        workspaceId,
      });
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   */
  static async getSignedUrl(
    key: string,
    workspaceId: string,
    expiresIn: number = 3600,
    bucketName?: string
  ): Promise<string> {
    try {
      // Verify workspace ownership in key
      if (!key.includes(workspaceId)) {
        throw new Error('Unauthorized: File does not belong to workspace');
      }

      const bucket = bucketName || getCurrentBucket();

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

      logger.info('Generated signed URL', {
        component: 'StorageService',
        key,
        bucket,
        workspaceId,
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        workspaceId,
      });
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Check if a file exists
   */
  static async fileExists(key: string, bucketName?: string): Promise<boolean> {
    try {
      const bucket = bucketName || getCurrentBucket();
      
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List files in a workspace folder
   */
  static async listFiles(
    workspaceId: string,
    folder: string = 'uploads',
    maxKeys: number = 100,
    bucketName?: string
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    try {
      const bucket = bucketName || getCurrentBucket();
      const prefix = `workspaces/${workspaceId}/${folder}/`;

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await s3Client.send(command);

      const files = (response.Contents || []).map((item) => ({
        key: item.Key!,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
      }));

      logger.info('Listed files', {
        component: 'StorageService',
        workspaceId,
        folder,
        bucket,
        count: files.length,
      });

      return files;
    } catch (error) {
      logger.error('Failed to list files', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId,
        folder,
      });
      throw new Error('Failed to list files');
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(key: string, bucketName?: string): string {
    const bucket = bucketName || getCurrentBucket();
    return `${S3_PUBLIC_URL}/${bucket}/${key}`;
  }

  /**
   * Validate file type
   */
  static validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  /**
   * Extract key from full URL
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      
      // Remove bucket name (first part) and return rest as key
      if (pathParts.length > 1) {
        pathParts.shift(); // Remove bucket name
        return pathParts.join('/');
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract bucket name from URL
   */
  static extractBucketFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      
      // First part is the bucket name
      return pathParts[0] || null;
    } catch {
      return null;
    }
  }
}

/**
 * Initialize storage (create buckets if not exists)
 */
export async function initializeStorage(): Promise<void> {
  const buckets = [S3_BUCKET_DEV, S3_BUCKET_PROD];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists by listing objects
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1,
      });

      await s3Client.send(command);

      logger.info('Storage bucket verified', {
        component: 'StorageService',
        bucket,
        endpoint: S3_ENDPOINT,
      });
    } catch (error) {
      logger.error('Failed to verify storage bucket', {
        component: 'StorageService',
        error: error instanceof Error ? error.message : 'Unknown error',
        bucket,
        endpoint: S3_ENDPOINT,
      });

      // Note: Bucket creation requires manual setup in MinIO
      logger.warn('Please create bucket manually in MinIO console', {
        component: 'StorageService',
        bucket,
        consoleUrl: 'http://localhost:9001',
      });
    }
  }

  logger.info('Storage initialization complete', {
    component: 'StorageService',
    environment: NODE_ENV,
    currentBucket: getCurrentBucket(),
  });
}
