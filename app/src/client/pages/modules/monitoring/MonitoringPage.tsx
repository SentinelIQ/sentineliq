import { WorkspaceLayout } from '../../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Eye, Activity, Server, Database } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <WorkspaceLayout>
      <div className="w-full">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-8 h-8 text-blue-500" />
              <h1 className="text-4xl font-bold">Monitoramento</h1>
            </div>
            <p className="text-muted-foreground">
              Monitore métricas e indicadores em tempo real
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardDescription>Sistemas Ativos</CardDescription>
                <CardTitle className="text-3xl">24</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600">
                  <Activity className="w-4 h-4 mr-1" />
                  Todos operacionais
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Incidentes Abertos</CardDescription>
                <CardTitle className="text-3xl">3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-yellow-600">
                  <Activity className="w-4 h-4 mr-1" />
                  2 críticos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Servidores</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600">
                  <Server className="w-4 h-4 mr-1" />
                  Online
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Banco de Dados</CardDescription>
                <CardTitle className="text-3xl">5</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600">
                  <Database className="w-4 h-4 mr-1" />
                  Sincronizados
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard em Desenvolvimento</CardTitle>
              <CardDescription>
                Este módulo está em construção. Em breve você terá acesso a:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Monitoramento em tempo real de sistemas e aplicações</li>
                <li>Alertas automáticos para anomalias</li>
                <li>Dashboards personalizáveis com métricas customizadas</li>
                <li>Histórico de disponibilidade e performance</li>
                <li>Integração com ferramentas de monitoramento existentes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
