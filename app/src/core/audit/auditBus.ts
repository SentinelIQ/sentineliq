import type { WorkspaceEvent } from './types';
import { createLogger } from '../logs/logger';
import { registerAuditHandler } from './auditor';

const logger = createLogger('audit-bus');

type EventHandler = (event: WorkspaceEvent) => Promise<void>;

class WorkspaceEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register a handler for specific event types
   */
  on(eventType: string, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Register a handler for all events
   */
  onAny(handler: EventHandler) {
    this.on('*', handler);
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: WorkspaceEvent) {
    logger.debug(`Emitting event: ${event.eventType}`, {
      workspaceId: event.workspaceId,
      userId: event.userId,
    });

    // Get handlers for this specific event type
    const specificHandlers = this.handlers.get(event.eventType) || [];
    
    // Get handlers for all events
    const globalHandlers = this.handlers.get('*') || [];
    
    // Combine all handlers
    const allHandlers = [...specificHandlers, ...globalHandlers];

    // Execute all handlers in parallel
    const results = await Promise.allSettled(
      allHandlers.map(handler => handler(event))
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Event handler failed for ${event.eventType}`, {
          error: result.reason,
          handlerIndex: index,
        });
      }
    });
  }
}

// Singleton instance
export const workspaceEventBus = new WorkspaceEventBus();

// Register audit handler on module load
registerAuditHandler(workspaceEventBus);
