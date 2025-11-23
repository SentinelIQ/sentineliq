import type { BrandAlert, BrandInfringement, EclipseBrand } from 'wasp/entities';

export const notifyBrandAlert = async (
  context: any,
  alert: BrandAlert,
  brand: EclipseBrand
) => {
  // Get all workspace members
  const members = await context.entities.WorkspaceMember.findMany({
    where: { workspaceId: alert.workspaceId },
    include: { user: true },
  });

  // Create notification for each member
  for (const member of members) {
    await context.entities.Notification.create({
      data: {
        workspaceId: alert.workspaceId,
        userId: member.userId,
        type: alert.severity === 'critical' ? 'CRITICAL' : alert.severity === 'high' ? 'WARNING' : 'INFO',
        title: `New ${alert.severity} alert for ${brand.name}`,
        message: alert.title,
        link: `/modules/eclipse/detections/${alert.id}`,
        eventType: 'eclipse_alert_created',
        metadata: {
          alertId: alert.id,
          brandId: brand.id,
          brandName: brand.name,
          severity: alert.severity,
          url: alert.url,
        },
      },
    });
  }
};

export const notifyInfringementCreated = async (
  context: any,
  infringement: BrandInfringement,
  brand: EclipseBrand
) => {
  // Get workspace admins and owners
  const adminMembers = await context.entities.WorkspaceMember.findMany({
    where: {
      workspaceId: infringement.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
    include: { user: true },
  });

  // Create notification for admins
  for (const member of adminMembers) {
    await context.entities.Notification.create({
      data: {
        workspaceId: infringement.workspaceId,
        userId: member.userId,
        type: infringement.severity === 'critical' ? 'CRITICAL' : 'WARNING',
        title: `New ${infringement.type} infringement detected`,
        message: `${brand.name}: ${infringement.title}`,
        link: `/modules/eclipse/infringements/${infringement.id}`,
        eventType: 'eclipse_infringement_created',
        metadata: {
          infringementId: infringement.id,
          brandId: brand.id,
          brandName: brand.name,
          type: infringement.type,
          severity: infringement.severity,
          url: infringement.url,
          domain: infringement.domain,
        },
      },
    });
  }
};

export const notifyInfringementResolved = async (
  context: any,
  infringement: BrandInfringement,
  brand: EclipseBrand
) => {
  // Notify the investigator if assigned
  if (infringement.investigatedBy) {
    await context.entities.Notification.create({
      data: {
        workspaceId: infringement.workspaceId,
        userId: infringement.investigatedBy,
        type: 'SUCCESS',
        title: `Infringement resolved`,
        message: `${brand.name}: ${infringement.title} has been resolved`,
        link: `/modules/eclipse/infringements/${infringement.id}`,
        eventType: 'eclipse_infringement_resolved',
        metadata: {
          infringementId: infringement.id,
          brandId: brand.id,
          brandName: brand.name,
        },
      },
    });
  }
};

export const notifyActionAssigned = async (
  context: any,
  action: any,
  infringement: BrandInfringement
) => {
  if (!action.assignedTo) return;

  await context.entities.Notification.create({
    data: {
      workspaceId: action.workspaceId,
      userId: action.assignedTo,
      type: action.priority >= 4 ? 'WARNING' : 'INFO',
      title: `New action assigned to you`,
      message: `${action.actionType}: ${action.title}`,
      link: `/modules/eclipse/infringements/${infringement.id}`,
      eventType: 'eclipse_action_assigned',
      metadata: {
        actionId: action.id,
        infringementId: infringement.id,
        actionType: action.actionType,
        priority: action.priority,
      },
    },
  });
};

export const notifyAegisIncidentCreated = async (
  context: any,
  infringement: BrandInfringement,
  brand: EclipseBrand,
  incident: any
) => {
  // Notify workspace admins about Aegis escalation
  const adminMembers = await context.entities.WorkspaceMember.findMany({
    where: {
      workspaceId: infringement.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  for (const member of adminMembers) {
    await context.entities.Notification.create({
      data: {
        workspaceId: infringement.workspaceId,
        userId: member.userId,
        type: 'CRITICAL',
        title: `Infringement escalated to Aegis`,
        message: `${brand.name} infringement escalated to security incident: ${incident.title}`,
        link: `/modules/aegis/incidents/${incident.id}`,
        eventType: 'eclipse_aegis_escalation',
        metadata: {
          infringementId: infringement.id,
          incidentId: incident.id,
          brandId: brand.id,
          brandName: brand.name,
        },
      },
    });
  }
};
