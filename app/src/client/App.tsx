import { useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import './Main.css';
import './i18n/config';
import CookieConsentBanner from './components/cookie-consent/Banner';
import { WorkspaceGuard } from './components/WorkspaceGuard';
import PublicLayout from './layouts/PublicLayout';
import PlatformLayout from './layouts/PlatformLayout';
import AuthLayout from './layouts/AuthLayout';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePlausiblePageviews } from './hooks/usePlausible';
import { GlobalConfirmDialog } from './components/GlobalConfirmDialog';

// Inicializa Sentry para monitoramento de erros no frontend
Sentry.init({
  dsn: import.meta.env.REACT_APP_SENTRY_DSN_CLIENT || 'https://ee87769a7805b8e1b30be5949f25d9b3@o4509301234204672.ingest.de.sentry.io/4510378439409744',
  environment: import.meta.env.NODE_ENV || 'development',
  
  // Performance Monitoring
  tracesSampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% das sessões
  replaysOnErrorSampleRate: 1.0, // 100% quando há erro
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filtrar informações sensíveis
  beforeSend(event, hint) {
    // Remove informações sensíveis
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }
    return event;
  },
});

/**
 * Root App component que determina qual layout usar baseado na rota
 * - PublicLayout: páginas de marketing (/, /pricing)
 * - AuthLayout: páginas de autenticação (login, signup, etc)
 * - PlatformLayout: páginas internas da plataforma (dashboard, workspace, etc)
 * - Admin: layout próprio (sem wrapper)
 */
export default function App() {
  const location = useLocation();
  
  // Track pageviews with Plausible Analytics
  usePlausiblePageviews();

  // Determinar o tipo de layout baseado na rota
  const layoutType = useMemo(() => {
    const path = location.pathname;

    // Admin tem layout próprio
    if (path.startsWith('/admin')) {
      return 'admin';
    }

    // Rotas de autenticação (sem navbar)
    if (path === '/login' || 
        path === '/signup' || 
        path === '/onboarding' ||
        path.startsWith('/request-password-reset') ||
        path.startsWith('/password-reset') ||
        path.startsWith('/email-verification')) {
      return 'auth';
    }

    // Rotas públicas (marketing)
    if (path === '/' || path === '/pricing') {
      return 'public';
    }

    // Todas as outras rotas autenticadas usam o layout da plataforma
    return 'platform';
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <ErrorBoundary>
      <WorkspaceGuard>
        <div className='min-h-screen bg-background text-foreground'>
          {layoutType === 'admin' && <Outlet />}
          {layoutType === 'auth' && <AuthLayout />}
          {layoutType === 'public' && <PublicLayout />}
          {layoutType === 'platform' && <PlatformLayout />}
        </div>
        <CookieConsentBanner />
        <Toaster />
        <GlobalConfirmDialog />
      </WorkspaceGuard>
    </ErrorBoundary>
  );
}
