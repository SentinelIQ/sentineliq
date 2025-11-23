/**
 * Disaster Recovery Service
 * 
 * Provides database restore and disaster recovery capabilities:
 * - Restore from backup files
 * - Backup validation
 * - Point-in-time recovery
 * - Recovery testing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);

export interface RestoreOptions {
  backupPath: string;
  dropExisting?: boolean;
  createDatabase?: boolean;
  verbose?: boolean;
}

export interface RecoveryTestResult {
  success: boolean;
  backupFile: string;
  testDuration: number;
  recordsRestored?: number;
  errors?: string[];
}

export class DisasterRecoveryService {
  private dbUrl: string;
  private backupDir: string;

  constructor() {
    this.dbUrl = process.env.DATABASE_URL || '';
    this.backupDir = process.env.BACKUP_DIR || '/var/backups/postgresql';

    if (!this.dbUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
  }

  /**
   * Restore database from backup file
   */
  async restoreFromBackup(options: RestoreOptions): Promise<{
    success: boolean;
    error?: string;
    duration?: number;
  }> {
    const startTime = Date.now();

    try {
      console.log(`[Recovery] Starting restore from: ${options.backupPath}`);

      // Verify backup file exists
      await fs.access(options.backupPath);

      // Decompress if needed
      let restoreFile = options.backupPath;
      if (options.backupPath.endsWith('.gz')) {
        restoreFile = await this.decompressBackup(options.backupPath);
      }

      // Parse database config
      const dbConfig = this.parseDatabaseUrl(this.dbUrl);

      // Drop existing database if requested
      if (options.dropExisting) {
        await this.dropDatabase(dbConfig);
      }

      // Create database if requested
      if (options.createDatabase) {
        await this.createDatabase(dbConfig);
      }

      // Restore using psql
      console.log(`[Recovery] Restoring database: ${dbConfig.database}`);
      
      const psqlCommand = [
        'psql',
        `-h ${dbConfig.host}`,
        `-p ${dbConfig.port}`,
        `-U ${dbConfig.user}`,
        `-d ${dbConfig.database}`,
        `-f ${restoreFile}`,
        options.verbose ? '-v ON_ERROR_STOP=1' : '--quiet',
      ].join(' ');

      await execAsync(psqlCommand, {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password,
        },
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      });

      // Clean up decompressed file
      if (restoreFile !== options.backupPath) {
        await fs.unlink(restoreFile);
      }

      const duration = Date.now() - startTime;
      console.log(`[Recovery] Restore completed in ${duration}ms`);

      return { success: true, duration };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Recovery] Restore failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Test disaster recovery procedure
   */
  async testRecovery(backupPath?: string): Promise<RecoveryTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      console.log('[Recovery] Starting disaster recovery test...');

      // Use provided backup or latest backup
      const targetBackup = backupPath || await this.getLatestBackup();
      if (!targetBackup) {
        throw new Error('No backup file found');
      }

      console.log(`[Recovery] Testing backup: ${targetBackup}`);

      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(targetBackup);
      if (!isValid) {
        errors.push('Backup integrity check failed');
      }

      // Test decompression if compressed
      if (targetBackup.endsWith('.gz')) {
        try {
          await execAsync(`gzip -t ${targetBackup}`);
          console.log('[Recovery] Compression integrity verified');
        } catch (error) {
          errors.push('Compression integrity check failed');
        }
      }

      // Analyze backup content
      const analysis = await this.analyzeBackup(targetBackup);
      console.log('[Recovery] Backup analysis:', analysis);

      // TODO: Test restore to temporary database (dry run)
      // This would require creating a temporary database and attempting a restore
      console.log('[Recovery] Test database restore not yet implemented');

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        backupFile: targetBackup,
        testDuration: duration,
        recordsRestored: analysis.estimatedRecords,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        success: false,
        backupFile: backupPath || 'unknown',
        testDuration: Date.now() - startTime,
        errors,
      };
    }
  }

  /**
   * Verify backup file integrity
   */
  private async verifyBackupIntegrity(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size === 0) {
        console.error('[Recovery] Backup file is empty');
        return false;
      }

      // For compressed files, verify gzip integrity
      if (filePath.endsWith('.gz')) {
        await execAsync(`gzip -t ${filePath}`);
      }

      console.log(`[Recovery] Backup integrity verified: ${filePath}`);
      return true;

    } catch (error) {
      console.error(`[Recovery] Integrity check failed: ${error}`);
      return false;
    }
  }

  /**
   * Analyze backup content
   */
  private async analyzeBackup(filePath: string): Promise<{
    size: number;
    estimatedRecords: number;
    hasData: boolean;
  }> {
    try {
      const stats = await fs.stat(filePath);
      
      // Read first part of backup to check for data
      let content = '';
      if (filePath.endsWith('.gz')) {
        // For compressed files, read first KB after decompression
        const { stdout } = await execAsync(`zcat ${filePath} | head -n 100`);
        content = stdout;
      } else {
        const buffer = await fs.readFile(filePath, { encoding: 'utf8' });
        content = buffer.substring(0, 10000);
      }

      const hasData = content.includes('INSERT INTO') || content.includes('COPY');
      const insertCount = (content.match(/INSERT INTO/g) || []).length;

      return {
        size: stats.size,
        estimatedRecords: insertCount * 10, // Rough estimate
        hasData,
      };

    } catch (error) {
      console.error(`[Recovery] Analysis failed: ${error}`);
      return {
        size: 0,
        estimatedRecords: 0,
        hasData: false,
      };
    }
  }

  /**
   * Decompress backup file
   */
  private async decompressBackup(filePath: string): Promise<string> {
    const decompressedPath = filePath.replace('.gz', '');
    
    await pipeline(
      createReadStream(filePath),
      createGunzip(),
      createWriteStream(decompressedPath)
    );

    console.log(`[Recovery] Backup decompressed: ${decompressedPath}`);
    return decompressedPath;
  }

  /**
   * Drop database (for clean restore)
   */
  private async dropDatabase(dbConfig: {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  }): Promise<void> {
    console.log(`[Recovery] Dropping database: ${dbConfig.database}`);
    
    const dropCommand = [
      'dropdb',
      `-h ${dbConfig.host}`,
      `-p ${dbConfig.port}`,
      `-U ${dbConfig.user}`,
      '--if-exists',
      dbConfig.database,
    ].join(' ');

    await execAsync(dropCommand, {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      },
    });
  }

  /**
   * Create database
   */
  private async createDatabase(dbConfig: {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  }): Promise<void> {
    console.log(`[Recovery] Creating database: ${dbConfig.database}`);
    
    const createCommand = [
      'createdb',
      `-h ${dbConfig.host}`,
      `-p ${dbConfig.port}`,
      `-U ${dbConfig.user}`,
      dbConfig.database,
    ].join(' ');

    await execAsync(createCommand, {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      },
    });
  }

  /**
   * Get latest backup file
   */
  private async getLatestBackup(): Promise<string | null> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
        .sort()
        .reverse();

      return backupFiles.length > 0 ? path.join(this.backupDir, backupFiles[0]) : null;

    } catch (error) {
      console.error(`[Recovery] Failed to get latest backup: ${error}`);
      return null;
    }
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
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5].split('?')[0],
    };
  }

  /**
   * Test database restore to temporary database
   */
  private async testDatabaseRestore(backupFile: string): Promise<{
    success: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];
    const testDbName = `sentineliq_test_restore_${Date.now()}`;
    
    try {
      console.log('[Recovery] Creating temporary test database:', testDbName);
      
      // Get database credentials from DATABASE_URL
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseDatabaseUrl(dbUrl);
      const pgEnv = {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      };

      // Create test database
      const createDbCmd = `createdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} ${testDbName}`;
      
      try {
        await execAsync(createDbCmd, { env: pgEnv });
        console.log('[Recovery] Test database created successfully');
      } catch (createError) {
        errors.push('Failed to create test database');
        return { success: false, errors };
      }

      // Restore backup to test database
      let restoreCmd: string;
      if (backupFile.endsWith('.gz')) {
        // Decompress and pipe to psql
        restoreCmd = `gunzip -c "${backupFile}" | psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${testDbName} --quiet`;
      } else {
        restoreCmd = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${testDbName} -f ${backupFile} --quiet`;
      }

      try {
        await execAsync(restoreCmd, { 
          env: pgEnv,
          maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        });
        console.log('[Recovery] Backup restored to test database successfully');
      } catch (restoreError) {
        errors.push('Failed to restore backup to test database');
      }

      // Cleanup: Drop test database
      console.log('[Recovery] Cleaning up test database');
      const dropDbCmd = `dropdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} --if-exists ${testDbName}`;
      
      try {
        await execAsync(dropDbCmd, { env: pgEnv });
      } catch (dropError) {
        console.warn('[Recovery] Failed to drop test database:', dropError);
      }

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      // Attempt cleanup even if error occurred
      try {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
          const dbConfig = this.parseDatabaseUrl(dbUrl);
          const dropDbCmd = `dropdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} --if-exists ${testDbName}`;
          await execAsync(dropDbCmd, {
            env: {
              ...process.env,
              PGPASSWORD: dbConfig.password,
            },
          });
        }
      } catch (cleanupError) {
        console.error('[Recovery] Failed to cleanup test database:', cleanupError);
      }

      return { success: false, errors };
    }
  }

  /**
   * List available recovery points
   */
  async listRecoveryPoints(): Promise<Array<{
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
            timestamp: stats.mtime,
          });
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error(`[Recovery] Failed to list recovery points: ${error}`);
      return [];
    }
  }
}

// Singleton instance
let recoveryServiceInstance: DisasterRecoveryService | null = null;

export function getRecoveryService(): DisasterRecoveryService {
  if (!recoveryServiceInstance) {
    recoveryServiceInstance = new DisasterRecoveryService();
  }
  return recoveryServiceInstance;
}
