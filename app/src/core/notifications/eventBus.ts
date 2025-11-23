import type { WorkspaceEvent } from './types';
import { createLogger } from '../logs/logger';

type EventHandler = (event: WorkspaceEvent) => Promise<void>;

class NotificationEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private _logger: any = null;

  private get logger() {
    if (!this._logger) {
      this._logger = createLogger('notification-bus');
    }
    return this._logger;
  }

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
    this.logger.debug(`Emitting notification event: ${event.eventType}`, {
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
        this.logger.error(`Notification handler failed for ${event.eventType}`, {
          error: result.reason,
          handlerIndex: index,
        });
      }
    });
  }
}

// Singleton instance
export const notificationEventBus = new NotificationEventBus();

// Register notification handler on initialization
// Note: This is handled by the notifier module itself to avoid circular dependencies
