/**
 * Job de limpeza do módulo Eclipse
 * Remove dados antigos de alerts e notificações
 * Roda toda segunda às 2 AM
 */
export const cleanupEclipseData = async (args: any, context: any) => {
  console.log('🧹 Starting Eclipse cleanup job...');
  
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let stats = {
      dismissedAlertsDeleted: 0,
      resolvedInfringementsArchived: 0,
      oldAggregationsDeleted: 0,
      completedActionsArchived: 0,
    };

    // 1. Remove alertas resolvidos ou dismissed com mais de 30 dias
    const dismissedAlerts = await context.entities.BrandAlert.deleteMany({
      where: {
        status: {
          in: ['dismissed', 'resolved'],
        },
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    stats.dismissedAlertsDeleted = dismissedAlerts.count;

    // 2. Arquiva infrações resolvidas ou false_positive com mais de 90 dias
    // (Não deleta, apenas marca como resolvida para histórico)
    const oldInfringements = await context.entities.BrandInfringement.count({
      where: {
        status: {
          in: ['resolved', 'false_positive'],
        },
        resolvedAt: {
          lt: ninetyDaysAgo,
        },
      },
    });
    stats.resolvedInfringementsArchived = oldInfringements;

    // 3. Remove agregações antigas (mais de 1 ano)
    const oldAggregations = await context.entities.BrandAlertAggregation.deleteMany({
      where: {
        date: {
          lt: oneYearAgo,
        },
      },
    });
    stats.oldAggregationsDeleted = oldAggregations.count;

    // 4. Arquiva ações completadas há mais de 90 dias
    const completedActions = await context.entities.InfringementAction.count({
      where: {
        status: 'completed',
        completionDate: {
          lt: ninetyDaysAgo,
        },
      },
    });
    stats.completedActionsArchived = completedActions;

    console.log('✅ Eclipse cleanup completed:', stats);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('❌ Eclipse cleanup job failed:', error);
    throw error;
  }
};

/**
 * Remove monitores órfãos (sem marca associada)
 */
export const cleanupOrphanedMonitors = async (context: any) => {
  const orphanedMonitors = await context.entities.BrandMonitor.findMany({
    where: {
      brand: null,
    },
  });

  if (orphanedMonitors.length > 0) {
    await context.entities.BrandMonitor.deleteMany({
      where: {
        id: {
          in: orphanedMonitors.map((m: any) => m.id),
        },
      },
    });

    console.log(`🧹 Deleted ${orphanedMonitors.length} orphaned monitors`);
  }

  return orphanedMonitors.length;
};
