import { CustodyLog } from '../types/aegis.types';
import { Shield, User, MapPin, Clock, FileSignature, Hash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';

interface ChainOfCustodyProps {
  custodyLogs: CustodyLog[];
  evidenceId: string;
  evidenceName?: string;
}

export function ChainOfCustody({ custodyLogs, evidenceId, evidenceName }: ChainOfCustodyProps) {
  const getActionColor = (action: CustodyLog['action']) => {
    switch (action) {
      case 'collected':
        return 'bg-blue-500';
      case 'transferred':
        return 'bg-purple-500';
      case 'analyzed':
        return 'bg-green-500';
      case 'stored':
        return 'bg-gray-500';
      case 'preserved':
        return 'bg-indigo-500';
      case 'quarantined':
        return 'bg-red-500';
      case 'accessed':
        return 'bg-yellow-500';
      case 'modified':
        return 'bg-orange-500';
      case 'deleted':
        return 'bg-red-700';
      default:
        return 'bg-gray-400';
    }
  };

  const getActionLabel = (action: CustodyLog['action']) => {
    return action.toUpperCase().replace('_', ' ');
  };

  // Sort by timestamp
  const sortedLogs = [...custodyLogs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Chain of Custody
        </CardTitle>
        <CardDescription>
          Complete audit trail for {evidenceName || evidenceId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedLogs.map((log, index) => (
            <div key={log.id}>
              <div className="relative pl-8 pb-4">
                {/* Timeline dot */}
                <div className="absolute left-0 top-0">
                  <div className={`w-4 h-4 rounded-full ${getActionColor(log.action)}`} />
                  {index < sortedLogs.length - 1 && (
                    <div className="absolute left-2 top-4 w-0.5 h-full bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getActionColor(log.action)} text-white`}>
                      {getActionLabel(log.action)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    {/* User */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Handled by:</span>{' '}
                        <span className="font-medium">{log.user}</span>
                      </span>
                    </div>

                    {/* Location */}
                    {log.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Location:</span>{' '}
                          <span className="font-medium">{log.location}</span>
                        </span>
                      </div>
                    )}

                    {/* Device */}
                    {log.device && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Device:</span>{' '}
                          <span className="font-medium font-mono">{log.device}</span>
                        </span>
                      </div>
                    )}

                    {/* IP Address */}
                    {log.ipAddress && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">IP:</span>{' '}
                          <span className="font-medium font-mono">{log.ipAddress}</span>
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground italic">
                          {log.notes}
                        </p>
                      </div>
                    )}

                    {/* Hash Verification */}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {log.previousHash && (
                            <div className="mb-2">
                              <span className="text-xs text-muted-foreground">Previous Hash:</span>
                              <p className="font-mono text-xs break-all">{log.previousHash}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-muted-foreground">Current Hash:</span>
                            <p className="font-mono text-xs break-all">{log.currentHash}</p>
                          </div>
                          {log.previousHash && log.previousHash === log.currentHash && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              ✓ Integrity Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Signature */}
                    {log.signature && (
                      <>
                        <Separator />
                        <div className="flex items-start gap-2">
                          <FileSignature className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Digital Signature:</span>
                            <p className="font-mono text-xs break-all text-muted-foreground">
                              {log.signature}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Events</p>
              <p className="text-2xl font-bold">{sortedLogs.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Handlers</p>
              <p className="text-2xl font-bold">
                {new Set(sortedLogs.map(l => l.user)).size}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="text-2xl font-bold">
                {Math.ceil(
                  (new Date(sortedLogs[sortedLogs.length - 1].timestamp).getTime() - 
                   new Date(sortedLogs[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
                )}d
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
