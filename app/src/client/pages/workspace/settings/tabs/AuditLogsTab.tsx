import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAuditLogs } from 'wasp/client/operations';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Download } from 'lucide-react';
import { useToast } from '../../../../hooks/useToast';

const ACTION_COLORS: Record<string, string> = {
  WORKSPACE_CREATED: 'bg-green-500',
  WORKSPACE_UPDATED: 'bg-blue-500',
  WORKSPACE_DELETED: 'bg-red-500',
  MEMBER_ADDED: 'bg-green-500',
  MEMBER_REMOVED: 'bg-red-500',
  MEMBER_ROLE_CHANGED: 'bg-yellow-500',
  OWNERSHIP_TRANSFERRED: 'bg-purple-500',
  PAYMENT_SUCCEEDED: 'bg-green-500',
  PAYMENT_FAILED: 'bg-red-500',
  SUBSCRIPTION_CHANGED: 'bg-blue-500',
  PROVIDER_CONFIGURED: 'bg-blue-500',
  SETTINGS_UPDATED: 'bg-blue-500',
};

interface AuditLogsTabProps {
  workspace: any;
}

export default function AuditLogsTab({ workspace }: AuditLogsTabProps) {
  const { t } = useTranslation('audit');
  const [action, setAction] = useState<string | undefined>(undefined);
  const [resource, setResource] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, error } = useQuery(
    getAuditLogs,
    workspace?.id ? {
      workspaceId: workspace.id,
      action: action as any,
      resource: resource || undefined,
      limit: pageSize,
      offset: page * pageSize,
    } : undefined
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const { toast } = useToast();
  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setPage((p) => p + 1);

  const handleExport = () => {
    toast.info(t('messages.exportSoon'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {t('export')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters.title')}</CardTitle>
          <CardDescription>{t('filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('filters.actionType')}</label>
              <Select value={action || 'all'} onValueChange={(v) => setAction(v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.allActions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allActions')}</SelectItem>
                  <SelectItem value="WORKSPACE_CREATED">{t('actions.WORKSPACE_CREATED')}</SelectItem>
                  <SelectItem value="WORKSPACE_UPDATED">{t('actions.WORKSPACE_UPDATED')}</SelectItem>
                  <SelectItem value="MEMBER_ADDED">{t('actions.MEMBER_ADDED')}</SelectItem>
                  <SelectItem value="MEMBER_REMOVED">{t('actions.MEMBER_REMOVED')}</SelectItem>
                  <SelectItem value="MEMBER_ROLE_CHANGED">{t('actions.MEMBER_ROLE_CHANGED')}</SelectItem>
                  <SelectItem value="OWNERSHIP_TRANSFERRED">{t('actions.OWNERSHIP_TRANSFERRED')}</SelectItem>
                  <SelectItem value="PAYMENT_SUCCEEDED">{t('actions.PAYMENT_SUCCEEDED')}</SelectItem>
                  <SelectItem value="PAYMENT_FAILED">{t('actions.PAYMENT_FAILED')}</SelectItem>
                  <SelectItem value="SUBSCRIPTION_CHANGED">{t('actions.SUBSCRIPTION_CHANGED')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('filters.resource')}</label>
              <Input
                placeholder={t('filters.resourcePlaceholder')}
                value={resource}
                onChange={(e) => setResource(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setAction(undefined);
                  setResource('');
                  setPage(0);
                }}
              >
                {t('filters.clear')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t('timeline.title')} ({t('timeline.total', { count: total })})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('timeline.loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {t('timeline.error', { message: error.message })}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('timeline.noLogs')}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="border-l-4 pl-4 py-2 hover:bg-accent/50 transition-colors"
                  style={{ borderLeftColor: ACTION_COLORS[log.action] || '#6b7280' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={ACTION_COLORS[log.action] || 'bg-gray-500'}
                        >
                          {String(t(`actions.${log.action}`, log.action.replace(/_/g, ' ')))}
                        </Badge>
                        <Badge variant="outline">{log.resource}</Badge>
                        {log.user && (
                          <span className="text-sm text-muted-foreground">
                            {t('timeline.by')} {log.user.email || log.user.username || t('timeline.unknown')}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{log.description}</p>
                      {log.metadata && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            {t('timeline.viewDetails')}
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          {t('timeline.ipAddress')}: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && logs.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('pagination.showing', {
                  start: page * pageSize + 1,
                  end: page * pageSize + logs.length,
                  total: total
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 0}
                >
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
