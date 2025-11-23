import { Outlet } from 'react-router-dom';

/**
 * Layout para páginas de autenticação (login, signup, etc)
 * Sem navbar, apenas o conteúdo da página
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
