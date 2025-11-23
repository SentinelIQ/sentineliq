/**
 * Storage Quota Display Component
 * Shows storage usage with progress bar and upgrade prompt
 */

import { useQuery } from 'wasp/client/operations';
import { getStorageStats } from 'wasp/client/operations';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { HardDrive, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StorageQuotaProps {
  workspaceId: string;
  showUpgradeLink?: boolean;
}

export function StorageQuota({ workspaceId, showUpgradeLink = true }: StorageQuotaProps) {
  const { data: stats, isLoading, error } = useQuery(getStorageStats, { workspaceId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Failed to load storage information</p>
        </CardContent>
      </Card>
    );
  }

  const { used, quota, usagePercent } = stats;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 95;

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <Card className={cn(isAtLimit && 'border-red-300 bg-red-50/50')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className={cn('h-5 w-5', isAtLimit && 'text-red-500')} />
          Storage
        </CardTitle>
        <CardDescription>
          {formatBytes(used)} of {formatBytes(quota)} used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={usagePercent} 
            className={cn(
              'h-3',
              isAtLimit && '[&>*]:bg-red-500',
              isNearLimit && !isAtLimit && '[&>*]:bg-yellow-500'
            )}
          />
          <p className="text-sm text-gray-600">
            <span className={cn(
              'font-semibold',
              isAtLimit && 'text-red-600',
              isNearLimit && !isAtLimit && 'text-yellow-600'
            )}>
              {usagePercent}%
            </span> of your storage quota
          </p>
        </div>

        {/* Warning Messages */}
        {isAtLimit && (
          <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Storage quota exceeded
              </p>
              <p className="text-sm text-red-700 mt-1">
                You've reached your storage limit. Delete old files or upgrade your plan to continue uploading.
              </p>
            </div>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="flex items-start gap-2 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Running low on storage
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You're using {usagePercent}% of your storage. Consider upgrading your plan soon.
              </p>
            </div>
          </div>
        )}

        {/* Upgrade Link */}
        {showUpgradeLink && (isNearLimit || isAtLimit) && (
          <div className="pt-2">
            <a
              href="/workspace/settings"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Upgrade your plan →
            </a>
          </div>
        )}

        {/* Storage Breakdown (optional future enhancement) */}
        {/*
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs font-medium text-gray-600 uppercase">Breakdown</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Files</span>
              <span className="font-medium">{formatBytes(filesSize)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Images</span>
              <span className="font-medium">{formatBytes(imagesSize)}</span>
            </div>
          </div>
        </div>
        */}
      </CardContent>
    </Card>
  );
}

/**
 * Compact storage usage indicator for navbar/header
 */
export function StorageQuotaCompact({ workspaceId }: { workspaceId: string }) {
  const { data: stats } = useQuery(getStorageStats, { workspaceId });

  if (!stats) return null;

  const { used, quota, usagePercent } = stats;
  const isNearLimit = usagePercent >= 80;

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border',
      isNearLimit ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
    )}>
      <HardDrive className={cn('h-4 w-4', isNearLimit && 'text-yellow-600')} />
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          {formatBytes(used)} / {formatBytes(quota)}
        </span>
        {isNearLimit && (
          <span className="text-xs font-medium text-yellow-700">
            ({usagePercent}%)
          </span>
        )}
      </div>
    </div>
  );
}
