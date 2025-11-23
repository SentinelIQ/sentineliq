import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';

// Rotas que não requerem workspace ou onboarding completo
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/request-password-reset',
  '/password-reset',
  '/email-verification',
  '/', // Landing page
  '/pricing',
];

const ONBOARDING_ROUTES = ['/onboarding'];
const WORKSPACE_SELECTOR_ROUTES = ['/workspaces', '/workspace/create'];
const ADMIN_ROUTES = ['/admin'];

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Aguardar carregamento do usuário
    if (isLoading) return;
    
    // Se não está autenticado, deixar o AuthRequired do Wasp lidar
    if (!user) return;
    
    const currentPath = location.pathname;
    
    // Não aplicar guard em rotas públicas
    if (PUBLIC_ROUTES.some(route => currentPath === route || currentPath.startsWith(route))) {
      return;
    }
    
    // Admin sempre tem acesso a rotas admin
    if (user.isAdmin && ADMIN_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }
    
    // 1. Se não completou onboarding, sempre ir para onboarding
    if (!user.hasCompletedOnboarding) {
      if (!ONBOARDING_ROUTES.some(route => currentPath.startsWith(route))) {
        console.log('Redirecting to onboarding: user has not completed onboarding');
        navigate('/onboarding', { replace: true });
      }
      return;
    }
    
    // 2. Se completou onboarding mas não tem workspace selecionado
    if (user.hasCompletedOnboarding && !user.currentWorkspaceId) {
      if (!WORKSPACE_SELECTOR_ROUTES.some(route => currentPath.startsWith(route))) {
        console.log('Redirecting to workspace selector: no active workspace');
        navigate('/workspaces', { replace: true });
      }
      return;
    }
    
    // 3. Se tem workspace mas está em onboarding, redirecionar para dashboard
    if (user.hasCompletedOnboarding && user.currentWorkspaceId) {
      if (ONBOARDING_ROUTES.some(route => currentPath.startsWith(route))) {
        console.log('Redirecting to dashboard: already has workspace');
        navigate('/dashboard', { replace: true });
      }
      return;
    }
    
    // ✅ 4. Validate workspace still exists and is active (avoid redirect loops)
    // This prevents users from being stuck if their workspace was deleted
    if (user.currentWorkspaceId && !WORKSPACE_SELECTOR_ROUTES.some(route => currentPath.startsWith(route))) {
      // Note: This check would require a query to verify workspace.isActive
      // For now, we rely on operations throwing 403 errors if workspace is inactive
      // A future improvement could cache workspace state in the auth context
    }
  }, [user, isLoading, navigate, location]);
  
  return <>{children}</>;
}
