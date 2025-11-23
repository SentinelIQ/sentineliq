import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'wasp/client/operations';
import { getSystemLogs } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

const LOG_LEVEL_COLORS = {
  DEBUG: 'bg-muted text-muted-foreground',
  INFO: 'bg-primary/10 text-primary',
  WARN: 'bg-warning/10 text-warning',
  ERROR: 'bg-destructive/10 text-destructive',
  CRITICAL: 'bg-destructive/10 text-destructive',
};

export default function SystemLogsPage() {
  const { t } = useTranslation('admin');
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [component, setComponent] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, error } = useQuery(getSystemLogs, {
    level: level as any,
    component: component || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setPage((p) => p + 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('systemLogs.title')}</h1>
        <p className="text-muted-foreground">
          {t('systemLogs.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('systemLogs.filters')}</CardTitle>
          <CardDescription>{t('systemLogs.filterDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('systemLogs.logLevel')}</label>
              <Select value={level || 'all'} onValueChange={(v) => setLevel(v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('systemLogs.allLevels')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('systemLogs.allLevels')}</SelectItem>
                  <SelectItem value="DEBUG">{t('systemLogs.levels.DEBUG')}</SelectItem>
                  <SelectItem value="INFO">{t('systemLogs.levels.INFO')}</SelectItem>
                  <SelectItem value="WARN">{t('systemLogs.levels.WARN')}</SelectItem>
                  <SelectItem value="ERROR">{t('systemLogs.levels.ERROR')}</SelectItem>
                  <SelectItem value="CRITICAL">{t('systemLogs.levels.CRITICAL')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('systemLogs.component')}</label>
              <Input
                placeholder={t('systemLogs.componentPlaceholder')}
                value={component}
                onChange={(e) => setComponent(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setLevel(undefined);
                  setComponent('');
                  setPage(0);
                }}
              >
                {t('systemLogs.clear')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('systemLogs.title')} ({total} {t('systemLogs.total')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('systemLogs.loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {t('systemLogs.error')}: {error.message}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('systemLogs.noLogs')}
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={LOG_LEVEL_COLORS[log.level as keyof typeof LOG_LEVEL_COLORS]}>
                          {t(`systemLogs.levels.${log.level}` as any)}
                        </Badge>
                        <Badge variant="outline">{log.component}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.metadata && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            {t('systemLogs.viewMetadata')}
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && logs.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {t('systemLogs.showing')} {page * pageSize + 1} - {page * pageSize + logs.length} {t('systemLogs.of')} {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 0}
                >
                  {t('systemLogs.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  {t('systemLogs.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
