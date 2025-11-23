import { Outlet } from 'react-router-dom';
import PlatformNavBar from '../components/PlatformNavBar/PlatformNavBar';

/**
 * Layout base para todas as páginas internas da plataforma
 * Inclui a navbar da plataforma com contexto de workspace
 */
export default function PlatformLayout() {
  return (
    <div className="min-h-screen bg-background">
      <PlatformNavBar />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
