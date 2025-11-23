/**
 * Hook: useTTPs
 * 
 * Custom React hook for fetching TTPs associated with any polymorphic resource
 */

import { useQuery } from 'wasp/client/operations';
import { getTTPs } from 'wasp/client/operations';
import type { TTP } from 'wasp/entities';

export type SupportedResourceType = 'CASE' | 'ALERT' | 'INCIDENT' | 'BRAND_INFRINGEMENT' | 'TIMELINE_EVENT' | 'ECLIPSE' | string;

export interface UseTTPsProps {
  resourceId: string;
  resourceType: SupportedResourceType;
  enabled?: boolean;
}

export interface UseTTPsResult {
  data: TTP[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch TTPs for a polymorphic resource
 * 
 * @example
 * ```tsx
 * // Works with any resource type
 * const { data: ttps, isLoading } = useTTPs({
 *   resourceId: caseId,
 *   resourceType: 'CASE',
 * });
 * 
 * // Also works with AEGIS TimelineEvent
 * const { data: ttps } = useTTPs({
 *   resourceId: timelineEventId,
 *   resourceType: 'TIMELINE_EVENT',
 * });
 * 
 * // And Eclipse
 * const { data: ttps } = useTTPs({
 *   resourceId: eclipseId,
 *   resourceType: 'ECLIPSE',
 * });
 * ```
 */
export function useTTPs({
  resourceId,
  resourceType,
  enabled = true,
}: UseTTPsProps): UseTTPsResult {
  const { data, isLoading, error, refetch } = useQuery(
    enabled ? (getTTPs as any) : (null as any),
    {
      resourceId,
      resourceType,
    } as any,
    {
      enabled,
    }
  );

  return {
    data: data as TTP[] | undefined,
    isLoading,
    error: error as Error | null,
    refetch: () => refetch(),
  };
}
