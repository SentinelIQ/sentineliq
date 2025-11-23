import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from 'wasp/client/auth';

/**
 * Real-time updates hook using polling strategy
 * 
 * Note: This is a polling-based implementation as WebSocket infrastructure
 * is not yet set up in Wasp. For true real-time updates, this should be
 * replaced with WebSocket subscriptions when available.
 * 
 * Usage:
 * const { subscribe, unsubscribe } = useRealtimeUpdates();
 * 
 * useEffect(() => {
 *   const unsub = subscribe('alerts', () => refetchAlerts());
 *   return unsub;
 * }, [refetchAlerts]);
 */

type EventType = 
  | 'alerts'
  | 'incidents' 
  | 'cases'
  | 'detections'
  | 'observables'
  | 'tasks';

type Callback = () => void;

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds

export const useRealtimeUpdates = (pollInterval: number = DEFAULT_POLL_INTERVAL) => {
  const { data: user } = useAuth();
  const subscriptionsRef = useRef<Map<EventType, Set<Callback>>>(new Map());
  const intervalsRef = useRef<Map<EventType, NodeJS.Timeout>>(new Map());

  const subscribe = useCallback((eventType: EventType, callback: Callback) => {
    // Get or create subscription set for this event type
    if (!subscriptionsRef.current.has(eventType)) {
      subscriptionsRef.current.set(eventType, new Set());
    }
    
    const callbacks = subscriptionsRef.current.get(eventType)!;
    callbacks.add(callback);

    // Start polling if this is the first subscription for this event type
    if (callbacks.size === 1 && !intervalsRef.current.has(eventType)) {
      const interval = setInterval(() => {
        // Call all callbacks for this event type
        callbacks.forEach(cb => cb());
      }, pollInterval);
      
      intervalsRef.current.set(eventType, interval);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = subscriptionsRef.current.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        
        // Stop polling if no more subscriptions
        if (callbacks.size === 0) {
          const interval = intervalsRef.current.get(eventType);
          if (interval) {
            clearInterval(interval);
            intervalsRef.current.delete(eventType);
          }
          subscriptionsRef.current.delete(eventType);
        }
      }
    };
  }, [pollInterval]);

  const unsubscribe = useCallback((eventType: EventType, callback: Callback) => {
    const callbacks = subscriptionsRef.current.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        const interval = intervalsRef.current.get(eventType);
        if (interval) {
          clearInterval(interval);
          intervalsRef.current.delete(eventType);
        }
        subscriptionsRef.current.delete(eventType);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
      subscriptionsRef.current.clear();
    };
  }, []);

  return { subscribe, unsubscribe };
};

/**
 * Hook for subscribing to specific event updates
 * 
 * Usage:
 * useRealtimeSubscription('alerts', refetchAlerts);
 */
export const useRealtimeSubscription = (
  eventType: EventType,
  callback: Callback,
  pollInterval?: number
) => {
  const { subscribe } = useRealtimeUpdates(pollInterval);

  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return unsubscribe;
  }, [eventType, callback, subscribe]);
};
