import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar/NavBar';
import { marketingNavigationItems } from '../components/NavBar/constants';

/**
 * Layout base para todas as páginas públicas (marketing)
 * Inclui a navbar pública com largura completa
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar navigationItems={marketingNavigationItems} />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
