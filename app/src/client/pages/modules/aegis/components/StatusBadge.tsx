import { Badge } from '../../../../components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../lib/utils';

type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved';
type IncidentStatus = 'active' | 'investigating' | 'containment' | 'eradication' | 'recovery' | 'resolved' | 'closed';
type CaseStatus = 'active' | 'review' | 'closed' | 'archived';

export type Status = AlertStatus | IncidentStatus | CaseStatus;

interface StatusBadgeProps {
  status: Status;
  type: 'alert' | 'incident' | 'case';
  className?: string;
}

const statusConfig: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; className?: string }> = {
  // Alert statuses
  new: { variant: 'destructive', className: 'bg-red-500 text-white' },
  acknowledged: { variant: 'default' },
  investigating: { variant: 'default', className: 'bg-blue-500 text-white' },
  
  // Incident statuses
  active: { variant: 'destructive', className: 'bg-red-500 text-white' },
  containment: { variant: 'default', className: 'bg-orange-500 text-white' },
  eradication: { variant: 'default', className: 'bg-purple-500 text-white' },
  recovery: { variant: 'default', className: 'bg-blue-500 text-white' },
  
  // Case statuses
  review: { variant: 'secondary', className: 'bg-yellow-500 text-white' },
  archived: { variant: 'outline' },
  
  // Common statuses
  resolved: { variant: 'secondary', className: 'bg-green-500 text-white' },
  closed: { variant: 'outline' },
};

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const { t } = useTranslation('aegis');
  const config = statusConfig[status] || { variant: 'default' as const };

  const getTranslationKey = (): string => {
    switch (type) {
      case 'alert':
        return `alerts.status.${status}`;
      case 'incident':
        return `incidents.status.${status}`;
      case 'case':
        return `cases.status.${status}`;
    }
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {t(getTranslationKey() as any)}
    </Badge>
  );
}
