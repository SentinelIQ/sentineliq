import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { WorkspaceLayout } from '../workspace/WorkspaceLayout';
import { 
  Shield, 
  Users, 
  ShieldAlert,
} from 'lucide-react';

const modules = [
  {
    id: 'aegis',
    name: 'Aegis - Gestão de Incidentes',
    description: 'Gerencie alertas, incidentes e casos de segurança',
    icon: Shield,
    href: '/modules/aegis/dashboard',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    id: 'eclipse',
    name: 'Eclipse - Proteção de Marca',
    description: 'Monitore e proteja sua marca e propriedade intelectual',
    icon: ShieldAlert,
    href: '/modules/eclipse/dashboard',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'users',
    name: 'Gestão de Usuários',
    description: 'Controle de acessos e permissões',
    icon: Users,
    href: '/modules/users/list',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
];

export default function ModulesPage() {
  const navigate = useNavigate();

  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <h1 className="text-4xl font-bold mb-2">Módulos</h1>
            <p className="text-muted-foreground">
              Acesse os módulos da plataforma SentinelIQ
            </p>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="w-full px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              
              return (
                <Card
                  key={module.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => navigate(module.href)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${module.color}`} />
                    </div>
                    <CardTitle className="text-xl">{module.name}</CardTitle>
                    <CardDescription className="text-base">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
