import * as Sentry from '@sentry/node';
import type { User, Workspace } from 'wasp/entities';
import { prisma } from 'wasp/server';

/**
 * Interface para contexto enriquecido do Sentry
 */
export interface SentryUserContext {
  userId: string;
  email?: string;
  username?: string;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceRole?: string;
}

/**
 * Enriquece o contexto do Sentry com informações completas do usuário e workspace
 * Permite suporte prioritário para clientes pagantes
 */
export async function enrichSentryContext(userId: string, workspaceId?: string): Promise<void> {
  try {
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.warn(`⚠️ User ${userId} not found for Sentry context`);
      return;
    }

    // Determinar workspace (prioritiza parâmetro, depois currentWorkspace)
    let workspace: Workspace | null = null;
    let workspaceRole: string | undefined;

    // Usar workspaceId fornecido ou currentWorkspaceId do usuário
    const targetWorkspaceId = workspaceId || user.currentWorkspaceId;

    if (targetWorkspaceId) {
      // Buscar workspace e role do membro
      workspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId },
      });

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: targetWorkspaceId,
          userId: userId,
        },
      });
      
      workspaceRole = member?.role;
    }

    // Email vem diretamente do User
    const email = user.email || undefined;

    // Determinar se tem assinatura ativa
    const hasActiveSubscription = workspace?.subscriptionStatus === 'active';
    const subscriptionPlan = workspace?.subscriptionPlan || 'free';

    // Contexto do usuário para Sentry
    const userContext: SentryUserContext = {
      userId: user.id,
      email,
      username: user.username || undefined,
      isAdmin: user.isAdmin,
      hasActiveSubscription,
      subscriptionPlan,
      subscriptionStatus: workspace?.subscriptionStatus || undefined,
      workspaceId: workspace?.id,
      workspaceName: workspace?.name,
      workspaceRole,
    };

    // Definir usuário no Sentry
    Sentry.setUser({
      id: user.id,
      email,
      username: user.username || undefined,
    });

    // Adicionar tags para filtros rápidos no Sentry
    Sentry.setTags({
      user_id: user.id,
      is_admin: user.isAdmin,
      has_subscription: hasActiveSubscription,
      subscription_plan: subscriptionPlan,
      subscription_status: workspace?.subscriptionStatus || 'none',
      workspace_id: workspace?.id || 'none',
      workspace_role: workspaceRole || 'none',
    });

    // Adicionar contexto completo
    Sentry.setContext('user', {
      id: user.id,
      email,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });

    Sentry.setContext('subscription', {
      hasActiveSubscription,
      plan: subscriptionPlan,
      status: workspace?.subscriptionStatus,
      paymentProcessorUserId: workspace?.paymentProcessorUserId,
      trialEndsAt: workspace?.trialEndsAt,
      credits: workspace?.credits,
    });

    if (workspace) {
      // Contar membros do workspace
      const memberCount = await prisma.workspaceMember.count({
        where: { workspaceId: workspace.id },
      });

      Sentry.setContext('workspace', {
        id: workspace.id,
        name: workspace.name,
        role: workspaceRole,
        createdAt: workspace.createdAt,
        memberCount,
      });
    }

    // Adicionar breadcrumb para tracking
    Sentry.addBreadcrumb({
      category: 'context',
      message: `User context enriched: ${email} (${subscriptionPlan})`,
      level: 'info',
      data: {
        userId: user.id,
        workspaceId: workspace?.id,
        plan: subscriptionPlan,
      },
    });

    console.log(`✅ Sentry context enriched for user ${user.id} (${subscriptionPlan})`);
  } catch (error) {
    console.error('❌ Error enriching Sentry context:', error);
    // Não propagar erro para não quebrar fluxo principal
  }
}

/**
 * Limpa o contexto do Sentry (útil após logout ou fim de operação)
 */
export function clearSentryContext(): void {
  Sentry.setUser(null);
  Sentry.setTags({});
  Sentry.setContext('user', null);
  Sentry.setContext('subscription', null);
  Sentry.setContext('workspace', null);
}

/**
 * Helper para capturar exceção com contexto automático
 */
export async function captureExceptionWithContext(
  error: Error | unknown,
  userId?: string,
  workspaceId?: string,
  additionalContext?: Record<string, any>
): Promise<void> {
  if (userId) {
    await enrichSentryContext(userId, workspaceId);
  }

  if (additionalContext) {
    Sentry.setContext('additional', additionalContext);
  }

  Sentry.captureException(error);
}

/**
 * Middleware para operações do Wasp
 * Adiciona automaticamente contexto do Sentry em todas as operations
 */
export async function withSentryContext<T>(
  context: any,
  operation: () => Promise<T>
): Promise<T> {
  try {
    // Enriquecer contexto se houver usuário autenticado
    if (context.user) {
      const workspaceId = context.user.currentWorkspaceId;
      await enrichSentryContext(context.user.id, workspaceId);
    }

    // Executar operação
    const result = await operation();

    return result;
  } catch (error) {
    // Erro já será capturado com contexto enriquecido
    throw error;
  } finally {
    // Opcional: limpar contexto após operação
    // clearSentryContext();
  }
}
