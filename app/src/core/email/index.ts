/**
 * Email Template Index
 * Central export for all email template functionality
 */

export * from './types';
export * from './baseTemplate';
export * from './renderer';
export * from './service';

// Re-export templates for direct access if needed
export { authTemplates } from './templates/auth';
export { paymentTemplates } from './templates/payment';
export { workspaceTemplates } from './templates/workspace';
export { notificationTemplates } from './templates/notification';
export { systemTemplates } from './templates/system';
