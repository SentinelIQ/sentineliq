import { enrichSentryContext, clearSentryContext } from './sentryContext';
import * as Sentry from '@sentry/node';

/**
 * Middleware Wasp para adicionar automaticamente contexto do Sentry
 * em todas as operações (queries e actions)
 * 
 * Uso: Envolver operations que precisam de contexto enriquecido
 */
export async function withSentryMiddleware<TInput, TOutput>(
  args: TInput,
  context: any,
  operation: (args: TInput, context: any) => Promise<TOutput>
): Promise<TOutput> {
  const startTime = Date.now();
  
  try {
    // 1. Enriquecer contexto se houver usuário autenticado
    if (context.user) {
      await enrichSentryContext(context.user.id, context.user.currentWorkspaceId);
      
      // Adicionar breadcrumb da operação
      Sentry.addBreadcrumb({
        category: 'operation',
        message: `Operation started by ${context.user.username || context.user.id}`,
        level: 'info',
        data: {
          userId: context.user.id,
          workspaceId: context.user.currentWorkspaceId,
        },
      });
    }

    // 2. Executar operação
    const result = await operation(args, context);

    // 3. Log de sucesso
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      // Alertar operações lentas
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow operation completed: ${duration}ms`,
        level: 'warning',
        data: { duration },
      });
    }

    return result;
  } catch (error) {
    // 4. Capturar erro com contexto completo
    const duration = Date.now() - startTime;
    
    Sentry.setContext('error_details', {
      duration,
      operationArgs: JSON.stringify(args),
      timestamp: new Date().toISOString(),
    });

    // Erro já será enviado ao Sentry automaticamente
    // mas vamos adicionar mais contexto
    Sentry.addBreadcrumb({
      category: 'error',
      message: 'Operation failed',
      level: 'error',
      data: {
        error: error instanceof Error ? error.message : String(error),
        duration,
      },
    });

    throw error;
  } finally {
    // 5. Limpar contexto (opcional - manter comentado para preservar contexto entre operations)
    // clearSentryContext();
  }
}

/**
 * HOF (Higher-Order Function) para wrappear operations facilmente
 */
export function withSentry<TInput, TOutput>(
  operation: (args: TInput, context: any) => Promise<TOutput>
) {
  return async (args: TInput, context: any): Promise<TOutput> => {
    return withSentryMiddleware(args, context, operation);
  };
}
