import { LOG_LEVEL_COLORS, RESET_COLOR, LOG_LEVELS } from './levels';
import type { LogLevelType } from './levels';
import { prisma } from 'wasp/server';
import { captureException, captureMessage } from '../../server/sentry';
import { captureExceptionWithContext } from '../../server/sentryContext';
import { sendToELK } from '../../server/elkLogger';

class Logger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  private async log(level: LogLevelType, message: string, metadata?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const color = LOG_LEVEL_COLORS[level] || '';
    
    // Console log with colors
    console.log(
      `${color}[${timestamp}] [${level}] [${this.component}]${RESET_COLOR} ${message}`,
      metadata ? JSON.stringify(metadata, null, 2) : ''
    );

    // Send to ELK Stack (Elasticsearch via Logstash)
    try {
      sendToELK(level, this.component, message, metadata);
    } catch (elkError) {
      console.error('Failed to send log to ELK:', elkError);
    }

    // Enviar para Sentry baseado no nível de severidade
    try {
      if (level === 'CRITICAL' || level === 'ERROR') {
        // Extrair userId e workspaceId do metadata se disponível
        const userId = metadata?.userId || metadata?.user?.id;
        const workspaceId = metadata?.workspaceId || metadata?.workspace?.id;
        
        const context = {
          component: this.component,
          level,
          timestamp,
          ...metadata,
        };
        
        // Se há um erro real no metadata, captura como exceção COM CONTEXTO
        if (metadata?.error instanceof Error) {
          await captureExceptionWithContext(metadata.error, userId, workspaceId, context);
        } else {
          // Senão, captura como mensagem de erro
          captureMessage(message, 'error', context);
        }
      } else if (level === 'WARN') {
        // Warnings vão como mensagens de warning no Sentry
        captureMessage(message, 'warning', {
          component: this.component,
          ...metadata,
        });
      }
    } catch (sentryError) {
      console.error('Failed to send log to Sentry:', sentryError);
    }

    // Store in database (async, non-blocking)
    try {
      await prisma.systemLog.create({
        data: {
          level,
          message,
          component: this.component,
          metadata: metadata || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to save log to database:', error);
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    return this.log('DEBUG', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    return this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    return this.log('WARN', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    return this.log('ERROR', message, metadata);
  }

  critical(message: string, metadata?: Record<string, any>) {
    return this.log('CRITICAL', message, metadata);
  }
}

// Factory function to create component-specific loggers
export function createLogger(component: string): Logger {
  return new Logger(component);
}

// Default logger
export const logger = createLogger('system');
