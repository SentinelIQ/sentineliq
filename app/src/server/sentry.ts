import * as Sentry from '@sentry/node';
import type { Server as HTTPServer } from 'http';
import { setupWebSocket } from './websocketSetup';
import { initializeSecurity } from './security';
import { initializeSessionTimeout } from './sessionTimeout';
import elkLogger from './elkLogger';

/**
 * Setup function chamado pelo Wasp na inicialização do servidor
 */
export async function serverSetup(context: { app: any; server: HTTPServer }) {
  // Initialize security middleware FIRST (before any other middleware)
  initializeSecurity(context.app);
  
  // Initialize session timeout middleware
  initializeSessionTimeout(context.app);
  
  // Then initialize monitoring
  initializeSentry();
  
  // Setup graceful shutdown
  setupGracefulShutdown();
  
  // Finally setup WebSocket
  setupWebSocket(context.server);
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  const shutdownHandler = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
}



/**
 * Inicializa Sentry para monitoramento de erros no backend
 * DSN configurado via variável de ambiente SENTRY_DSN_SERVER
 */
function initializeSentry() {
  const sentryDsn = process.env.SENTRY_DSN_SERVER;
  
  if (!sentryDsn) {
    console.warn('⚠️ SENTRY_DSN_SERVER não configurado - monitoramento de erros desabilitado');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% em produção, 100% em dev
    
    // Filtrar informações sensíveis
    beforeSend(event, hint) {
      // Remove informações sensíveis de URLs e headers
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
      }
      return event;
    },
  });

  console.log('✅ Sentry inicializado para backend');
}

/**
 * Captura exceção no Sentry com contexto adicional
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Captura mensagem no Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureMessage(message, level);
}

/**
 * Define usuário no contexto do Sentry
 */
export function setSentryUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
  });
}

/**
 * Limpa contexto do usuário no Sentry
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}
