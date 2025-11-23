/**
 * React Hook for Plausible Analytics
 * 
 * Provides easy access to Plausible tracking functions in React components
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview, trackEvent, analytics, PlausibleEvent } from '../../core/analytics/plausibleConfig';

/**
 * Hook to track pageviews automatically on route changes
 */
export function usePlausiblePageviews() {
  const location = useLocation();

  useEffect(() => {
    trackPageview();
  }, [location.pathname, location.search]);
}

/**
 * Hook to get analytics tracking functions
 */
export function usePlausible() {
  const trackCustomEvent = useCallback((event: PlausibleEvent) => {
    trackEvent(event);
  }, []);

  return {
    trackEvent: trackCustomEvent,
    analytics,
  };
}
