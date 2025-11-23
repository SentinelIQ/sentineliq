import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Activity, 
  TrendingUp, 
  Users, 
  BarChart3,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useQuery } from 'wasp/client/operations';
import { getDailyStats } from 'wasp/client/operations';

export default function AnalyticsConfigPage() {
  const { data: stats, isLoading } = useQuery(getDailyStats);
  const [copied, setCopied] = useState(false);

  const isConfigured = process.env.REACT_APP_PLAUSIBLE_API_KEY !== undefined;
  const isEnabled = process.env.REACT_APP_ANALYTICS_ENABLED === 'true';

  const handleCopyScript = () => {
    const script = `<script defer data-domain="sentineliq.com.br" src="https://plausible.io/js/script.js"></script>`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Configuração de Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Configure e monitore seus provedores de analytics
            </p>
          </div>
          <Badge variant={isConfigured ? 'default' : 'secondary'}>
            {isConfigured ? 'Configurado' : 'Usando Mock Data'}
          </Badge>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-lg font-bold">
                  {isEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isConfigured ? 'Plausible conectado' : 'Mock data ativo'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats?.dailyStats?.totalViews.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Carregando...' : `${stats?.dailyStats?.prevDayViewsChangePercent}% vs ontem`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats?.dailyStats?.userCount.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de usuários
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fontes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats?.dailyStats?.sources?.length || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Origens de tráfego
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plausible Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Plausible Analytics
              {isConfigured && <CheckCircle className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Analytics de código aberto focado em privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input 
                  type="password" 
                  placeholder={isConfigured ? '••••••••••••••••' : 'Não configurado'}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Site ID</Label>
                <Input 
                  value="sentineliq.com.br" 
                  disabled
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Script de Tracking</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScript}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <code className="text-xs block bg-background p-2 rounded">
                {`<script defer data-domain="sentineliq.com.br" src="https://plausible.io/js/script.js"></script>`}
              </code>
              <p className="text-xs text-muted-foreground">
                Já está configurado no main.wasp
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a 
                  href="https://plausible.io/sentineliq.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Dashboard
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://plausible.io/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Documentação
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {!isConfigured && (
          <Card>
            <CardHeader>
              <CardTitle>🚀 Como Configurar</CardTitle>
              <CardDescription>
                Siga estes passos para conectar o Plausible Analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>
                  Acesse <a href="https://plausible.io/register" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">plausible.io/register</a> e crie uma conta
                </li>
                <li>
                  Adicione o site <code className="bg-muted px-2 py-1 rounded">sentineliq.com.br</code> ao dashboard
                </li>
                <li>
                  Vá em <strong>Settings → API Keys</strong> e gere uma nova API key
                </li>
                <li>
                  Adicione as credenciais ao arquivo <code className="bg-muted px-2 py-1 rounded">.env.server</code>:
                  <pre className="bg-muted p-3 rounded mt-2 text-xs overflow-x-auto">
{`PLAUSIBLE_API_KEY=sua_api_key_aqui
PLAUSIBLE_SITE_ID=sentineliq.com.br
PLAUSIBLE_BASE_URL=https://plausible.io
ANALYTICS_ENABLED=true`}
                  </pre>
                </li>
                <li>
                  Reinicie o servidor com <code className="bg-muted px-2 py-1 rounded">wasp start</code>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Mock Data Notice */}
        {!isConfigured && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">📊 Usando Mock Data</CardTitle>
              <CardDescription className="text-yellow-700">
                O sistema está gerando dados simulados para desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-yellow-700">
              <p>
                Como o Plausible não está configurado, o sistema está usando dados mockados 
                aleatórios para permitir o desenvolvimento e testes da interface. Os dados são 
                gerados dinamicamente a cada consulta.
              </p>
              <p className="mt-2">
                Configure as credenciais do Plausible para começar a coletar dados reais.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
