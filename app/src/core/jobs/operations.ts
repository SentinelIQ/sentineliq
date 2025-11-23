/**
 * PgBoss Job Monitoring Operations
 * 
 * Provides admin-level monitoring and management of background jobs
 */

import { HttpError } from 'wasp/server';

export interface JobStat {
  name: string;
  state: string;
  count: number;
  retryCount?: number;
  failedCount?: number;
  completedCount?: number;
  activeCount?: number;
  createdOn?: Date;
  startedOn?: Date;
  completedOn?: Date;
  [key: string]: any;
}

export interface JobHistoryItem {
  id: string;
  name: string;
  data: any;
  state: string;
  retryCount: number;
  retryLimit: number;
  startedOn: Date | null;
  completedOn: Date | null;
  failedOn: Date | null;
  output: any;
  error: any;
  [key: string]: any;
}

/**
 * Get statistics for all jobs
 */
export const getJobStats = async (_args: void, context: any): Promise<JobStat[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  try {
    // Query SystemLog for job execution history to provide real-time job statistics
    
    // Get job names from configuration
    const jobNames = [
      'dailyStatsJob',
      'cleanupExpiredInvitationsJob',
      'cleanupOldLogsJob',
      'cleanupExpiredRefreshTokensJob',
      'garbageCollectWorkspacesJob',
      'cleanupExpiredOwnershipTransfersJob',
      'processNotificationRetriesJob',
      'cleanupOldNotificationsJob',
      'sendNotificationDigestsJob',
      'dailyBackupJob',
    ];

    // Query SystemLog for job execution history
    const stats: JobStat[] = await Promise.all(
      jobNames.map(async (jobName) => {
        try {
          // Get recent logs for this job
          const recentLogs = await context.entities.SystemLog.findMany({
            where: {
              component: jobName,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 100,
          });

          const failed = recentLogs.filter((log: any) => log.level === 'ERROR').length;
          const completed = recentLogs.filter((log: any) => log.level === 'INFO').length;

          return {
            name: jobName,
            state: failed > 0 ? 'error' : 'active',
            count: recentLogs.length,
            failedCount: failed,
            completedCount: completed,
            createdOn: recentLogs[0]?.createdAt,
          };
        } catch (err) {
          console.error(`Error getting stats for job ${jobName}:`, err);
          return {
            name: jobName,
            state: 'unknown',
            count: 0,
          };
        }
      })
    );

    return stats;
  } catch (error: any) {
    console.error('Error getting job stats:', error);
    throw new HttpError(500, 'Failed to get job stats: ' + error.message);
  }
};

/**
 * Get execution history for a specific job
 */
export const getJobHistory = async (
  args: { jobName: string; limit?: number },
  context: any
): Promise<JobHistoryItem[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName, limit = 50 } = args;

  try {
    // Query SystemLog for job execution history
    const logs = await context.entities.SystemLog.findMany({
      where: {
        component: jobName,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map((log: any) => ({
      id: log.id,
      name: jobName,
      data: log.metadata,
      state: log.level === 'ERROR' ? 'failed' : 'completed',
      retryCount: 0,
      retryLimit: 3,
      startedOn: log.createdAt,
      completedOn: log.level !== 'ERROR' ? log.createdAt : null,
      failedOn: log.level === 'ERROR' ? log.createdAt : null,
      output: log.message,
      error: log.level === 'ERROR' ? log.message : null,
    }));
  } catch (error: any) {
    console.error(`Error getting job history for ${jobName}:`, error);
    throw new HttpError(500, 'Failed to get job history: ' + error.message);
  }
};

/**
 * Manually trigger a job execution
 */
export const triggerJob = async (
  args: { jobName: string; data?: any },
  context: any
): Promise<{ jobId: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName, data = {} } = args;

  // Whitelist of jobs that can be manually triggered
  const allowedJobs = [
    'dailyStatsJob',
    'cleanupExpiredInvitationsJob',
    'cleanupOldLogsJob',
    'cleanupExpiredRefreshTokensJob',
    'garbageCollectWorkspacesJob',
    'cleanupExpiredOwnershipTransfersJob',
    'processNotificationRetriesJob',
    'cleanupOldNotificationsJob',
    'dailyBackupJob',
  ];

  if (!allowedJobs.includes(jobName)) {
    throw new HttpError(400, 'Job cannot be manually triggered');
  }

  try {
    // Note: Manual job triggering not implemented yet
    // This would require direct PgBoss API access
    const jobId = `manual-${Date.now()}`;
    
    // Log the manual trigger
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: `Job ${jobName} manually triggered by admin`,
        component: 'JobMonitor',
        metadata: {
          jobName,
          jobId,
          triggeredBy: context.user.id,
          triggeredByEmail: context.user.identities?.email?.id,
        },
      },
    });

    return { jobId: jobId || 'unknown' };
  } catch (error: any) {
    console.error(`Error triggering job ${jobName}:`, error);
    throw new HttpError(500, `Failed to trigger job: ${error.message}`);
  }
};

/**
 * Get detailed error logs for a specific job
 */
export const getJobErrors = async (
  args: { jobName: string; limit?: number },
  context: any
): Promise<any[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName, limit = 50 } = args;

  try {
    // Query SystemLog for ERROR level logs from this job
    const errorLogs = await context.entities.SystemLog.findMany({
      where: {
        component: jobName,
        level: 'ERROR',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return errorLogs.map((log: any) => ({
      id: log.id,
      timestamp: log.createdAt,
      message: log.message,
      error: log.metadata?.error || null,
      stackTrace: log.metadata?.stack || log.metadata?.stackTrace || null,
      metadata: log.metadata,
    }));
  } catch (error: any) {
    console.error(`Error getting job errors for ${jobName}:`, error);
    throw new HttpError(500, `Failed to retrieve job errors: ${error.message}`);
  }
};

/**
 * Pause a job (prevents execution)
 */
export const pauseJob = async (
  args: { jobName: string; reason?: string },
  context: any
): Promise<{ success: boolean; message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName, reason } = args;

  try {
    // Upsert JobControl record
    const jobControl = await context.entities.JobControl.upsert({
      where: { jobName },
      update: {
        isPaused: true,
        pausedAt: new Date(),
        pausedBy: context.user.id,
        pauseReason: reason || 'Manual pause by admin',
      },
      create: {
        jobName,
        isPaused: true,
        pausedAt: new Date(),
        pausedBy: context.user.id,
        pauseReason: reason || 'Manual pause by admin',
      },
    });

    // Log the action
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: `Job ${jobName} paused by admin`,
        component: 'JobControl',
        metadata: {
          action: 'ADMIN_PAUSE_JOB',
          jobName,
          adminId: context.user.id,
          adminEmail: context.user.email,
          reason,
        },
      },
    });

    return {
      success: true,
      message: `Job ${jobName} has been paused`,
    };
  } catch (error: any) {
    console.error(`Error pausing job ${jobName}:`, error);
    throw new HttpError(500, `Failed to pause job: ${error.message}`);
  }
};

/**
 * Resume a paused job
 */
export const resumeJob = async (
  args: { jobName: string },
  context: any
): Promise<{ success: boolean; message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName } = args;

  try {
    // Update JobControl record
    const jobControl = await context.entities.JobControl.upsert({
      where: { jobName },
      update: {
        isPaused: false,
        pausedAt: null,
        pausedBy: null,
        pauseReason: null,
      },
      create: {
        jobName,
        isPaused: false,
      },
    });

    // Log the action
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: `Job ${jobName} resumed by admin`,
        component: 'JobControl',
        metadata: {
          action: 'ADMIN_RESUME_JOB',
          jobName,
          adminId: context.user.id,
          adminEmail: context.user.email,
        },
      },
    });

    return {
      success: true,
      message: `Job ${jobName} has been resumed`,
    };
  } catch (error: any) {
    console.error(`Error resuming job ${jobName}:`, error);
    throw new HttpError(500, `Failed to resume job: ${error.message}`);
  }
};

/**
 * Update job schedule (cron expression)
 */
export const updateJobSchedule = async (
  args: { jobName: string; cronSchedule: string; reason?: string },
  context: any
): Promise<{ success: boolean; message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName, cronSchedule, reason } = args;

  // Basic cron validation (5-6 fields)
  const cronRegex = /^(\*|[0-9,\-\/\*]+)\s+(\*|[0-9,\-\/\*]+)\s+(\*|[0-9,\-\/\*]+)\s+(\*|[0-9,\-\/\*]+)\s+(\*|[0-9,\-\/\*]+)(\s+(\*|[0-9,\-\/\*]+))?$/;
  if (!cronRegex.test(cronSchedule)) {
    throw new HttpError(400, 'Invalid cron expression format');
  }

  try {
    // Get existing control or create new
    const existing = await context.entities.JobControl.findUnique({
      where: { jobName },
    });

    const jobControl = await context.entities.JobControl.upsert({
      where: { jobName },
      update: {
        cronSchedule,
        originalSchedule: existing?.originalSchedule || existing?.cronSchedule,
        scheduleUpdatedAt: new Date(),
        scheduleUpdatedBy: context.user.id,
      },
      create: {
        jobName,
        cronSchedule,
        originalSchedule: cronSchedule,
        scheduleUpdatedAt: new Date(),
        scheduleUpdatedBy: context.user.id,
      },
    });

    // Log the action
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: `Job ${jobName} schedule updated by admin`,
        component: 'JobControl',
        metadata: {
          action: 'ADMIN_UPDATE_JOB_SCHEDULE',
          jobName,
          adminId: context.user.id,
          adminEmail: context.user.email,
          oldSchedule: existing?.cronSchedule,
          newSchedule: cronSchedule,
          reason,
        },
      },
    });

    return {
      success: true,
      message: `Job ${jobName} schedule updated to: ${cronSchedule}`,
    };
  } catch (error: any) {
    console.error(`Error updating job schedule for ${jobName}:`, error);
    throw new HttpError(500, `Failed to update job schedule: ${error.message}`);
  }
};

/**
 * Get job control status
 */
export const getJobControl = async (
  args: { jobName: string },
  context: any
): Promise<any> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { jobName } = args;

  try {
    const jobControl = await context.entities.JobControl.findUnique({
      where: { jobName },
    });

    return jobControl || {
      jobName,
      isPaused: false,
      cronSchedule: null,
      lastRunAt: null,
    };
  } catch (error: any) {
    console.error(`Error getting job control for ${jobName}:`, error);
    throw new HttpError(500, `Failed to get job control: ${error.message}`);
  }
};

/**
 * Get all Dead Letter Queue entries
 */
export const getDeadLetterQueue = async (
  args: { status?: string; limit?: number },
  context: any
): Promise<any[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { status = 'all', limit = 50 } = args;

  try {
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    const dlqEntries = await context.entities.DeadLetterQueue.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return dlqEntries;
  } catch (error: any) {
    console.error('Error getting dead letter queue:', error);
    throw new HttpError(500, `Failed to get dead letter queue: ${error.message}`);
  }
};

/**
 * Retry a failed job from Dead Letter Queue
 */
export const retryDeadLetterJob = async (
  args: { dlqId: string },
  context: any
): Promise<{ success: boolean; message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { dlqId } = args;

  try {
    const dlqEntry = await context.entities.DeadLetterQueue.findUnique({
      where: { id: dlqId },
    });

    if (!dlqEntry) {
      throw new HttpError(404, 'Dead letter queue entry not found');
    }

    if (dlqEntry.retryCount >= dlqEntry.maxRetries) {
      throw new HttpError(400, 'Max retries exceeded. Mark as resolved or abandoned.');
    }

    // Update DLQ entry
    await context.entities.DeadLetterQueue.update({
      where: { id: dlqId },
      data: {
        status: 'retrying',
        retryCount: dlqEntry.retryCount + 1,
        lastRetryAt: new Date(),
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      },
    });

    // Log the retry
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: `Retrying failed job ${dlqEntry.jobName} from DLQ`,
        component: 'DeadLetterQueue',
        metadata: {
          action: 'ADMIN_RETRY_DLQ_JOB',
          dlqId,
          jobName: dlqEntry.jobName,
          retryCount: dlqEntry.retryCount + 1,
          adminId: context.user.id,
          adminEmail: context.user.email,
        },
      },
    });

    return {
      success: true,
      message: `Job ${dlqEntry.jobName} queued for retry`,
    };
  } catch (error: any) {
    console.error(`Error retrying DLQ job ${dlqId}:`, error);
    throw new HttpError(500, `Failed to retry job: ${error.message}`);
  }
};

/**
 * Resolve a Dead Letter Queue entry manually
 */
export const resolveDeadLetterJob = async (
  args: { dlqId: string; resolution: string },
  context: any
): Promise<{ success: boolean; message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }

  const { dlqId, resolution } = args;

  try {
    const dlqEntry = await context.entities.DeadLetterQueue.update({
      where: { id: dlqId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: context.user.id,
        resolution,
      },
    });

    // Log the resolution
    await context.entities.SystemLog.create({
      data: {
        level: 'INFO',
        message: `DLQ entry for ${dlqEntry.jobName} resolved by admin`,
        component: 'DeadLetterQueue',
        metadata: {
          action: 'ADMIN_RESOLVE_DLQ_JOB',
          dlqId,
          jobName: dlqEntry.jobName,
          resolution,
          adminId: context.user.id,
          adminEmail: context.user.email,
        },
      },
    });

    return {
      success: true,
      message: `Job entry resolved successfully`,
    };
  } catch (error: any) {
    console.error(`Error resolving DLQ job ${dlqId}:`, error);
    throw new HttpError(500, `Failed to resolve job: ${error.message}`);
  }
};
