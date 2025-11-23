/**
 * Scheduled Backup Job
 * 
 * Daily automated backup job using PgBoss
 */

import { getBackupService } from './backup';

export const performDailyBackup = async (_args: any, context: any) => {
  console.log('[BackupJob] Starting daily database backup...');
  
  try {
    const backupService = getBackupService();
    const result = await backupService.createBackup();

    if (result.success) {
      console.log(`[BackupJob] Backup completed successfully: ${result.filePath}`);
      
      // Get backup stats
      const stats = await backupService.getBackupStats();
      console.log('[BackupJob] Backup statistics:', stats);

    } else {
      console.error(`[BackupJob] Backup failed: ${result.error}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BackupJob] Unexpected error: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      console.error(`[BackupJob] Stack trace: ${error.stack}`);
    }
  }
};
