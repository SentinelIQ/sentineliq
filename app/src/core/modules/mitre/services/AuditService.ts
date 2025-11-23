/**
 * MITRE Module - Audit Service
 * 
 * Service for logging TTP operations to AuditLog for compliance tracking
 */

export interface AuditContext {
  userId: string;
  workspaceId: string;
  userAgent?: string;
  ipAddress?: string;
}

export class TTPAuditService {
  /**
   * Log TTP linked action
   */
  static async logTTPLinked(
    context: AuditContext,
    resourceId: string,
    resourceType: string,
    techniqueId: string,
    techniqueName: string,
    entities: any
  ) {
    try {
      await entities.AuditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          action: 'TTP_LINKED', // TTP was linked to a resource
          resource: 'TTP',
          resourceId: resourceId,
          description: `Linked TTP ${techniqueId} (${techniqueName}) to ${resourceType} ${resourceId}`,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          metadata: {
            techniqueId,
            techniqueName,
            resourceType,
            resourceId,
            action: 'LINK',
          },
        },
      });
    } catch (error) {
      console.error('[TTP Audit] Error logging TTP link:', error);
      // Don't throw - audit logging should not block operations
    }
  }

  /**
   * Log TTP unlinked action
   */
  static async logTTPUnlinked(
    context: AuditContext,
    resourceId: string,
    resourceType: string,
    techniqueId: string,
    techniqueName: string,
    entities: any
  ) {
    try {
      await entities.AuditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          action: 'TTP_UNLINKED', // TTP was unlinked from a resource
          resource: 'TTP',
          resourceId: resourceId,
          description: `Unlinked TTP ${techniqueId} (${techniqueName}) from ${resourceType} ${resourceId}`,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          metadata: {
            techniqueId,
            techniqueName,
            resourceType,
            resourceId,
            action: 'UNLINK',
          },
        },
      });
    } catch (error) {
      console.error('[TTP Audit] Error logging TTP unlink:', error);
    }
  }

  /**
   * Log TTP sync action
   */
  static async logTTPSync(
    context: AuditContext,
    stats: {
      tactics: { created: number; updated: number };
      techniques: { created: number; updated: number };
      subtechniques: { created: number; updated: number };
    },
    entities: any
  ) {
    try {
      await entities.AuditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: 'system', // System operation
          action: 'TTP_SYNCED', // MITRE data was synced
          resource: 'MITRE',
          description: `Synced MITRE ATT&CK data: ${stats.tactics.created + stats.tactics.updated} tactics, ${stats.techniques.created + stats.techniques.updated} techniques, ${stats.subtechniques.created + stats.subtechniques.updated} sub-techniques`,
          metadata: {
            action: 'SYNC',
            stats,
          },
        },
      });
    } catch (error) {
      console.error('[TTP Audit] Error logging MITRE sync:', error);
    }
  }

  /**
   * Log TTP occurrence update
   */
  static async logTTPOccurrenceUpdated(
    context: AuditContext,
    resourceId: string,
    resourceType: string,
    techniqueId: string,
    occurrenceCount: number,
    entities: any
  ) {
    try {
      await entities.AuditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          action: 'TTP_OCCURRENCE_UPDATED', // TTP occurrence count was updated
          resource: 'TTP',
          resourceId: resourceId,
          description: `Updated TTP ${techniqueId} occurrence count to ${occurrenceCount} in ${resourceType} ${resourceId}`,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          metadata: {
            techniqueId,
            resourceType,
            resourceId,
            occurrenceCount,
            action: 'UPDATE_OCCURRENCE',
          },
        },
      });
    } catch (error) {
      console.error('[TTP Audit] Error logging TTP occurrence update:', error);
    }
  }
}
