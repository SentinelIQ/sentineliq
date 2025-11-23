/**
 * TTPsList Component
 * 
 * Generic, reusable component for displaying TTPs linked to any resource
 * Supports polymorphic associations (CASE, ALERT, INCIDENT, BRAND_INFRINGEMENT)
 */

import React, { useMemo } from 'react';
import type { TTP } from 'wasp/entities';
import { useTTPs, type SupportedResourceType } from '../hooks/useTTPs';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../../lib/utils';

export interface TTpsListProps {
  resourceId: string;
  resourceType: SupportedResourceType;
  /**
   * Show condensed view (max 3 items visible)
   * @default false
   */
  condensed?: boolean;
  /**
   * CSS class name for custom styling
   */
  className?: string;
  /**
   * Optional custom header
   */
  title?: string;
  /**
   * Show severity badge
   * @default true
   */
  showSeverity?: boolean;
  /**
   * Show confidence level
   * @default true
   */
  showConfidence?: boolean;
  /**
   * Show occurrence count
   * @default true
   */
  showOccurrenceCount?: boolean;
  /**
   * Custom formatter for resource type display
   */
  formatResourceType?: (type: string) => string;
}

const DEFAULT_RESOURCE_TYPE_LABELS: Record<string, string> = {
  CASE: 'Case',
  ALERT: 'Alert',
  INCIDENT: 'Incident',
  BRAND_INFRINGEMENT: 'Brand Infringement',
  TIMELINE_EVENT: 'Timeline Event',
  ECLIPSE: 'Eclipse',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-500',
};

const TACTIC_COLORS = [
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-indigo-100 text-indigo-800',
  'bg-pink-100 text-pink-800',
  'bg-gray-100 text-gray-800',
];

/**
 * Get consistent color for a tactic based on its hash
 */
function getTacticColor(tacticId: string): string {
  let hash = 0;
  for (let i = 0; i < tacticId.length; i++) {
    hash = ((hash << 5) - hash) + tacticId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TACTIC_COLORS.length;
  return TACTIC_COLORS[index];
}

/**
 * Render severity badge if applicable
 */
function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null;
  const color = SEVERITY_COLORS[severity.toLowerCase()] || SEVERITY_COLORS.info;
  return (
    <Badge className={cn('text-xs', color)}>
      {severity.toUpperCase()}
    </Badge>
  );
}

/**
 * Render confidence level as dots
 */
function ConfidenceIndicator({ confidence }: { confidence?: number | null }) {
  if (confidence === null || confidence === undefined) return null;

  const level = Math.min(Math.round((confidence || 0) / 20), 5);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            i < level ? 'bg-blue-500' : 'bg-gray-300'
          )}
        />
      ))}
    </div>
  );
}

/**
 * TTP Item component
 */
function TTPItem({
  ttp,
  showSeverity,
  showConfidence,
  showOccurrenceCount,
}: {
  ttp: TTP;
  showSeverity?: boolean;
  showConfidence?: boolean;
  showOccurrenceCount?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              getTacticColor(ttp.tacticId)
            )}
          >
            {ttp.tacticName}
          </span>
          <span className="text-xs font-semibold text-gray-700">
            {ttp.techniqueId}
          </span>
          {ttp.subtechniqueId && (
            <span className="text-xs text-gray-600">
              {ttp.subtechniqueId}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-gray-900 line-clamp-1">
          {ttp.techniqueName}
          {ttp.subtechniqueName && ` - ${ttp.subtechniqueName}`}
        </p>

        {ttp.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {ttp.description}
          </p>
        )}

        {(showConfidence || showOccurrenceCount) && (
          <div className="flex items-center gap-3 mt-2">
            {showConfidence && <ConfidenceIndicator confidence={ttp.confidence} />}
            {showOccurrenceCount && ttp.occurrenceCount > 1 && (
              <span className="text-xs text-gray-600">
                Occurrences: {ttp.occurrenceCount}
              </span>
            )}
          </div>
        )}
      </div>

      {showSeverity && (
        <div className="flex-shrink-0">
          <SeverityBadge severity={ttp.severity} />
        </div>
      )}
    </div>
  );
}

/**
 * Main TTPsList component
 */
export function TTPsList({
  resourceId,
  resourceType,
  condensed = false,
  className,
  title,
  showSeverity = true,
  showConfidence = true,
  showOccurrenceCount = true,
  formatResourceType,
}: TTpsListProps) {
  const {
    data: ttps,
    isLoading,
    error,
  } = useTTPs({
    resourceId,
    resourceType,
  });

  const isEmpty = !isLoading && (!ttps || ttps.length === 0);
  const hasError = !!error;

  const displayedTTPs = useMemo(
    () => (condensed && (ttps?.length ?? 0) > 3 ? ttps?.slice(0, 3) : ttps),
    [ttps, condensed]
  );

  const resourceLabel = formatResourceType
    ? formatResourceType(resourceType)
    : DEFAULT_RESOURCE_TYPE_LABELS[resourceType];

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn('text-sm text-red-600', className)}>
        <p>Error loading TTPs</p>
        {error && <p className="text-xs text-gray-600 mt-1">{error.message}</p>}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('text-sm text-gray-500 italic', className)}>
        <p>No TTPs linked to this {resourceLabel.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          {title}
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {ttps?.length ?? 0}
          </span>
        </h3>
      )}

      <div className="space-y-2">
        {displayedTTPs?.map((ttp: TTP) => (
          <TTPItem
            key={ttp.id}
            ttp={ttp}
            showSeverity={showSeverity}
            showConfidence={showConfidence}
            showOccurrenceCount={showOccurrenceCount}
          />
        ))}
      </div>

      {condensed && (ttps?.length ?? 0) > 3 && (
        <p className="text-xs text-gray-600 text-center pt-2">
          +{(ttps?.length ?? 0) - 3} more TTP{(ttps?.length ?? 0) - 4 !== 0 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Minimal TTPsList variant for inline display
 */
export function TTpsListCompact({
  resourceId,
  resourceType,
  className,
}: Omit<TTpsListProps, 'condensed' | 'title'>) {
  const { data: ttps, isLoading, error } = useTTPs({
    resourceId,
    resourceType,
  });

  const isEmpty = !isLoading && (!ttps || ttps.length === 0);

  if (isLoading) {
    return <div className="h-2 w-12 bg-gray-200 rounded animate-pulse" />;
  }

  if (isEmpty) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className={cn('flex gap-1 flex-wrap', className)}>
      {ttps?.slice(0, 3).map((ttp: TTP) => (
        <Badge
          key={ttp.id}
          variant="secondary"
          className="text-xs"
          title={`${ttp.tacticName}: ${ttp.techniqueName}`}
        >
          {ttp.techniqueId}
        </Badge>
      ))}
      {(ttps?.length ?? 0) > 3 && (
        <Badge variant="outline" className="text-xs">
          +{(ttps?.length ?? 0) - 3}
        </Badge>
      )}
    </div>
  );
}
