import { Building2, LayoutDashboard, Menu, Settings, Users, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'wasp/client/auth';
import { useQuery, getCurrentWorkspace } from 'wasp/client/operations';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { cn } from '../../../lib/utils';
import { UserDropdown } from '../../pages/user/UserDropdown';
import { NotificationBell } from '../notifications/NotificationBell';
import logo from '../../static/logo.webp';
import DarkModeSwitcher from '../DarkModeSwitcher';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { modulesNavigation } from '../../config/modulesNavigation';

interface NavigationItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

export default function PlatformNavBar() {
  const { t } = useTranslation(['common', 'dashboard']);
  const { data: user } = useAuth();
  const { data: workspace } = useQuery(getCurrentWorkspace);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const platformNavigationItems: NavigationItem[] = [
    {
      name: t('common:navigation.dashboard'),
      to: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Módulos',
      to: '/modules',
      icon: Building2,
    },
    {
      name: t('common:navigation.settings'),
      to: '/workspace/settings',
      icon: Settings,
    },
    {
      name: 'Team',
      to: '/workspace/members',
      icon: Users,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <nav className='flex h-16 items-center px-8 w-full'>
        {/* Logo and Workspace Info */}
        <div className='flex items-center gap-4 flex-1'>
          <Link to='/dashboard' className='flex items-center gap-2'>
            <img className='size-8' src={logo} alt='SentinelIQ' />
            <span className='font-semibold text-lg hidden sm:inline-block'>SentinelIQ</span>
          </Link>
          
          {workspace && (
            <div className='hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted'>
              <Building2 className='size-4 text-muted-foreground' />
              <span className='text-sm font-medium'>{workspace.name}</span>
              <Badge variant='secondary' className='text-xs'>
                {workspace.userRole}
              </Badge>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className='hidden lg:flex items-center gap-6 flex-1 justify-center'>
          {platformNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            // Módulos com dropdown
            if (item.name === 'Módulos') {
              return (
                <DropdownMenu key={item.to}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className='size-4' />
                      {item.name}
                      <ChevronDown className='size-3' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='center' className='w-56'>
                    <DropdownMenuLabel>{t('common:navigation.dashboard')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {modulesNavigation.map((module, index) => {
                      const ModuleIcon = module.icon;
                      const isFirstModule = index === 0;
                      const hasSubItems = module.subItems && module.subItems.length > 0;

                      return (
                        <div key={module.id}>
                          {!isFirstModule && <DropdownMenuSeparator />}
                          {!isFirstModule && module.description && (
                            <DropdownMenuLabel className='text-xs text-muted-foreground'>
                              {module.name} - {module.description}
                            </DropdownMenuLabel>
                          )}
                          
                          <Link to={module.href}>
                            <DropdownMenuItem className='cursor-pointer'>
                              <ModuleIcon className={cn('size-4 mr-2', module.color)} />
                              {isFirstModule ? module.name : `Dashboard ${module.name}`}
                            </DropdownMenuItem>
                          </Link>

                          {hasSubItems && module.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <Link key={subItem.id} to={subItem.href}>
                                <DropdownMenuItem className='cursor-pointer pl-6'>
                                  <SubIcon className={cn('size-4 mr-2', subItem.color)} />
                                  {subItem.name}
                                </DropdownMenuItem>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className='size-4' />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className='flex items-center gap-3 flex-1 justify-end'>
          <LanguageSwitcher />
          <DarkModeSwitcher />
          
          {/* Notification Bell */}
          {user && <NotificationBell />}
          
          {/* Workspace Switcher */}
          <Link to='/workspaces'>
            <Button variant='outline' size='sm' className='hidden sm:flex items-center gap-2'>
              <Building2 className='size-4' />
              {t('dashboard:quickActions.createWorkspace')}
            </Button>
          </Link>

          {/* User Dropdown */}
          {user && <UserDropdown user={user} />}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className='lg:hidden'>
              <Button variant='ghost' size='icon'>
                <Menu className='size-5' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[300px]'>
              <SheetHeader>
                <SheetTitle className='flex items-center gap-2'>
                  <img className='size-6' src={logo} alt='SentinelIQ' />
                  SentinelIQ
                </SheetTitle>
              </SheetHeader>
              
              {/* Workspace Info Mobile */}
              {workspace && (
                <div className='mt-4 p-3 rounded-lg bg-muted'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Building2 className='size-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>{workspace.name}</span>
                  </div>
                  <Badge variant='secondary' className='text-xs'>
                    {workspace.userRole}
                  </Badge>
                </div>
              )}

              {/* Mobile Navigation */}
              <div className='mt-6 space-y-2'>
                {platformNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  
                  // Módulos com submenu expandido
                  if (item.name === 'Módulos') {
                    return (
                      <div key={item.to} className='space-y-1'>
                        <div
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <Icon className='size-4' />
                          {item.name}
                        </div>
                        
                        {/* Submenu dinâmico */}
                        <div className='ml-4 space-y-1 pl-3 border-l-2 border-border'>
                          {modulesNavigation.map((module) => {
                            const ModuleIcon = module.icon;
                            const hasSubItems = module.subItems && module.subItems.length > 0;

                            return (
                              <div key={module.id} className='space-y-1'>
                                <Link
                                  to={module.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                                >
                                  <ModuleIcon className={cn('size-3', module.color)} />
                                  {module.name}
                                </Link>

                                {hasSubItems && module.subItems?.map((subItem) => {
                                  const SubIcon = subItem.icon;
                                  return (
                                    <Link
                                      key={subItem.id}
                                      to={subItem.href}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className='flex items-center gap-2 px-3 py-1.5 ml-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                                    >
                                      <SubIcon className={cn('size-3', subItem.color)} />
                                      {subItem.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className='size-4' />
                      {item.name}
                    </Link>
                  );
                })}
                
                <Link
                  to='/workspaces'
                  onClick={() => setMobileMenuOpen(false)}
                  className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                >
                  <Building2 className='size-4' />
                  {t('dashboard:quickActions.createWorkspace')}
                </Link>
              </div>
              
              {/* Language and Theme Switchers */}
              <div className='mt-6 pt-6 border-t border-border'>
                <div className='flex items-center justify-between px-3'>
                  <span className='text-sm font-medium text-muted-foreground'>{t('common:navigation.settings')}</span>
                  <div className='flex items-center gap-2'>
                    <LanguageSwitcher />
                    <DarkModeSwitcher />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
