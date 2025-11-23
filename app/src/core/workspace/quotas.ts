import { HttpError } from 'wasp/server';

export interface PlanQuotas {
  maxWorkspaces: number; // -1 = unlimited
  maxMembers: number; // -1 = unlimited
  maxAlertsPerMonth: number; // -1 = unlimited
  maxStorageGB: number;
  maxIncidents: number; // -1 = unlimited
  maxCases: number; // -1 = unlimited
}

export const PLAN_QUOTAS: Record<string, PlanQuotas> = {
  free: {
    maxWorkspaces: 1,
    maxMembers: 3,
    maxAlertsPerMonth: 10,
    maxStorageGB: 1,
    maxIncidents: 5,
    maxCases: 3,
  },
  hobby: {
    maxWorkspaces: 3,
    maxMembers: 10,
    maxAlertsPerMonth: 100,
    maxStorageGB: 10,
    maxIncidents: 50,
    maxCases: 30,
  },
  pro: {
    maxWorkspaces: -1, // unlimited
    maxMembers: -1, // unlimited
    maxAlertsPerMonth: -1, // unlimited
    maxStorageGB: 100,
    maxIncidents: -1, // unlimited
    maxCases: -1, // unlimited
  },
  enterprise: {
    maxWorkspaces: -1, // unlimited
    maxMembers: -1, // unlimited
    maxAlertsPerMonth: -1, // unlimited
    maxStorageGB: -1, // unlimited
    maxIncidents: -1, // unlimited
    maxCases: -1, // unlimited
  },
};

/**
 * Check if workspace has enterprise plan
 */
export function isEnterprisePlan(plan: string | null): boolean {
  return plan === 'enterprise';
}

/**
 * Check if feature requires enterprise plan
 */
export function requiresEnterprisePlan(feature: string): boolean {
  const enterpriseFeatures = [
    'ip_whitelist',
    'sso',
    'advanced_audit',
    'custom_roles',
    'api_access',
  ];
  return enterpriseFeatures.includes(feature);
}

/**
 * Get quota limits for a specific plan
 */
export function getPlanQuotas(plan: string | null): PlanQuotas {
  return PLAN_QUOTAS[plan || 'free'] || PLAN_QUOTAS.free;
}

/**
 * Check if a workspace can add more members
 */
export async function checkMemberQuota(
  context: any,
  workspaceId: string
): Promise<void> {
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: true,
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const quotas = getPlanQuotas(workspace.subscriptionPlan);

  if (quotas.maxMembers === -1) {
    return; // Unlimited
  }

  const currentMemberCount = workspace.members.length;

  if (currentMemberCount >= quotas.maxMembers) {
    throw new HttpError(
      403,
      `Member limit reached. Your ${workspace.subscriptionPlan || 'free'} plan allows up to ${quotas.maxMembers} members. Upgrade to add more.`
    );
  }
}

/**
 * Check if a user can create more workspaces
 */
export async function checkWorkspaceQuota(
  context: any,
  userId: string
): Promise<void> {
  const user = await context.entities.User.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Get user's owned workspaces
  const ownedWorkspaces = await context.entities.Workspace.findMany({
    where: { ownerId: userId },
  });

  // For workspace quota, we check user's subscription plan
  // In this system, user has a free/hobby/pro subscription
  // and workspace inherits limits from user's plan
  
  // If user has any paid workspace, use that plan's quota
  const paidWorkspace = ownedWorkspaces.find((w: any) => w.subscriptionPlan);
  const userPlan = paidWorkspace?.subscriptionPlan || null;
  
  const quotas = getPlanQuotas(userPlan);

  if (quotas.maxWorkspaces === -1) {
    return; // Unlimited
  }

  if (ownedWorkspaces.length >= quotas.maxWorkspaces) {
    throw new HttpError(
      403,
      `Workspace limit reached. Your ${userPlan || 'free'} plan allows up to ${quotas.maxWorkspaces} workspace(s). Upgrade to create more.`
    );
  }
}

/**
 * Get current usage for a workspace
 */
export async function getWorkspaceUsage(
  context: any,
  workspaceId: string
): Promise<{
  members: { current: number; limit: number };
  alerts: { current: number; limit: number };
  incidents: { current: number; limit: number };
  cases: { current: number; limit: number };
  storage: { currentGB: number; limitGB: number };
}> {
  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: true,
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const quotas = getPlanQuotas(workspace.subscriptionPlan);

  // TODO: Add actual counts when alert/incident/case models exist
  const alertsThisMonth = 0; // Count from AegisAlert where createdAt >= startOfMonth
  const totalIncidents = 0; // Count from AegisIncident
  const totalCases = 0; // Count from AegisCase
  const storageUsedGB = 0; // Calculate from file uploads/attachments

  return {
    members: {
      current: workspace.members.length,
      limit: quotas.maxMembers,
    },
    alerts: {
      current: alertsThisMonth,
      limit: quotas.maxAlertsPerMonth,
    },
    incidents: {
      current: totalIncidents,
      limit: quotas.maxIncidents,
    },
    cases: {
      current: totalCases,
      limit: quotas.maxCases,
    },
    storage: {
      currentGB: storageUsedGB,
      limitGB: quotas.maxStorageGB,
    },
  };
}

/**
 * Format usage for display
 */
export function formatUsage(current: number, limit: number): string {
  if (limit === -1) {
    return `${current} (unlimited)`;
  }
  return `${current} / ${limit}`;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) {
    return 0; // Unlimited
  }
  return Math.min(Math.round((current / limit) * 100), 100);
}

/**
 * Check if usage is nearing limit
 */
export function isNearingLimit(current: number, limit: number, threshold: number = 0.8): boolean {
  if (limit === -1) {
    return false; // Unlimited
  }
  return current / limit >= threshold;
}
