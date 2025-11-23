/**
 * Plausible Analytics Configuration
 * 
 * Provides complete integration with Plausible Analytics including:
 * - Pageview tracking
 * - Custom event tracking
 * - User properties
 * - Revenue tracking
 */

export interface PlausibleConfig {
  domain: string;
  apiHost?: string;
  trackLocalhost?: boolean;
  enableAutoPageviews?: boolean;
  enableAutoOutboundTracking?: boolean;
}

export interface PlausibleEvent {
  name: string;
  url?: string;
  referrer?: string;
  props?: Record<string, string | number | boolean>;
  revenue?: {
    amount: number;
    currency: string;
  };
}

export const plausibleConfig: PlausibleConfig = {
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'sentineliq.com.br',
  apiHost: import.meta.env.VITE_PLAUSIBLE_API_HOST || 'https://plausible.io',
  trackLocalhost: import.meta.env.DEV === true,
  enableAutoPageviews: true,
  enableAutoOutboundTracking: true,
};

/**
 * Check if Plausible is enabled
 */
export function isPlausibleEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if in development and localhost tracking is disabled
  if (window.location.hostname === 'localhost' && !plausibleConfig.trackLocalhost) {
    return false;
  }
  
  // Check if plausible script is loaded
  return typeof (window as any).plausible === 'function';
}

/**
 * Track a pageview
 */
export function trackPageview(url?: string): void {
  if (!isPlausibleEnabled()) return;
  
  try {
    const plausible = (window as any).plausible;
    plausible('pageview', { 
      u: url || window.location.href,
      r: document.referrer
    });
  } catch (error) {
    console.error('[Plausible] Error tracking pageview:', error);
  }
}

/**
 * Track a custom event
 */
export function trackEvent(event: PlausibleEvent): void {
  if (!isPlausibleEnabled()) return;
  
  try {
    const plausible = (window as any).plausible;
    const options: any = {
      u: event.url || window.location.href,
    };
    
    if (event.referrer) {
      options.r = event.referrer;
    }
    
    if (event.props) {
      options.props = event.props;
    }
    
    if (event.revenue) {
      options.revenue = {
        amount: event.revenue.amount,
        currency: event.revenue.currency,
      };
    }
    
    plausible(event.name, options);
  } catch (error) {
    console.error(`[Plausible] Error tracking event "${event.name}":`, error);
  }
}

/**
 * Predefined event tracking functions for common actions
 */
export const analytics = {
  // Authentication events
  auth: {
    signup: (method: 'email' | 'google') => 
      trackEvent({ name: 'Signup', props: { method } }),
    
    login: (method: 'email' | 'google') => 
      trackEvent({ name: 'Login', props: { method } }),
    
    logout: () => 
      trackEvent({ name: 'Logout' }),
    
    enable2FA: () => 
      trackEvent({ name: 'Enable 2FA' }),
    
    disable2FA: () => 
      trackEvent({ name: 'Disable 2FA' }),
  },
  
  // Workspace events
  workspace: {
    create: (plan: string) => 
      trackEvent({ name: 'Workspace Created', props: { plan } }),
    
    switch: () => 
      trackEvent({ name: 'Workspace Switched' }),
    
    update: (field: string) => 
      trackEvent({ name: 'Workspace Updated', props: { field } }),
    
    delete: () => 
      trackEvent({ name: 'Workspace Deleted' }),
    
    inviteMember: (role: string) => 
      trackEvent({ name: 'Member Invited', props: { role } }),
    
    removeMember: () => 
      trackEvent({ name: 'Member Removed' }),
    
    transferOwnership: () => 
      trackEvent({ name: 'Ownership Transferred' }),
    
    updateBranding: () => 
      trackEvent({ name: 'Branding Updated' }),
    
    exportData: () => 
      trackEvent({ name: 'Data Exported' }),
  },
  
  // Payment events
  payment: {
    checkoutStarted: (plan: string, amount: number) => 
      trackEvent({ 
        name: 'Checkout Started', 
        props: { plan },
        revenue: { amount, currency: 'BRL' }
      }),
    
    checkoutCompleted: (plan: string, amount: number) => 
      trackEvent({ 
        name: 'Checkout Completed', 
        props: { plan },
        revenue: { amount, currency: 'BRL' }
      }),
    
    subscriptionCancelled: (plan: string) => 
      trackEvent({ name: 'Subscription Cancelled', props: { plan } }),
    
    subscriptionReactivated: (plan: string) => 
      trackEvent({ name: 'Subscription Reactivated', props: { plan } }),
    
    trialStarted: () => 
      trackEvent({ name: 'Trial Started' }),
    
    trialConverted: (plan: string) => 
      trackEvent({ name: 'Trial Converted', props: { plan } }),
  },
  
  // Feature usage events
  feature: {
    notificationRead: () => 
      trackEvent({ name: 'Notification Read' }),
    
    notificationDeleted: () => 
      trackEvent({ name: 'Notification Deleted' }),
    
    fileUploaded: (fileType: string, size: number) => 
      trackEvent({ name: 'File Uploaded', props: { fileType, size } }),
    
    searchPerformed: (query: string) => 
      trackEvent({ name: 'Search Performed', props: { query: query.substring(0, 50) } }),
    
    filterApplied: (filterType: string) => 
      trackEvent({ name: 'Filter Applied', props: { filterType } }),
  },
  
  // Aegis module events (when implemented)
  aegis: {
    alertCreated: (severity: string) => 
      trackEvent({ name: 'Alert Created', props: { severity } }),
    
    incidentCreated: (severity: string) => 
      trackEvent({ name: 'Incident Created', props: { severity } }),
    
    caseCreated: () => 
      trackEvent({ name: 'Case Created' }),
    
    alertResolved: (duration: number) => 
      trackEvent({ name: 'Alert Resolved', props: { duration } }),
    
    incidentResolved: (duration: number) => 
      trackEvent({ name: 'Incident Resolved', props: { duration } }),
  },
  
  // Error tracking
  error: {
    apiError: (endpoint: string, statusCode: number) => 
      trackEvent({ name: 'API Error', props: { endpoint, statusCode } }),
    
    validationError: (field: string) => 
      trackEvent({ name: 'Validation Error', props: { field } }),
    
    pageNotFound: () => 
      trackEvent({ name: '404 Not Found' }),
  },
};
