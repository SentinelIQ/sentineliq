import { createLogger } from '../logs/logger';

const logger = createLogger('workspace-cleanup');

/**
 * ✅ Cleanup Expired Workspace Invitations
 * 
 * Removes expired workspace invitations that were never accepted.
 * Runs daily at 2 AM
 */
export const cleanupExpiredInvitations = async (_args: any, context: any) => {
  logger.info('Starting cleanup of expired workspace invitations');

  try {
    const now = new Date();
    
    // Delete all invitations that have expired and were not accepted
    const result = await context.entities.WorkspaceInvitation.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        acceptedAt: null,
      },
    });

    logger.info('Expired workspace invitations cleaned up', {
      deletedCount: result.count,
    });
    
    return result.count;
  } catch (error: any) {
    logger.error('Cleanup expired invitations job failed', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * ✅ Garbage Collection: Permanently delete workspaces that have been soft-deleted for 30+ days
 * 
 * This job runs daily at 5 AM to cleanup workspaces marked as deleted.
 * Related data (members, invitations, etc.) are automatically cascade-deleted by Prisma.
 */
export const garbageCollectWorkspaces = async (_args: unknown, context: any) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  logger.info('Starting workspace garbage collection', {
    cutoffDate: thirtyDaysAgo.toISOString(),
  });

  try {
    // Find workspaces eligible for permanent deletion
    const eligibleWorkspaces = await context.entities.Workspace.findMany({
      where: {
        isActive: false,
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        ownerId: true,
      },
    });

    if (eligibleWorkspaces.length === 0) {
      logger.info('No workspaces eligible for garbage collection');
      return { deletedCount: 0 };
    }

    logger.info(`Found ${eligibleWorkspaces.length} workspaces for permanent deletion`);

    // Permanently delete each workspace
    let successCount = 0;
    let errorCount = 0;

    for (const workspace of eligibleWorkspaces) {
      try {
        // 🔒 Atomic deletion: Prisma cascade will handle related entities
        await context.entities.Workspace.delete({
          where: { id: workspace.id },
        });

        logger.info('Workspace permanently deleted', {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          slug: workspace.slug,
          deletedAt: workspace.deletedAt,
          daysSinceDeleted: Math.floor(
            (Date.now() - workspace.deletedAt!.getTime()) / (1000 * 60 * 60 * 24)
          ),
        });

        successCount++;
      } catch (error: any) {
        logger.error('Failed to permanently delete workspace', {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          error: error.message,
        });
        errorCount++;
      }
    }

    logger.info('Workspace garbage collection completed', {
      total: eligibleWorkspaces.length,
      success: successCount,
      errors: errorCount,
    });

    return {
      deletedCount: successCount,
      errorCount,
      workspaces: eligibleWorkspaces.map((w: any) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
      })),
    };
  } catch (error: any) {
    logger.error('Workspace garbage collection job failed', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * ✅ Cleanup Expired Ownership Transfer Confirmations
 * 
 * Removes expired ownership transfer confirmation tokens (24 hours expiry)
 * that were never confirmed. This prevents database bloat.
 */
export const cleanupExpiredOwnershipTransfers = async (_args: unknown, context: any) => {
  logger.info('Starting cleanup of expired ownership transfer confirmations');

  try {
    const result = await context.entities.OwnershipTransferConfirmation.deleteMany({
      where: {
        confirmedAt: null, // Never confirmed
        expiresAt: {
          lt: new Date(), // Expired
        },
      },
    });

    logger.info('Expired ownership transfers cleaned up', {
      deletedCount: result.count,
    });

    return {
      deletedCount: result.count,
    };
  } catch (error: any) {
    logger.error('Cleanup expired ownership transfers job failed', {
      error: error.message,
    });
    throw error;
  }
};
