import 'i18next';
import { commonEN } from './locales/common';
import { authEN } from './locales/auth';
import { dashboardEN } from './locales/dashboard';
import { billingEN } from './locales/billing';
import { analyticsEN } from './locales/analytics';
import { adminEN } from './locales/admin';
import { workspaceEN } from './locales/workspace';
import { auditEN } from './locales/audit';
import { aegisEN } from './locales/aegis';
import { eclipseEN } from './locales/eclipse';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonEN;
      auth: typeof authEN;
      dashboard: typeof dashboardEN;
      billing: typeof billingEN;
      analytics: typeof analyticsEN;
      admin: typeof adminEN;
      workspace: typeof workspaceEN;
      audit: typeof auditEN;
      aegis: typeof aegisEN;
      eclipse: typeof eclipseEN;
    };
  }
}

declare module '*.json' {
  const value: any;
  export default value;
}
