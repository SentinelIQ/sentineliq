import type { EclipseBrand, BrandMonitor, BrandAlert, BrandInfringement, InfringementAction } from 'wasp/entities';

export const logBrandCreated = async (context: any, brand: EclipseBrand) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: brand.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_BRAND_CREATED',
      resource: 'eclipse_brand',
      resourceId: brand.id,
      metadata: {
        name: brand.name,
        priority: brand.priority,
        trademark: brand.trademark,
      },
      description: `Brand "${brand.name}" created`,
    },
  });
};

export const logBrandUpdated = async (context: any, brand: EclipseBrand, changes: any) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: brand.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_BRAND_UPDATED',
      resource: 'eclipse_brand',
      resourceId: brand.id,
      metadata: changes,
      description: `Brand "${brand.name}" updated`,
    },
  });
};

export const logBrandDeleted = async (context: any, brand: EclipseBrand) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: brand.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_BRAND_DELETED',
      resource: 'eclipse_brand',
      resourceId: brand.id,
      metadata: {
        name: brand.name,
      },
      description: `Brand "${brand.name}" deleted`,
    },
  });
};

export const logMonitorCreated = async (context: any, monitor: BrandMonitor, brand: EclipseBrand) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: monitor.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_MONITOR_CREATED',
      resource: 'eclipse_monitor',
      resourceId: monitor.id,
      metadata: {
        brandName: brand.name,
        monitoringType: monitor.monitoringType,
        source: monitor.source,
        searchTerms: monitor.searchTerms,
      },
      description: `Monitor created for brand "${brand.name}"`,
    },
  });
};

export const logMonitorUpdated = async (context: any, monitor: BrandMonitor, changes: any) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: monitor.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_MONITOR_UPDATED',
      resource: 'eclipse_monitor',
      resourceId: monitor.id,
      metadata: changes,
      description: `Monitor updated`,
    },
  });
};

export const logAlertCreated = async (context: any, alert: BrandAlert, brand: EclipseBrand) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: alert.workspaceId,
      userId: context.user?.id,
      action: 'ECLIPSE_ALERT_CREATED',
      resource: 'eclipse_alert',
      resourceId: alert.id,
      metadata: {
        brandName: brand.name,
        severity: alert.severity,
        title: alert.title,
        url: alert.url,
      },
      description: `Alert created for brand "${brand.name}": ${alert.title}`,
    },
  });
};

export const logAlertAcknowledged = async (context: any, alert: BrandAlert) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: alert.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_ALERT_ACKNOWLEDGED',
      resource: 'eclipse_alert',
      resourceId: alert.id,
      metadata: {
        severity: alert.severity,
      },
      description: `Alert acknowledged: ${alert.title}`,
    },
  });
};

export const logAlertEscalated = async (context: any, alert: BrandAlert, infringement: BrandInfringement) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: alert.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_ALERT_ESCALATED',
      resource: 'eclipse_alert',
      resourceId: alert.id,
      metadata: {
        infringementId: infringement.id,
        infringementTitle: infringement.title,
      },
      description: `Alert escalated to infringement: ${infringement.title}`,
    },
  });
};

export const logInfringementCreated = async (context: any, infringement: BrandInfringement, brand: EclipseBrand) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: infringement.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_INFRINGEMENT_CREATED',
      resource: 'eclipse_infringement',
      resourceId: infringement.id,
      metadata: {
        brandName: brand.name,
        type: infringement.type,
        severity: infringement.severity,
        url: infringement.url,
        domain: infringement.domain,
      },
      description: `Infringement reported for brand "${brand.name}": ${infringement.title}`,
    },
  });
};

export const logInfringementUpdated = async (context: any, infringement: BrandInfringement, changes: any) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: infringement.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_INFRINGEMENT_UPDATED',
      resource: 'eclipse_infringement',
      resourceId: infringement.id,
      metadata: changes,
      description: `Infringement updated: ${infringement.title}`,
    },
  });
};

export const logActionCreated = async (context: any, action: InfringementAction, infringement: BrandInfringement) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: action.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_ACTION_CREATED',
      resource: 'eclipse_action',
      resourceId: action.id,
      metadata: {
        infringementTitle: infringement.title,
        actionType: action.actionType,
        priority: action.priority,
      },
      description: `Action created for infringement "${infringement.title}": ${action.title}`,
    },
  });
};

export const logActionCompleted = async (context: any, action: InfringementAction) => {
  await context.entities.AuditLog.create({
    data: {
      workspaceId: action.workspaceId,
      userId: context.user.id,
      action: 'ECLIPSE_ACTION_COMPLETED',
      resource: 'eclipse_action',
      resourceId: action.id,
      metadata: {
        result: action.result,
      },
      description: `Action completed: ${action.title}`,
    },
  });
};
