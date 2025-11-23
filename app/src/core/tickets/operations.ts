import { HttpError } from 'wasp/server';
import type { TicketProvider } from 'wasp/entities';

interface TicketProviderConfig {
  workspaceId: string;
  provider: 'JIRA' | 'SERVICENOW' | 'AZURE_DEVOPS';
  isEnabled: boolean;
  config: Record<string, any>;
}

/**
 * Get ticket providers for a workspace
 */
export const getTicketProviders = async (args: { workspaceId: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  // Verify user has access to workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: args.workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return context.entities.TicketProvider.findMany({
    where: {
      workspaceId: args.workspaceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Save ticket provider configuration
 */
export const saveTicketProvider = async (args: TicketProviderConfig, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  // Verify user is admin or owner of workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: args.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You must be an admin or owner to configure ticket providers');
  }

  // Validate required fields per provider
  validateTicketProviderConfig(args.provider, args.config);

  // Upsert provider
  return context.entities.TicketProvider.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: args.workspaceId,
        provider: args.provider,
      },
    },
    create: {
      workspaceId: args.workspaceId,
      provider: args.provider,
      isEnabled: args.isEnabled,
      config: args.config,
    },
    update: {
      isEnabled: args.isEnabled,
      config: args.config,
    },
  });
};

/**
 * Toggle ticket provider on/off
 */
export const toggleTicketProvider = async (args: { id: string; isEnabled: boolean }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const provider = await context.entities.TicketProvider.findUnique({
    where: { id: args.id },
  });

  if (!provider) {
    throw new HttpError(404, 'Ticket provider not found');
  }

  // Verify user is admin or owner of workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: provider.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return context.entities.TicketProvider.update({
    where: { id: args.id },
    data: { isEnabled: args.isEnabled },
  });
};

/**
 * Delete ticket provider
 */
export const deleteTicketProvider = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const provider = await context.entities.TicketProvider.findUnique({
    where: { id: args.id },
  });

  if (!provider) {
    throw new HttpError(404, 'Ticket provider not found');
  }

  // Verify user is admin or owner of workspace
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: provider.workspaceId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return context.entities.TicketProvider.delete({
    where: { id: args.id },
  });
};

/**
 * Validate ticket provider configuration
 */
function validateTicketProviderConfig(provider: string, config: Record<string, any>) {
  const requiredFields: Record<string, string[]> = {
    JIRA: ['baseUrl', 'apiToken', 'projectKey', 'issueType'],
    SERVICENOW: ['instanceUrl', 'username', 'password', 'tableName'],
    AZURE_DEVOPS: ['organization', 'project', 'personalAccessToken', 'workItemType'],
  };

  const fields = requiredFields[provider];
  if (!fields) {
    throw new HttpError(400, `Unknown ticket provider: ${provider}`);
  }

  const missingFields = fields.filter((field) => !config[field]);
  if (missingFields.length > 0) {
    throw new HttpError(400, `Missing required fields: ${missingFields.join(', ')}`);
  }
}
