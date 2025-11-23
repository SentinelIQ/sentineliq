import { ReactNode } from 'react';
import { WorkspaceNavigation } from './components/WorkspaceNavigation';
import { Separator } from '../../components/ui/separator';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-muted/10">
        <div className="flex flex-col w-full p-4">
          <WorkspaceNavigation />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
