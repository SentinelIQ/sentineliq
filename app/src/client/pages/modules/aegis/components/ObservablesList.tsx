import { Observable } from '../types/aegis.types';
import { 
  Globe, 
  Mail, 
  Hash, 
  FileText, 
  Server,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import { useState } from 'react';
import { cn } from '../../../../../lib/utils';

interface ObservablesListProps {
  observables: Observable[];
  onObservableClick?: (observable: Observable) => void;
  showEnrichment?: boolean;
  compact?: boolean;
}

export function ObservablesList({ 
  observables, 
  onObservableClick,
  showEnrichment = true,
  compact = false
}: ObservablesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getTypeIcon = (type: Observable['type']) => {
    switch (type) {
      case 'ip':
        return <Server className="w-5 h-5 text-blue-500" />;
      case 'domain':
      case 'url':
        return <Globe className="w-5 h-5 text-purple-500" />;
      case 'email':
        return <Mail className="w-5 h-5 text-green-500" />;
      case 'hash-md5':
      case 'hash-sha1':
      case 'hash-sha256':
        return <Hash className="w-5 h-5 text-orange-500" />;
      case 'file':
        return <FileText className="w-5 h-5 text-yellow-500" />;
      case 'registry':
        return <Shield className="w-5 h-5 text-red-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTLPColor = (tlp: Observable['tlp']) => {
    switch (tlp) {
      case 'red':
        return 'bg-red-500 text-white';
      case 'amber':
        return 'bg-orange-500 text-white';
      case 'green':
        return 'bg-green-500 text-white';
      case 'white':
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getThreatIcon = (level?: string) => {
    switch (level) {
      case 'malicious':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'benign':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const copyToClipboard = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateValue = (value: string, maxLength: number = 50) => {
    if (value.length <= maxLength) return value;
    return `${value.substring(0, maxLength)}...`;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {observables.map((obs) => (
          <div
            key={obs.id}
            className={cn(
              "p-3 border rounded-lg flex items-center justify-between transition-colors",
              onObservableClick && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={() => onObservableClick?.(obs)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getTypeIcon(obs.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm truncate">{truncateValue(obs.value)}</span>
                  {obs.ioc && (
                    <Badge variant="destructive" className="text-xs">IoC</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="uppercase">{obs.type}</span>
                  <Badge className={cn("text-xs", getTLPColor(obs.tlp))}>
                    TLP:{obs.tlp.toUpperCase()}
                  </Badge>
                  {obs.enrichment?.threatLevel && (
                    <div className="flex items-center gap-1">
                      {getThreatIcon(obs.enrichment.threatLevel)}
                      <span className="capitalize">{obs.enrichment.threatLevel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(obs.value, obs.id);
              }}
            >
              {copiedId === obs.id ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {observables.map((obs) => (
        <Card 
          key={obs.id}
          className={cn(
            "transition-colors",
            onObservableClick && "cursor-pointer hover:border-primary"
          )}
          onClick={() => onObservableClick?.(obs)}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {getTypeIcon(obs.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-base font-mono break-all">
                      {obs.value}
                    </CardTitle>
                    {obs.ioc && (
                      <Badge variant="destructive">IoC</Badge>
                    )}
                    {obs.sighted && (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="w-3 h-3" />
                        Sighted
                      </Badge>
                    )}
                  </div>
                  
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <span className="uppercase text-xs font-semibold">{obs.type}</span>
                    <Badge className={cn("text-xs", getTLPColor(obs.tlp))}>
                      TLP:{obs.tlp.toUpperCase()}
                    </Badge>
                    <Badge className={cn("text-xs", getTLPColor(obs.pap))}>
                      PAP:{obs.pap.toUpperCase()}
                    </Badge>
                    {obs.source && (
                      <span className="text-xs">• {obs.source}</span>
                    )}
                  </CardDescription>

                  {obs.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {obs.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(obs.value, obs.id);
                  }}
                >
                  {copiedId === obs.id ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Tags */}
            {obs.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {obs.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          {showEnrichment && obs.enrichment && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Threat Level */}
                  {obs.enrichment.threatLevel && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getThreatIcon(obs.enrichment.threatLevel)}
                        <span className="font-medium">Threat Level</span>
                      </div>
                      <span className="capitalize font-semibold">
                        {obs.enrichment.threatLevel}
                      </span>
                    </div>
                  )}

                  {/* Reputation Score */}
                  {obs.enrichment.reputation !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">Reputation Score</span>
                      <span className="font-semibold text-red-500">
                        {obs.enrichment.reputation} / 100
                      </span>
                    </div>
                  )}

                  {/* Geolocation */}
                  {obs.enrichment.geoLocation && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">Location</span>
                      <span className="text-sm">
                        {obs.enrichment.geoLocation}
                        {obs.enrichment.country && ` (${obs.enrichment.country})`}
                      </span>
                    </div>
                  )}

                  {/* ASN */}
                  {obs.enrichment.asn && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">ASN</span>
                      <span className="font-mono text-sm">{obs.enrichment.asn}</span>
                    </div>
                  )}

                  {/* Verdicts */}
                  {obs.enrichment.verdicts && obs.enrichment.verdicts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Verdicts</h4>
                      <div className="space-y-2">
                        {obs.enrichment.verdicts.map((verdict, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {getThreatIcon(verdict.verdict)}
                                <span className="font-medium text-sm">{verdict.service}</span>
                              </div>
                              <Badge 
                                variant={
                                  verdict.verdict === 'malicious' ? 'destructive' :
                                  verdict.verdict === 'suspicious' ? 'default' :
                                  verdict.verdict === 'benign' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {verdict.confidence}% confidence
                              </Badge>
                            </div>
                            {verdict.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {verdict.details}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Threats */}
                  {obs.enrichment.relatedThreats && obs.enrichment.relatedThreats.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Related Threats</h4>
                      <div className="flex flex-wrap gap-2">
                        {obs.enrichment.relatedThreats.map((threat, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {threat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* First/Last Seen */}
                  {(obs.enrichment.firstSeen || obs.enrichment.lastSeen) && (
                    <div className="grid grid-cols-2 gap-3">
                      {obs.enrichment.firstSeen && (
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">First Seen</p>
                          <p className="text-xs font-medium">
                            {new Date(obs.enrichment.firstSeen).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {obs.enrichment.lastSeen && (
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
                          <p className="text-xs font-medium">
                            {new Date(obs.enrichment.lastSeen).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
