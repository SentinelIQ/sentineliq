/**
 * usePushNotifications Hook
 * Manages Web Push notification subscription lifecycle
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  savePushSubscription, 
  removePushSubscription, 
  getPushSubscriptions,
  removeAllPushSubscriptions 
} from 'wasp/client/operations';
import type { PushSubscription as PushSubscriptionType } from 'wasp/entities';

// Browser support detection
const isPushSupported = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

// Get VAPID public key from environment
const getVapidPublicKey = (): string => {
  // In Wasp, client-side env vars must be prefixed with REACT_APP_
  const key = import.meta.env.REACT_APP_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('VAPID public key not found. Add REACT_APP_VAPID_PUBLIC_KEY to .env.client');
  }
  return key;
};

// Convert base64 VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Get device information for subscription
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  
  // Simple device name detection
  let deviceName = 'Unknown Device';
  if (userAgent.includes('Mobile')) {
    deviceName = 'Mobile Device';
  } else if (userAgent.includes('Tablet')) {
    deviceName = 'Tablet';
  } else {
    deviceName = 'Desktop';
  }
  
  // Try to get more specific info
  if (userAgent.includes('Chrome')) {
    deviceName += ' (Chrome)';
  } else if (userAgent.includes('Firefox')) {
    deviceName += ' (Firefox)';
  } else if (userAgent.includes('Safari')) {
    deviceName += ' (Safari)';
  } else if (userAgent.includes('Edge')) {
    deviceName += ' (Edge)';
  }
  
  return { userAgent, deviceName };
};

export interface UsePushNotificationsResult {
  // State
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptions: PushSubscriptionType[];
  
  // Actions
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: (endpoint?: string) => Promise<boolean>;
  unsubscribeAll: () => Promise<boolean>;
  refreshSubscriptions: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsResult => {
  const [isSupported] = useState(isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionType[]>([]);

  // Load existing subscriptions on mount
  useEffect(() => {
    if (isSupported) {
      refreshSubscriptions();
      checkCurrentSubscription();
    }
  }, [isSupported]);

  // Refresh subscriptions from server
  const refreshSubscriptions = useCallback(async () => {
    try {
      const subs = await getPushSubscriptions();
      setSubscriptions(subs);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  }, []);

  // Check if current browser is subscribed
  const checkCurrentSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setIsSubscribed(false);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        return true;
      } else if (result === 'denied') {
        setError('Notification permission denied. Please enable in browser settings.');
        return false;
      } else {
        setError('Notification permission request dismissed');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMsg);
      console.error('Permission request error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Save subscription to server
      const { userAgent, deviceName } = getDeviceInfo();
      
      await savePushSubscription({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        },
        userAgent,
        deviceName,
      });

      setIsSubscribed(true);
      await refreshSubscriptions();

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
      setError(errorMsg);
      console.error('Subscription error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, refreshSubscriptions]);

  // Unsubscribe from push notifications (specific endpoint or current)
  const unsubscribe = useCallback(
    async (endpoint?: string): Promise<boolean> => {
      if (!isSupported) {
        setError('Push notifications are not supported in this browser');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // If endpoint provided, remove from server only
        if (endpoint) {
          await removePushSubscription({ endpoint });
        } else {
          // Remove current browser subscription
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            await removePushSubscription({ endpoint: subscription.endpoint });
            await subscription.unsubscribe();
          }

          setIsSubscribed(false);
        }

        await refreshSubscriptions();
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to unsubscribe';
        setError(errorMsg);
        console.error('Unsubscribe error:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, refreshSubscriptions]
  );

  // Unsubscribe from all devices
  const unsubscribeAll = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Remove all subscriptions from server
      await removeAllPushSubscriptions();

      // Unsubscribe current browser
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setSubscriptions([]);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unsubscribe from all devices';
      setError(errorMsg);
      console.error('Unsubscribe all error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    // State
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscriptions,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    refreshSubscriptions,
  };
};
