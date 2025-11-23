import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import { commonEN, commonPT } from './locales/common';
import { authEN, authPT } from './locales/auth';
import { dashboardEN, dashboardPT } from './locales/dashboard';
import { billingEN, billingPT } from './locales/billing';
import { analyticsEN, analyticsPT } from './locales/analytics';
import { adminEN, adminPT } from './locales/admin';
import { workspaceEN, workspacePT } from './locales/workspace';
import { auditEN, auditPT } from './locales/audit';
import { aegisEN, aegisPT } from './locales/aegis';
import { eclipseEN, eclipsePT } from './locales/eclipse';

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    dashboard: dashboardEN,
    billing: billingEN,
    analytics: analyticsEN,
    admin: adminEN,
    workspace: workspaceEN,
    audit: auditEN,
    aegis: aegisEN,
    eclipse: eclipseEN,
  },
  pt: {
    common: commonPT,
    auth: authPT,
    dashboard: dashboardPT,
    billing: billingPT,
    analytics: analyticsPT,
    admin: adminPT,
    workspace: workspacePT,
    audit: auditPT,
    aegis: aegisPT,
    eclipse: eclipsePT,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'billing', 'analytics', 'admin', 'workspace', 'audit', 'aegis', 'eclipse'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
