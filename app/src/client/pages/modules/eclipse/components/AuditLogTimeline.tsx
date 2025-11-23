import { useQuery, getAuditLogsByResource } from 'wasp/client/operations';
import { Clock, User, Edit, Trash2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';

interface AuditLogTimelineProps {
  workspaceId: string;
  resourceType: 'brand' | 'monitor' | 'alert' | 'infringement' | 'action';
  resourceId: string;
}

const actionIcons: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  ESCALATE: AlertTriangle,
  ASSIGN: User,
  COMPLETE: CheckCircle,
};

const actionColors: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-100',
  UPDATE: 'text-blue-600 bg-blue-100',
  DELETE: 'text-red-600 bg-red-100',
  ESCALATE: 'text-orange-600 bg-orange-100',
  ASSIGN: 'text-purple-600 bg-purple-100',
  COMPLETE: 'text-green-600 bg-green-100',
};

export function AuditLogTimeline({ workspaceId, resourceType, resourceId }: AuditLogTimelineProps) {
  const { data: logs, isLoading } = useQuery(getAuditLogsByResource, {
    workspaceId,
    resource: resourceType,
    resourceId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum histórico de alterações</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log: any, index: number) => {
        const Icon = actionIcons[log.action] || Edit;
        const colorClass = actionColors[log.action] || 'text-muted-foreground bg-muted';
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="relative flex gap-4 pb-6">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-5 top-10 h-full w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1 pt-1">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{log.user?.email || log.user?.username || 'Sistema'}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(log.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
                  {log.action}
                </span>
              </div>

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Ver detalhes
                  </summary>
                  <div className="mt-2 rounded-md bg-muted p-3">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </details>
              )}

              {/* IP & User Agent */}
              {(log.ipAddress || log.userAgent) && (
                <div className="text-xs text-muted-foreground opacity-70 space-y-0.5">
                  {log.ipAddress && <div>IP: {log.ipAddress}</div>}
                  {log.userAgent && (
                    <div className="truncate max-w-md">
                      {log.userAgent.substring(0, 60)}...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
