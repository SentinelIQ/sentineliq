/**
 * Database Backup Service
 * 
 * Provides automated PostgreSQL backup functionality with:
 * - Daily automated backups
 * - Configurable retention periods
 * - Compression and encryption support
 * - S3/MinIO upload
 * - Backup verification
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import type { SystemLog } from 'wasp/entities';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

interface BackupConfig {
  retention: {
    daily: number;    // Number of daily backups to keep
    weekly: number;   // Number of weekly backups to keep
    monthly: number;  // Number of monthly backups to keep
  };
  compression: boolean;
  encryption: boolean;
  uploadToStorage: boolean;
  notifyOnFailure: boolean;
}

const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 3,
  },
  compression: true,
  encryption: false, // Requires encryption key setup
  uploadToStorage: true,
  notifyOnFailure: true,
};

export class DatabaseBackupService {
  private config: BackupConfig;
  private backupDir: string;
  private dbUrl: string;

  constructor(config?: Partial<BackupConfig>) {
    this.config = { ...DEFAULT_BACKUP_CONFIG, ...config };
    this.backupDir = process.env.BACKUP_DIR || '/var/backups/postgresql';
    this.dbUrl = process.env.DATABASE_URL || '';

    if (!this.dbUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
  }

  /**
   * Perform a full database backup
   */
  async createBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.sql`);
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Parse database URL
      const dbConfig = this.parseDatabaseUrl(this.dbUrl);

      // Create backup using pg_dump
      console.log(`[Backup] Starting database backup: ${backupName}`);
      
      const pgDumpCommand = [
        'pg_dump',
        `-h ${dbConfig.host}`,
        `-p ${dbConfig.port}`,
        `-U ${dbConfig.user}`,
        `-d ${dbConfig.database}`,
        '--format=plain',
        '--no-owner',
        '--no-acl',
        `--file=${backupPath}`,
      ].join(' ');

      await execAsync(pgDumpCommand, {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password,
        },
      });

      console.log(`[Backup] Database backup created: ${backupPath}`);

      // Compress if enabled
      let finalPath = backupPath;
      if (this.config.compression) {
        finalPath = await this.compressBackup(backupPath);
        await fs.unlink(backupPath); // Remove uncompressed file
      }

      // Verify backup integrity
      const isValid = await this.verifyBackup(finalPath);
      if (!isValid) {
        throw new Error('Backup verification failed');
      }

      // Upload to storage if enabled
      if (this.config.uploadToStorage) {
        await this.uploadBackupToStorage(finalPath);
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      console.log(`[Backup] Backup completed successfully: ${finalPath}`);
      return { success: true, filePath: finalPath };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Backup] Backup failed: ${errorMessage}`);
      
      if (this.config.notifyOnFailure) {
        await this.notifyBackupFailure(errorMessage);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Compress backup file using gzip
   */
  private async compressBackup(filePath: string): Promise<string> {
    const gzipPath = `${filePath}.gz`;
    
    await pipeline(
      createReadStream(filePath),
      createGzip(),
      createWriteStream(gzipPath)
    );

    console.log(`[Backup] Backup compressed: ${gzipPath}`);
    return gzipPath;
  }

  /**
   * Verify backup file integrity
   */
  private async verifyBackup(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      
      // Check if file exists and has content
      if (stats.size === 0) {
        console.error('[Backup] Backup file is empty');
        return false;
      }

      // For compressed files, verify gzip integrity
      if (filePath.endsWith('.gz')) {
        await execAsync(`gzip -t ${filePath}`);
      }

      console.log(`[Backup] Backup verified: ${filePath} (${stats.size} bytes)`);
      return true;

    } catch (error) {
      console.error(`[Backup] Backup verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Upload backup to cloud storage (S3/MinIO)
   */
  private async uploadBackupToStorage(filePath: string): Promise<void> {
    try {
      // Initialize S3 client
      const s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || 'sentineliq',
          secretAccessKey: process.env.S3_SECRET_KEY || 'sentineliq123456',
        },
        forcePathStyle: true,
      });

      const bucket = process.env.NODE_ENV === 'production' 
        ? (process.env.S3_BUCKET_PROD || 'sentineliq-prod')
        : (process.env.S3_BUCKET_DEV || 'sentineliq-dev');

      const fileName = path.basename(filePath);
      const key = `backups/database/${fileName}`;

      // Read file
      const fileContent = readFileSync(filePath);

      // Upload to S3/MinIO
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/gzip',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'backup-type': 'postgresql',
          'environment': process.env.NODE_ENV || 'development',
        },
      }));

      console.log(`[Backup] Uploaded to storage: ${bucket}/${key}`);

    } catch (error) {
      console.error(`[Backup] Failed to upload to storage: ${error}`);
      // Don't throw - backup is still valid locally
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          timestamp: this.extractTimestampFromFilename(f),
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const now = new Date();
      const filesToDelete: string[] = [];

      for (let i = 0; i < backupFiles.length; i++) {
        const file = backupFiles[i];
        const ageInDays = Math.floor((now.getTime() - file.timestamp.getTime()) / (1000 * 60 * 60 * 24));

        // Keep recent daily backups
        if (i < this.config.retention.daily) {
          continue;
        }

        // Keep weekly backups (first backup of each week)
        const isWeeklyBackup = file.timestamp.getDay() === 0; // Sunday
        if (isWeeklyBackup && ageInDays <= this.config.retention.weekly * 7) {
          continue;
        }

        // Keep monthly backups (first backup of each month)
        const isMonthlyBackup = file.timestamp.getDate() === 1;
        if (isMonthlyBackup && ageInDays <= this.config.retention.monthly * 30) {
          continue;
        }

        // Delete old backups
        filesToDelete.push(file.path);
      }

      // Delete files
      for (const filePath of filesToDelete) {
        await fs.unlink(filePath);
        console.log(`[Backup] Deleted old backup: ${filePath}`);
      }

      console.log(`[Backup] Cleanup completed. Deleted ${filesToDelete.length} old backups.`);

    } catch (error) {
      console.error(`[Backup] Cleanup failed: ${error}`);
    }
  }

  /**
   * Extract timestamp from backup filename
   */
  private extractTimestampFromFilename(filename: string): Date {
    // Extract timestamp from format: backup-2024-01-15T10-30-00-000Z.sql.gz
    const match = filename.match(/backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (match) {
      const timestamp = match[1].replace(/-(\d{2})-(\d{2})-(\d{3})Z/, ':$1:$2.$3Z');
      return new Date(timestamp);
    }
    return new Date(0); // Return epoch if parsing fails
  }

  /**
   * Parse PostgreSQL connection URL
   */
  private parseDatabaseUrl(url: string): {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  } {
    // Format: postgresql://user:password@host:port/database
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5].split('?')[0], // Remove query params
    };
  }

  /**
   * Notify administrators of backup failure
   */
  private async notifyBackupFailure(error: string): Promise<void> {
    console.error(`[Backup] CRITICAL: Backup failed - ${error}`);
    // TODO: Integrate with notification system
    // For now, just log the error
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<Array<{
    name: string;
    path: string;
    size: number;
    timestamp: Date;
  }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: Array<{
        name: string;
        path: string;
        size: number;
        timestamp: Date;
      }> = [];

      for (const file of files) {
        if (file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            timestamp: this.extractTimestampFromFilename(file),
          });
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error(`[Backup] Failed to list backups: ${error}`);
      return [];
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  }> {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
      };
    }

    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups[backups.length - 1].timestamp,
      newestBackup: backups[0].timestamp,
    };
  }
}

// Singleton instance
let backupServiceInstance: DatabaseBackupService | null = null;

export function getBackupService(): DatabaseBackupService {
  if (!backupServiceInstance) {
    backupServiceInstance = new DatabaseBackupService();
  }
  return backupServiceInstance;
}
