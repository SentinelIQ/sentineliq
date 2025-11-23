import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Sheet,
  X,
  FileText,
  MessageSquare,
  Flag,
  Shield,
  Activity,
  Database,
  Clock,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from "../../../static/logo.webp";
import { cn } from '../../../../lib/utils';
import SidebarLinkGroup from './SidebarLinkGroup';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  return (
    <aside
      ref={sidebar}
      className={cn(
        'absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-muted border-r duration-300 ease-linear lg:static lg:translate-x-0',
        {
          'translate-x-0': sidebarOpen,
          '-translate-x-full': !sidebarOpen,
        }
      )}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className='flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5'>
        <NavLink to='/'>
          <img src={Logo} alt='Logo' width={50} />
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls='sidebar'
          aria-expanded={sidebarOpen}
          className='block lg:hidden'
        >
          <X />
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className='no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear'>
        {/* <!-- Sidebar Menu --> */}
        <nav className='mt-5 py-4 px-4 lg:mt-9 lg:px-6'>
          {/* <!-- Menu Group --> */}
          <div>
            <h3 className='mb-4 ml-4 text-sm font-semibold text-muted-foreground'>MENU</h3>

            <ul className='mb-6 flex flex-col gap-1.5'>
              {/* <!-- Menu Item Dashboard --> */}
              <NavLink
                to='/admin'
                end
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                    {
                      'bg-accent text-accent-foreground': isActive,
                    }
                  )
                }
              >
                <LayoutDashboard />
                Dashboard
              </NavLink>

              {/* <!-- Menu Item Dashboard --> */}

              {/* <!-- Menu Item Users --> */}
              <li>
                <NavLink
                  to='/admin/users'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Sheet />
                  Users
                </NavLink>
              </li>
              {/* <!-- Menu Item Users --> */}

              {/* <!-- Menu Item Workspaces --> */}
              <li>
                <NavLink
                  to='/admin/workspaces'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Sheet />
                  Workspaces
                </NavLink>
              </li>
              {/* <!-- Menu Item Workspaces --> */}

              {/* <!-- Menu Item Billing --> */}
              <li>
                <NavLink
                  to='/admin/billing'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Sheet />
                  Billing
                </NavLink>
              </li>
              {/* <!-- Menu Item Billing --> */}

              {/* <!-- Menu Item System Logs --> */}
              <li>
                <NavLink
                  to='/admin/logs'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <FileText />
                  System Logs
                </NavLink>
              </li>
              {/* <!-- Menu Item System Logs --> */}

              {/* <!-- Menu Item Audit Logs --> */}
              <li>
                <NavLink
                  to='/admin/audit'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Shield />
                  Audit Logs
                </NavLink>
              </li>
              {/* <!-- Menu Item Audit Logs --> */}

              {/* <!-- Menu Item Messages --> */}
              <li>
                <NavLink
                  to='/admin/messages'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <MessageSquare />
                  Messages
                </NavLink>
              </li>
              {/* <!-- Menu Item Messages --> */}

              {/* <!-- Menu Item Features --> */}
              <li>
                <NavLink
                  to='/admin/features'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Flag />
                  Features
                </NavLink>
              </li>
              {/* <!-- Menu Item Features --> */}
            </ul>

            {/* System Section */}
            <h3 className='mb-4 ml-4 text-sm font-semibold text-muted-foreground mt-8'>SYSTEM</h3>

            <ul className='mb-6 flex flex-col gap-1.5'>
              {/* <!-- Menu Item Jobs --> */}
              <li>
                <NavLink
                  to='/admin/jobs'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Clock />
                  Jobs
                </NavLink>
              </li>
              {/* <!-- Menu Item Jobs --> */}

              {/* <!-- Menu Item Database --> */}
              <li>
                <NavLink
                  to='/admin/database'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Database />
                  Database
                </NavLink>
              </li>
              {/* <!-- Menu Item Database --> */}

              {/* <!-- Menu Item System Health --> */}
              <li>
                <NavLink
                  to='/admin/system-health'
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-muted-foreground duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      }
                    )
                  }
                >
                  <Activity />
                  System Health
                </NavLink>
              </li>
              {/* <!-- Menu Item System Health --> */}
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default Sidebar;
