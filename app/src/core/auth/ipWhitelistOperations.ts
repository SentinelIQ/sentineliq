import { HttpError } from 'wasp/server';
import type { 
  GetWorkspaceIpWhitelist,
  UpdateWorkspaceIpWhitelist,
  AddIpToWhitelist,
  RemoveIpFromWhitelist,
  ToggleIpWhitelist,
} from 'wasp/server/operations';
import { isValidWhitelistEntry } from './ipWhitelist';
import { isEnterprisePlan } from '../workspace/quotas';

// Get workspace IP whitelist
export const getWorkspaceIpWhitelist: GetWorkspaceIpWhitelist<
  { workspaceId: string },
  { ipWhitelist: string[]; ipWhitelistEnabled: boolean; isEnterprise: boolean }
> = async ({ workspaceId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: context.user.id },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  // Check if user is a member with admin rights
  const member = workspace.members[0];
  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new HttpError(403, 'Only workspace owners and admins can view IP whitelist');
  }

  const isEnterprise = isEnterprisePlan(workspace.subscriptionPlan);

  return {
    ipWhitelist: workspace.ipWhitelist || [],
    ipWhitelistEnabled: workspace.ipWhitelistEnabled,
    isEnterprise,
  };
};

// Update entire IP whitelist
export const updateWorkspaceIpWhitelist: UpdateWorkspaceIpWhitelist<
  { workspaceId: string; ipWhitelist: string[] },
  void
> = async ({ workspaceId, ipWhitelist }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: context.user.id },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const member = workspace.members[0];
  if (!member || member.role !== 'OWNER') {
    throw new HttpError(403, 'Only workspace owners can update IP whitelist');
  }

  // Check if workspace has enterprise plan
  if (!isEnterprisePlan(workspace.subscriptionPlan)) {
    throw new HttpError(403, 'IP whitelisting is an enterprise feature. Please upgrade to Enterprise plan.');
  }

  // Validate all IP entries
  const invalidEntries = ipWhitelist.filter((ip) => !isValidWhitelistEntry(ip));
  if (invalidEntries.length > 0) {
    throw new HttpError(400, `Invalid IP entries: ${invalidEntries.join(', ')}`);
  }

  await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: { ipWhitelist },
  });

  // Audit log
  await context.entities.AuditLog.create({
    data: {
      workspaceId,
      userId: context.user.id,
      action: 'SETTINGS_UPDATED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `Updated IP whitelist (${ipWhitelist.length} entries)`,
      metadata: { ipWhitelist },
    },
  });
};

// Add single IP to whitelist
export const addIpToWhitelist: AddIpToWhitelist<
  { workspaceId: string; ip: string },
  void
> = async ({ workspaceId, ip }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!isValidWhitelistEntry(ip)) {
    throw new HttpError(400, `Invalid IP address or format: ${ip}`);
  }

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: context.user.id },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const member = workspace.members[0];
  if (!member || member.role !== 'OWNER') {
    throw new HttpError(403, 'Only workspace owners can modify IP whitelist');
  }

  // Check if workspace has enterprise plan
  if (!isEnterprisePlan(workspace.subscriptionPlan)) {
    throw new HttpError(403, 'IP whitelisting is an enterprise feature. Please upgrade to Enterprise plan.');
  }

  const currentWhitelist = workspace.ipWhitelist || [];
  if (currentWhitelist.includes(ip)) {
    throw new HttpError(400, 'IP already in whitelist');
  }

  await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: {
      ipWhitelist: [...currentWhitelist, ip],
    },
  });

  // Audit log
  await context.entities.AuditLog.create({
    data: {
      workspaceId,
      userId: context.user.id,
      action: 'SETTINGS_UPDATED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `Added IP to whitelist: ${ip}`,
      metadata: { ip, action: 'add' },
    },
  });
};

// Remove IP from whitelist
export const removeIpFromWhitelist: RemoveIpFromWhitelist<
  { workspaceId: string; ip: string },
  void
> = async ({ workspaceId, ip }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: context.user.id },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const member = workspace.members[0];
  if (!member || member.role !== 'OWNER') {
    throw new HttpError(403, 'Only workspace owners can modify IP whitelist');
  }

  // Check if workspace has enterprise plan
  if (!isEnterprisePlan(workspace.subscriptionPlan)) {
    throw new HttpError(403, 'IP whitelisting is an enterprise feature. Please upgrade to Enterprise plan.');
  }

  const currentWhitelist = workspace.ipWhitelist || [];
  const newWhitelist = currentWhitelist.filter((entry) => entry !== ip);

  await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: {
      ipWhitelist: newWhitelist,
    },
  });

  // Audit log
  await context.entities.AuditLog.create({
    data: {
      workspaceId,
      userId: context.user.id,
      action: 'SETTINGS_UPDATED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `Removed IP from whitelist: ${ip}`,
      metadata: { ip, action: 'remove' },
    },
  });
};

// Toggle IP whitelisting on/off
export const toggleIpWhitelist: ToggleIpWhitelist<
  { workspaceId: string; enabled: boolean },
  void
> = async ({ workspaceId, enabled }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: context.user.id },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const member = workspace.members[0];
  if (!member || member.role !== 'OWNER') {
    throw new HttpError(403, 'Only workspace owners can toggle IP whitelist');
  }

  // Check if workspace has enterprise plan
  if (!isEnterprisePlan(workspace.subscriptionPlan)) {
    throw new HttpError(403, 'IP whitelisting is an enterprise feature. Please upgrade to Enterprise plan.');
  }

  // Check if there are IPs in whitelist before enabling
  if (enabled && (!workspace.ipWhitelist || workspace.ipWhitelist.length === 0)) {
    throw new HttpError(400, 'Cannot enable IP whitelisting without adding at least one IP address');
  }

  await context.entities.Workspace.update({
    where: { id: workspaceId },
    data: {
      ipWhitelistEnabled: enabled,
    },
  });

  // Audit log
  await context.entities.AuditLog.create({
    data: {
      workspaceId,
      userId: context.user.id,
      action: 'SETTINGS_UPDATED',
      resource: 'workspace',
      resourceId: workspaceId,
      description: `IP whitelist ${enabled ? 'enabled' : 'disabled'}`,
      metadata: { ipWhitelistEnabled: enabled },
    },
  });
};
