import { Badge } from '../../../../components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../lib/utils';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

interface SeverityBadgeProps {
  severity: Severity;
  showIcon?: boolean;
  className?: string;
}

const severityConfig = {
  critical: {
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  high: {
    variant: 'default' as const,
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  medium: {
    variant: 'secondary' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  low: {
    variant: 'outline' as const,
    className: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  },
};

export function SeverityBadge({ severity, showIcon = false, className }: SeverityBadgeProps) {
  const { t } = useTranslation('aegis');
  const config = severityConfig[severity];

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {showIcon && <AlertTriangle className="w-3 h-3 mr-1" />}
      {t(`alerts.severity.${severity}`)}
    </Badge>
  );
}
