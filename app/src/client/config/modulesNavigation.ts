import { 
  Shield, 
  AlertTriangle, 
  FolderOpen, 
  LayoutDashboard,
  Eye,
  ShieldAlert,
  Zap,
  AlertCircle,
  LucideIcon 
} from 'lucide-react';

export interface ModuleSubItem {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  color: string;
  description?: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  color: string;
  description: string;
  subItems?: ModuleSubItem[];
}

export const modulesNavigation: ModuleConfig[] = [
  {
    id: 'overview',
    name: 'Visão Geral',
    icon: LayoutDashboard,
    href: '/modules',
    color: 'text-primary',
    description: 'Visão geral de todos os módulos',
  },
  {
    id: 'monitoring',
    name: 'Monitoramento',
    icon: Eye,
    href: '/modules/monitoring/dashboard',
    color: 'text-blue-500',
    description: 'Monitore métricas em tempo real',
  },
  {
    id: 'aegis',
    name: 'Aegis',
    icon: Shield,
    href: '/modules/aegis/dashboard',
    color: 'text-red-500',
    description: 'Gestão de Incidentes de Segurança',
    subItems: [
      {
        id: 'alerts',
        name: 'Alertas',
        icon: AlertTriangle,
        href: '/modules/aegis/alerts',
        color: 'text-yellow-500',
        description: 'Gerencie alertas de segurança',
      },
      {
        id: 'incidents',
        name: 'Incidentes',
        icon: Shield,
        href: '/modules/aegis/incidents',
        color: 'text-red-500',
        description: 'Gerencie incidentes ativos',
      },
      {
        id: 'cases',
        name: 'Casos',
        icon: FolderOpen,
        href: '/modules/aegis/cases',
        color: 'text-blue-500',
        description: 'Gerencie casos de investigação',
      },
    ],
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    icon: ShieldAlert,
    href: '/modules/eclipse/dashboard',
    color: 'text-purple-500',
    description: 'Proteção de Marca & Propriedade Intelectual',
    subItems: [
      {
        id: 'brands',
        name: 'Marcas',
        icon: ShieldAlert,
        href: '/modules/eclipse/brands',
        color: 'text-purple-500',
        description: 'Gerencie suas marcas registradas',
      },
      {
        id: 'monitoring',
        name: 'Monitoramento',
        icon: Eye,
        href: '/modules/eclipse/monitoring',
        color: 'text-blue-500',
        description: 'Rastreie violações de marca',
      },
      {
        id: 'detections',
        name: 'Detecções',
        icon: AlertTriangle,
        href: '/modules/eclipse/detections',
        color: 'text-orange-500',
        description: 'Detecções de possíveis violações',
      },
      {
        id: 'infringements',
        name: 'Infrações',
        icon: AlertCircle,
        href: '/modules/eclipse/infringements',
        color: 'text-red-500',
        description: 'Gerencie infrações detectadas',
      },
      {
        id: 'actions',
        name: 'Ações',
        icon: Zap,
        href: '/modules/eclipse/actions',
        color: 'text-yellow-500',
        description: 'Plano de ação contra violações',
      },
    ],
  },
];

// Helper para verificar se uma rota está ativa
export const isModuleActive = (pathname: string, href: string): boolean => {
  return pathname === href || pathname.startsWith(href + '/');
};

// Helper para pegar o módulo ativo baseado na rota
export const getActiveModule = (pathname: string): ModuleConfig | undefined => {
  return modulesNavigation.find(module => {
    if (isModuleActive(pathname, module.href)) return true;
    return module.subItems?.some(sub => isModuleActive(pathname, sub.href));
  });
};
