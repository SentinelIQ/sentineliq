import Redis from 'ioredis';
import type { BrandMonitor } from 'wasp/entities';
import type { CrawlTaskPayload } from '../types';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const QUEUE_NAME = 'sentinel_tasks';

export const enqueueMonitoringTask = async (monitor: BrandMonitor): Promise<void> => {
  const payload: CrawlTaskPayload = {
    type: 'CRAWL_MONITOR',
    monitorId: monitor.id,
    brandId: monitor.brandId,
    workspaceId: monitor.workspaceId,
    
    // Search configuration
    searchTerms: monitor.searchTerms,
    excludeTerms: monitor.excludeTerms,
    keywords: monitor.keywords,
    
    // Geographic configuration
    targetRegions: monitor.targetRegions,
    targetLanguages: monitor.targetLanguages,
    
    // Detection rules
    yaraRules: monitor.yaraRules || '',
    regexPatterns: monitor.regexPatterns,
    domainPatterns: monitor.domainPatterns,
    
    // Criteria
    confidenceThreshold: monitor.confidenceThreshold,
    matchingRulesNeeded: monitor.matchingRulesNeeded,
    
    // Execution options
    enableScreenshots: monitor.enableScreenshots,
    enableOCR: monitor.enableOCR,
    deepAnalysis: monitor.deepAnalysis,
    
    // Metadata
    createdAt: new Date().toISOString(),
    source: monitor.source,
  };

  try {
    await redis.lpush(QUEUE_NAME, JSON.stringify(payload));
    console.log(`✅ Enqueued monitoring task for monitor ${monitor.id}`);
  } catch (error) {
    console.error(`❌ Failed to enqueue monitoring task:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to enqueue monitoring task: ${errorMessage}`);
  }
};

export const enqueueBulkMonitoringTasks = async (monitors: BrandMonitor[]): Promise<void> => {
  const pipeline = redis.pipeline();
  
  for (const monitor of monitors) {
    const payload: CrawlTaskPayload = {
      type: 'CRAWL_MONITOR',
      monitorId: monitor.id,
      brandId: monitor.brandId,
      workspaceId: monitor.workspaceId,
      searchTerms: monitor.searchTerms,
      excludeTerms: monitor.excludeTerms,
      keywords: monitor.keywords,
      targetRegions: monitor.targetRegions,
      targetLanguages: monitor.targetLanguages,
      yaraRules: monitor.yaraRules || '',
      regexPatterns: monitor.regexPatterns,
      domainPatterns: monitor.domainPatterns,
      confidenceThreshold: monitor.confidenceThreshold,
      matchingRulesNeeded: monitor.matchingRulesNeeded,
      enableScreenshots: monitor.enableScreenshots,
      enableOCR: monitor.enableOCR,
      deepAnalysis: monitor.deepAnalysis,
      createdAt: new Date().toISOString(),
      source: monitor.source,
    };
    
    pipeline.lpush(QUEUE_NAME, JSON.stringify(payload));
  }

  try {
    await pipeline.exec();
    console.log(`✅ Enqueued ${monitors.length} monitoring tasks`);
  } catch (error) {
    console.error(`❌ Failed to enqueue bulk tasks:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to enqueue bulk tasks: ${errorMessage}`);
  }
};

export const getQueueStats = async (): Promise<{
  queueLength: number;
  queueName: string;
}> => {
  try {
    const length = await redis.llen(QUEUE_NAME);
    return {
      queueLength: length,
      queueName: QUEUE_NAME,
    };
  } catch (error) {
    console.error(`❌ Failed to get queue stats:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get queue stats: ${errorMessage}`);
  }
};

export const clearQueue = async (): Promise<number> => {
  try {
    const length = await redis.llen(QUEUE_NAME);
    if (length > 0) {
      await redis.del(QUEUE_NAME);
    }
    console.log(`✅ Cleared ${length} tasks from queue`);
    return length;
  } catch (error) {
    console.error(`❌ Failed to clear queue:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to clear queue: ${errorMessage}`);
  }
};

// Health check for Redis connection
export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error(`❌ Redis connection failed:`, error);
    return false;
  }
};

// Graceful shutdown
export const closeRedisConnection = async (): Promise<void> => {
  await redis.quit();
  console.log('✅ Redis connection closed');
};
