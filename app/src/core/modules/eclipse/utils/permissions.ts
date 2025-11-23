import { HttpError } from 'wasp/server';
import type { EclipseBrand, BrandMonitor, BrandInfringement } from 'wasp/entities';

export const checkWorkspaceAccess = async (context: any, workspaceId: string) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'No access to this workspace');
  }

  return membership;
};

export const canManageBrand = async (context: any, brand: EclipseBrand) => {
  const membership = await checkWorkspaceAccess(context, brand.workspaceId);
  
  const canManage = membership.role === 'OWNER' || membership.role === 'ADMIN';
  if (!canManage) {
    throw new HttpError(403, 'Insufficient permissions to manage brands');
  }
  
  return true;
};

export const canManageMonitor = async (context: any, monitor: BrandMonitor) => {
  const membership = await checkWorkspaceAccess(context, monitor.workspaceId);
  
  const canManage = membership.role === 'OWNER' || membership.role === 'ADMIN';
  if (!canManage) {
    throw new HttpError(403, 'Insufficient permissions to manage monitors');
  }
  
  return true;
};

export const canViewBrand = async (context: any, brand: EclipseBrand) => {
  await checkWorkspaceAccess(context, brand.workspaceId);
  return true;
};

export const canManageInfringement = async (context: any, infringement: BrandInfringement) => {
  const membership = await checkWorkspaceAccess(context, infringement.workspaceId);
  
  const canManage = membership.role === 'OWNER' || membership.role === 'ADMIN';
  if (!canManage) {
    throw new HttpError(403, 'Insufficient permissions to manage infringements');
  }
  
  return true;
};
