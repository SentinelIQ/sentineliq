import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Bell, Mail, MessageSquare, Moon, Clock, CheckCircle, Smartphone, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EVENT_TYPES = [
  { value: 'member_added', label: 'Novo membro adicionado' },
  { value: 'member_removed', label: 'Membro removido' },
  { value: 'member_role_changed', label: 'Alteração de função' },
  { value: 'payment_failed', label: 'Falha no pagamento' },
  { value: 'payment_succeeded', label: 'Pagamento bem-sucedido' },
  { value: 'subscription_changed', label: 'Alteração de assinatura' },
  { value: 'workspace_updated', label: 'Workspace atualizado' },
  { value: 'ownership_transferred', label: 'Transferência de propriedade' },
  { value: 'incident_critical', label: 'Incidente crítico' },
  { value: 'alert_created', label: 'Novo alerta' },
];

export default function NotificationPreferencesPage() {
  const { data: preferences, isLoading, refetch } = useQuery(getNotificationPreferences);
  const [isSaving, setIsSaving] = useState(false);

  // Push Notifications Hook
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    subscriptions: pushSubscriptions,
    requestPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    unsubscribeAll: unsubscribeAllPush,
    refreshSubscriptions,
  } = usePushNotifications();

  // Form state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [disabledEventTypes, setDisabledEventTypes] = useState<string[]>([]);
  
  // Provider toggles
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [discordEnabled, setDiscordEnabled] = useState(true);
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [teamsEnabled, setTeamsEnabled] = useState(true);

  // Digest settings
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState('DAILY');
  const [digestTime, setDigestTime] = useState('09:00');

  // Do Not Disturb
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStartTime, setDndStartTime] = useState('22:00');
  const [dndEndTime, setDndEndTime] = useState('08:00');

  // Load preferences when data is available
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setInAppEnabled(preferences.inAppEnabled);
      setPushEnabled(preferences.pushEnabled || false);
      setDisabledEventTypes(preferences.disabledEventTypes || []);
      setSlackEnabled(preferences.slackEnabled);
      setDiscordEnabled(preferences.discordEnabled);
      setWebhookEnabled(preferences.webhookEnabled);
      setTelegramEnabled(preferences.telegramEnabled);
      setTeamsEnabled(preferences.teamsEnabled);
      setDigestEnabled(preferences.digestEnabled);
      setDigestFrequency(preferences.digestFrequency);
      setDigestTime(preferences.digestTime);
      setDndEnabled(preferences.dndEnabled);
      setDndStartTime(preferences.dndStartTime || '22:00');
      setDndEndTime(preferences.dndEndTime || '08:00');
    }
  }, [preferences]);

  // Handle push notification toggle
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      // Enable push notifications
      if (pushPermission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          toast.error('Permissão de notificação negada');
          return;
        }
      }
      
      const success = await subscribePush();
      if (success) {
        setPushEnabled(true);
        toast.success('Notificações push habilitadas!');
      } else {
        toast.error(pushError || 'Erro ao habilitar notificações push');
      }
    } else {
      // Disable push notifications (unsubscribe current device)
      const success = await unsubscribePush();
      if (success) {
        setPushEnabled(false);
        toast.success('Notificações push desabilitadas');
      } else {
        toast.error('Erro ao desabilitar notificações push');
      }
    }
  };

  // Remove specific device subscription
  const handleRemoveDevice = async (endpoint: string) => {
    const success = await unsubscribePush(endpoint);
    if (success) {
      toast.success('Dispositivo removido');
      await refreshSubscriptions();
    } else {
      toast.error('Erro ao remover dispositivo');
    }
  };

  // Remove all subscriptions
  const handleRemoveAllDevices = async () => {
    if (!confirm('Tem certeza que deseja remover todos os dispositivos?')) {
      return;
    }
    
    const success = await unsubscribeAllPush();
    if (success) {
      setPushEnabled(false);
      toast.success('Todos os dispositivos removidos');
    } else {
      toast.error('Erro ao remover dispositivos');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateNotificationPreferences({
        emailEnabled,
        inAppEnabled,
        pushEnabled,
        disabledEventTypes,
        slackEnabled,
        discordEnabled,
        webhookEnabled,
        telegramEnabled,
        teamsEnabled,
        digestEnabled,
        digestFrequency,
        digestTime,
        dndEnabled,
        dndStartTime: dndEnabled ? dndStartTime : null,
        dndEndTime: dndEnabled ? dndEndTime : null,
      });

      await refetch();
      toast.success('Preferências salvas com sucesso!');
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      toast.error(error.message || 'Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEventType = (eventType: string) => {
    setDisabledEventTypes((prev) => {
      if (prev.includes(eventType)) {
        return prev.filter((t) => t !== eventType);
      } else {
        return [...prev, eventType];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="h-8 w-8" />
          Preferências de Notificações
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure como e quando você deseja receber notificações
        </p>
      </div>

      {/* Main Channels */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Canais de Notificação
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-enabled" className="text-base">
                  Notificações por Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações importantes por email
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-enabled" className="text-base">
                  Notificações In-App
                </Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar notificações dentro da plataforma
                </p>
              </div>
              <Switch
                id="inapp-enabled"
                checked={inAppEnabled}
                onCheckedChange={setInAppEnabled}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Web Push Notifications */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notificações Push (Web)
          </h2>
          
          {!isPushSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seu navegador não suporta notificações push. Por favor, use Chrome, Firefox, Edge ou Safari 16+.
              </AlertDescription>
            </Alert>
          )}

          {isPushSupported && pushPermission === 'denied' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você bloqueou as notificações push. Para habilitar, acesse as configurações do navegador e permita notificações para este site.
              </AlertDescription>
            </Alert>
          )}

          {isPushSupported && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-enabled" className="text-base">
                      Notificações Push do Navegador
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações mesmo quando o navegador estiver fechado
                    </p>
                  </div>
                  <Switch
                    id="push-enabled"
                    checked={isPushSubscribed}
                    onCheckedChange={handlePushToggle}
                    disabled={isPushLoading || pushPermission === 'denied'}
                  />
                </div>

                {pushError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{pushError}</AlertDescription>
                  </Alert>
                )}

                {/* Device List */}
                {pushSubscriptions.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Dispositivos Registrados</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAllDevices}
                        disabled={isPushLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Todos
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {pushSubscriptions.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {subscription.deviceName || 'Dispositivo Desconhecido'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Último uso: {formatDistanceToNow(new Date(subscription.lastUsedAt), { 
                                  addSuffix: true,
                                  locale: ptBR 
                                })}
                              </p>
                            </div>
                            {subscription.endpoint === (window as any).__currentPushEndpoint && (
                              <Badge variant="secondary">Este dispositivo</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDevice(subscription.endpoint)}
                            disabled={isPushLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Você pode registrar múltiplos dispositivos (desktop, mobile, tablets) para receber notificações em todos eles.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Provider Channels */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Integrações Externas
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Controle notificações para providers externos configurados no workspace
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="slack-enabled">Slack</Label>
              <Switch
                id="slack-enabled"
                checked={slackEnabled}
                onCheckedChange={setSlackEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="discord-enabled">Discord</Label>
              <Switch
                id="discord-enabled"
                checked={discordEnabled}
                onCheckedChange={setDiscordEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="webhook-enabled">Webhooks</Label>
              <Switch
                id="webhook-enabled"
                checked={webhookEnabled}
                onCheckedChange={setWebhookEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="telegram-enabled">Telegram</Label>
              <Switch
                id="telegram-enabled"
                checked={telegramEnabled}
                onCheckedChange={setTelegramEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="teams-enabled">Microsoft Teams</Label>
              <Switch
                id="teams-enabled"
                checked={teamsEnabled}
                onCheckedChange={setTeamsEnabled}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Event Types */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Tipos de Eventos
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione os tipos de eventos que você deseja receber notificações
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EVENT_TYPES.map((eventType) => (
              <div
                key={eventType.value}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Label htmlFor={`event-${eventType.value}`} className="cursor-pointer flex-1">
                  {eventType.label}
                </Label>
                <Switch
                  id={`event-${eventType.value}`}
                  checked={!disabledEventTypes.includes(eventType.value)}
                  onCheckedChange={() => toggleEventType(eventType.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Digest Settings */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumo de Notificações (Digest)
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="digest-enabled" className="text-base">
                  Habilitar Resumo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba um resumo agrupado de notificações em vez de notificações individuais
                </p>
              </div>
              <Switch
                id="digest-enabled"
                checked={digestEnabled}
                onCheckedChange={setDigestEnabled}
              />
            </div>

            {digestEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="digest-frequency">Frequência</Label>
                  <Select value={digestFrequency} onValueChange={setDigestFrequency}>
                    <SelectTrigger id="digest-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="digest-time">Horário de Envio</Label>
                  <input
                    id="digest-time"
                    type="time"
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Do Not Disturb */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Modo Silencioso (DND)
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dnd-enabled" className="text-base">
                  Habilitar Modo Silencioso
                </Label>
                <p className="text-sm text-muted-foreground">
                  Não receber notificações durante um período específico
                </p>
              </div>
              <Switch
                id="dnd-enabled"
                checked={dndEnabled}
                onCheckedChange={setDndEnabled}
              />
            </div>

            {dndEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dnd-start">Início</Label>
                  <input
                    id="dnd-start"
                    type="time"
                    value={dndStartTime}
                    onChange={(e) => setDndStartTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dnd-end">Fim</Label>
                  <input
                    id="dnd-end"
                    type="time"
                    value={dndEndTime}
                    onChange={(e) => setDndEndTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>
    </div>
  );
}
