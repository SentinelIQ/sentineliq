/**
 * Aegis Module - Evidence Storage Service
 * 
 * Integrates with MinIO (S3-compatible) for secure evidence storage.
 * Handles upload, download, hash verification, and storage quota management.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import { Readable } from 'stream';

interface UploadResult {
  url: string;
  size: number;
  hash: string;
  key: string;
}

export class EvidenceStorageService {
  private s3Client: S3Client;
  private bucket: string = process.env.MINIO_BUCKET || 'aegis-evidence';
  private endpoint: string = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  private accessKey: string = process.env.MINIO_ACCESS_KEY || 'minioadmin';
  private secretKey: string = process.env.MINIO_SECRET_KEY || 'minioadmin';
  private presignedUrlExpiry: number = 604800; // 7 days in seconds

  constructor() {
    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Upload evidence file to MinIO with integrity verification
   */
  async uploadEvidence(
    fileBuffer: Buffer,
    fileName: string,
    options: {
      workspaceId: string;
      userId: string;
      caseId: string;
      contentType: string;
    }
  ): Promise<UploadResult> {
    try {
      // Calculate SHA-256 hash for integrity verification
      const hash = createHash('sha256').update(fileBuffer).digest('hex');

      // Generate S3 key with workspace isolation and timestamp
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `workspaces/${options.workspaceId}/cases/${options.caseId}/evidence/${timestamp}-${sanitizedFileName}`;

      // Upload to MinIO
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: options.contentType,
          Metadata: {
            uploadedBy: options.userId,
            workspaceId: options.workspaceId,
            caseId: options.caseId,
            hash,
            originalFileName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      // Generate presigned URL (valid for 7 days)
      const url = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
        { expiresIn: this.presignedUrlExpiry }
      );

      return {
        url,
        size: fileBuffer.length,
        hash,
        key,
      };
    } catch (error) {
      console.error('[Storage] Upload failed:', error);
      throw new Error(`Failed to upload evidence: ${(error as any).message}`);
    }
  }

  /**
   * Download evidence file with integrity verification
   */
  async downloadEvidence(
    s3Key: string,
    expectedHash?: string
  ): Promise<{
    buffer: Buffer;
    hash: string;
    verified: boolean;
  }> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );

      // Read stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as Readable;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Calculate hash for verification
      const hash = createHash('sha256').update(buffer).digest('hex');
      const verified = !expectedHash || hash === expectedHash;

      return {
        buffer,
        hash,
        verified,
      };
    } catch (error) {
      console.error('[Storage] Download failed:', error);
      throw new Error(`Failed to download evidence: ${(error as any).message}`);
    }
  }

  /**
   * Generate a new presigned URL for an existing evidence file
   */
  async generatePresignedUrl(s3Key: string, expiresIn: number = this.presignedUrlExpiry): Promise<string> {
    try {
      return await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        }),
        { expiresIn }
      );
    } catch (error) {
      console.error('[Storage] Failed to generate presigned URL:', error);
      throw new Error(`Failed to generate URL: ${(error as any).message}`);
    }
  }

  /**
   * Delete evidence file from storage
   */
  async deleteEvidence(s3Key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );
    } catch (error) {
      console.error('[Storage] Delete failed:', error);
      throw new Error(`Failed to delete evidence: ${(error as any).message}`);
    }
  }

  /**
   * Get file metadata (size, upload date, etc)
   */
  async getFileMetadata(s3Key: string): Promise<{
    size: number;
    uploadedAt?: Date;
    contentType?: string;
  }> {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );

      return {
        size: response.ContentLength || 0,
        uploadedAt: response.LastModified,
        contentType: response.ContentType,
      };
    } catch (error) {
      console.error('[Storage] Failed to get metadata:', error);
      throw new Error(`Failed to get file metadata: ${(error as any).message}`);
    }
  }

  /**
   * Update workspace storage usage tracking
   */
  async updateStorageUsage(
    workspaceId: string,
    sizeBytes: number,
    context: any,
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      const workspace = await context.entities.Workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const currentUsage = workspace.storageUsed || 0;
      const newUsage =
        action === 'add'
          ? currentUsage + BigInt(sizeBytes)
          : BigInt(Math.max(0, Number(currentUsage) - sizeBytes));

      // Check quota based on plan
      const quotas: Record<string, number> = {
        free: 1_073_741_824, // 1GB
        hobby: 10_737_418_240, // 10GB
        pro: 107_374_182_400, // 100GB
      };
      const quota = workspace.storageQuota || BigInt(quotas[workspace.subscriptionPlan as keyof typeof quotas] || quotas.free);

      if (action === 'add' && newUsage > quota) {
        const quotaGB = Number(quota) / 1_073_741_824;
        throw new Error(`Storage quota exceeded. Plan allows ${quotaGB.toFixed(2)}GB`);
      }

      await context.entities.Workspace.update({
        where: { id: workspaceId },
        data: { storageUsed: newUsage },
      });
    } catch (error) {
      console.error('[Storage] Failed to update usage:', error);
      throw error;
    }
  }

  /**
   * Get workspace storage statistics
   */
  async getStorageStats(workspaceId: string, context: any): Promise<{
    used: number;
    quota: number;
    percentageUsed: number;
    plan: string;
  }> {
    const workspace = await context.entities.Workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const used = Number(workspace.storageUsed || 0);
    const quota = Number(workspace.storageQuota || 1_073_741_824);
    const percentageUsed = (used / quota) * 100;

    return {
      used,
      quota,
      percentageUsed,
      plan: workspace.subscriptionPlan || 'free',
    };
  }

  /**
   * Cleanup old files (for manual storage management)
   */
  async cleanupOldFiles(
    workspaceId: string,
    olderThanDays: number = 90,
    context?: any,
    dryRun: boolean = false
  ): Promise<{
    deleted: number;
    freedBytes: number;
    files: Array<{ key: string; size: number; lastModified: Date }>;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      console.log(
        `[Storage] ${dryRun ? 'Dry run' : 'Cleanup'} for workspace ${workspaceId} (files older than ${olderThanDays} days)`
      );

      let deleted = 0;
      let freedBytes = 0;
      const deletedFiles: Array<{ key: string; size: number; lastModified: Date }> = [];

      const prefix = `workspaces/${workspaceId}/`;
      let continuationToken: string | undefined;

      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        });

        const listResponse = await this.s3Client.send(listCommand);

        if (listResponse.Contents && listResponse.Contents.length > 0) {
          for (const object of listResponse.Contents) {
            if (!object.Key || !object.LastModified) continue;

            if (object.LastModified < cutoffDate) {
              const size = object.Size || 0;

              if (dryRun) {
                deletedFiles.push({
                  key: object.Key,
                  size,
                  lastModified: object.LastModified,
                });
                freedBytes += size;
                deleted++;
              } else {
                try {
                  await this.s3Client.send(
                    new DeleteObjectCommand({
                      Bucket: this.bucket,
                      Key: object.Key,
                    })
                  );

                  deletedFiles.push({
                    key: object.Key,
                    size,
                    lastModified: object.LastModified,
                  });
                  freedBytes += size;
                  deleted++;

                  console.log(`[Storage] Deleted: ${object.Key} (${(size / 1024).toFixed(2)} KB)`);
                } catch (deleteError) {
                  console.error(`[Storage] Failed to delete ${object.Key}:`, deleteError);
                }
              }
            }
          }
        }

        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);

      if (context && !dryRun && freedBytes > 0) {
        await this.updateStorageUsage(workspaceId, freedBytes, context, 'remove');
      }

      console.log(
        `[Storage] ${dryRun ? 'Would delete' : 'Deleted'} ${deleted} files, ${dryRun ? 'would free' : 'freed'} ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`
      );

      return { deleted, freedBytes, files: deletedFiles };
    } catch (error) {
      console.error('[Storage] Cleanup failed:', error);
      throw new Error(`Failed to cleanup old files: ${(error as any).message}`);
    }
  }

  /**
   * List all files for a workspace with metadata
   */
  async listWorkspaceFiles(
    workspaceId: string,
    options?: {
      maxResults?: number;
      continuationToken?: string;
    }
  ): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      contentType?: string;
    }>;
    nextToken?: string;
    totalSize: number;
  }> {
    try {
      const prefix = `workspaces/${workspaceId}/`;
      const maxKeys = Math.min(options?.maxResults || 1000, 1000);

      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: options?.continuationToken,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(listCommand);
      const files: Array<{
        key: string;
        size: number;
        lastModified: Date;
        contentType?: string;
      }> = [];
      let totalSize = 0;

      if (response.Contents) {
        for (const object of response.Contents) {
          if (!object.Key || !object.LastModified) continue;

          const fileInfo = {
            key: object.Key,
            size: object.Size || 0,
            lastModified: object.LastModified,
            contentType: undefined as string | undefined,
          };

          try {
            const metadata = await this.getFileMetadata(object.Key);
            fileInfo.contentType = metadata.contentType;
          } catch (error) {
            console.warn(`[Storage] Could not get metadata for ${object.Key}`);
          }

          files.push(fileInfo);
          totalSize += fileInfo.size;
        }
      }

      return {
        files,
        nextToken: response.NextContinuationToken,
        totalSize,
      };
    } catch (error) {
      console.error('[Storage] Failed to list files:', error);
      throw new Error(`Failed to list workspace files: ${(error as any).message}`);
    }
  }

  /**
   * Delete all files for a case (when case is deleted)
   */
  async deleteCaseFiles(
    workspaceId: string,
    caseId: string,
    context?: any
  ): Promise<{ deleted: number; freedBytes: number }> {
    try {
      const prefix = `workspaces/${workspaceId}/cases/${caseId}/`;
      let deleted = 0;
      let freedBytes = 0;
      let continuationToken: string | undefined;

      console.log(`[Storage] Deleting all files for case ${caseId}`);

      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        });

        const listResponse = await this.s3Client.send(listCommand);

        if (listResponse.Contents && listResponse.Contents.length > 0) {
          for (const object of listResponse.Contents) {
            if (!object.Key) continue;

            const size = object.Size || 0;

            try {
              await this.s3Client.send(
                new DeleteObjectCommand({
                  Bucket: this.bucket,
                  Key: object.Key,
                })
              );

              freedBytes += size;
              deleted++;
            } catch (deleteError) {
              console.error(`[Storage] Failed to delete ${object.Key}:`, deleteError);
            }
          }
        }

        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);

      if (context && freedBytes > 0) {
        await this.updateStorageUsage(workspaceId, freedBytes, context, 'remove');
      }

      console.log(
        `[Storage] Deleted ${deleted} files for case ${caseId}, freed ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`
      );

      return { deleted, freedBytes };
    } catch (error) {
      console.error('[Storage] Failed to delete case files:', error);
      throw new Error(`Failed to delete case files: ${(error as any).message}`);
    }
  }
}

// Singleton instance
export const evidenceStorage = new EvidenceStorageService();
