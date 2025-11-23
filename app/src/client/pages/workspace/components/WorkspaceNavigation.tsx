import { Link, useLocation } from 'react-router-dom';
import { useQuery, getCurrentWorkspace } from 'wasp/client/operations';
import { cn } from '../../../../lib/utils';
import { 
  Home, 
  Users, 
  Settings, 
  Building2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { modulesNavigation, isModuleActive } from '../../../config/modulesNavigation';
import { useState } from 'react';

interface WorkspaceNavigationProps {
  className?: string;
}

export function WorkspaceNavigation({ className }: WorkspaceNavigationProps) {
  const location = useLocation();
  const { data: workspace } = useQuery(getCurrentWorkspace);
  const [modulesExpanded, setModulesExpanded] = useState(true);

  if (!workspace) {
    return null;
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['OWNER', 'ADMIN', 'MEMBER'],
    },
    {
      title: 'Team Members',
      href: '/workspace/members',
      icon: Users,
      roles: ['OWNER', 'ADMIN', 'MEMBER'],
    },
    {
      title: 'Settings',
      href: '/workspace/settings',
      icon: Settings,
      roles: ['OWNER', 'ADMIN'],
    },
    {
      title: 'Switch Workspace',
      href: '/workspaces',
      icon: Building2,
      roles: ['OWNER', 'ADMIN', 'MEMBER'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(workspace.userRole)
  );

  // Verifica se algum módulo está ativo
  const isInModules = location.pathname.startsWith('/modules');

  return (
    <nav className={cn('space-y-1', className)}>
      {/* Workspace Info */}
      <div className="px-3 py-2 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Current Workspace</span>
          <Badge variant="outline" className="text-xs">
            {workspace.userRole}
          </Badge>
        </div>
        <h3 className="font-semibold truncate">{workspace.name}</h3>
        {workspace.description && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {workspace.description}
          </p>
        )}
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5" />
                <span>{item.title}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}

        {/* Módulos Section */}
        <div className="pt-2">
          <button
            onClick={() => setModulesExpanded(!modulesExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isInModules
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5" />
              <span>Módulos</span>
            </div>
            {modulesExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Módulos Submenu */}
          {modulesExpanded && (
            <div className="ml-3 mt-1 space-y-1 border-l-2 border-border pl-3">
              {modulesNavigation.map((module) => {
                const ModuleIcon = module.icon;
                const moduleActive = isModuleActive(location.pathname, module.href);

                return (
                  <div key={module.id}>
                    <Link
                      to={module.href}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        moduleActive
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <ModuleIcon className={cn('w-4 h-4', module.color)} />
                        <span>{module.name}</span>
                      </div>
                    </Link>

                    {/* SubItems (Submódulos) */}
                    {module.subItems && moduleActive && (
                      <div className="ml-3 mt-1 space-y-1">
                        {module.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = isModuleActive(location.pathname, subItem.href);

                          return (
                            <Link
                              key={subItem.id}
                              to={subItem.href}
                              className={cn(
                                'flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                                subActive
                                  ? 'bg-muted text-foreground'
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              )}
                            >
                              <SubIcon className={cn('w-3 h-3 mr-2', subItem.color)} />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
