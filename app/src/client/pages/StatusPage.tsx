import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Activity, Database, Zap, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  responseTime: string;
  dependencies: {
    database: string;
    [key: string]: string;
  };
}

const StatusIndicator = ({ status }: { status: string }) => {
  switch (status) {
    case 'healthy':
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-success font-medium">Operacional</span>
        </div>
      );
    case 'degraded':
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          <span className="text-warning font-medium">Degradado</span>
        </div>
      );
    case 'unhealthy':
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">Inoperante</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Desconhecido</span>
        </div>
      );
  }
};

const ServiceCard = ({ 
  icon: Icon, 
  name, 
  status, 
  description 
}: { 
  icon: any; 
  name: string; 
  status: string; 
  description?: string;
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              status === 'healthy' ? 'bg-success/10' :
              status === 'degraded' ? 'bg-warning/10' : 'bg-destructive/10'
            }`}>
              <Icon className={`h-5 w-5 ${
                status === 'healthy' ? 'text-success' :
                status === 'degraded' ? 'text-warning' : 'text-destructive'
              }`} />
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              {description && (
                <CardDescription className="text-xs mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          <StatusIndicator status={status} />
        </div>
      </CardHeader>
    </Card>
  );
};

export default function StatusPage() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      setHealthData({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'sentineliq-api',
        version: '1.0.0',
        uptime: 0,
        responseTime: 'N/A',
        dependencies: {
          database: 'unhealthy',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Status da Plataforma SentinelIQ
          </h1>
          <p className="text-lg text-gray-600">
            Monitoramento em tempo real dos nossos serviços
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Status Geral</CardTitle>
                <CardDescription>
                  Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
                </CardDescription>
              </div>
              {!loading && healthData && (
                <StatusIndicator status={healthData.status} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {healthData ? formatUptime(healthData.uptime) : '-'}
                </div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {healthData?.responseTime || '-'}
                </div>
                <div className="text-sm text-gray-600">Tempo de Resposta</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Server className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {healthData?.version || '-'}
                </div>
                <div className="text-sm text-gray-600">Versão</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Status */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Componentes do Sistema</h2>
          
          <ServiceCard
            icon={Server}
            name="API Server"
            status={healthData?.status || 'unknown'}
            description="Servidor principal da aplicação"
          />
          
          <ServiceCard
            icon={Database}
            name="Database"
            status={healthData?.dependencies?.database || 'unknown'}
            description="PostgreSQL - Armazenamento de dados"
          />
          
          <ServiceCard
            icon={Activity}
            name="WebSocket Server"
            status="healthy"
            description="Notificações em tempo real"
          />
          
          <ServiceCard
            icon={Zap}
            name="Background Jobs"
            status="healthy"
            description="PgBoss - Processamento assíncrono"
          />
        </div>

        {/* Monitoring Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Monitoramento 24/7</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Monitoramento de Erros</div>
                <div className="text-sm text-gray-600">
                  Sistema integrado com Sentry para detecção e alertas em tempo real
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Health Check Automático</div>
                <div className="text-sm text-gray-600">
                  Verificação contínua de todos os componentes críticos da plataforma
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Uptime Monitoring</div>
                <div className="text-sm text-gray-600">
                  Compatível com Pingdom, UptimeRobot e outros serviços de monitoramento
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Em caso de problemas, entre em contato:{' '}
            <a href="mailto:support@sentineliq.com.br" className="text-blue-600 hover:underline">
              support@sentineliq.com.br
            </a>
          </p>
          <p className="mt-2">
            <a href="/" className="text-blue-600 hover:underline">
              ← Voltar para o site
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
