import React from 'react';
import { Skeleton } from './skeleton';

/**
 * Skeleton loader for list pages
 */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="p-5 border rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for card grids
 */
export const CardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="border rounded-lg p-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for stats cards
 */
export const StatsCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="border rounded-lg p-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-16" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for table
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 10, 
  cols = 5 
}) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3 border-b">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for detail page
 */
export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="border rounded-lg p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
