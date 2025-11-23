/**
 * Read Replica Configuration
 * 
 * Setup and management of PostgreSQL read replicas for:
 * - Load distribution
 * - High availability
 * - Performance optimization
 */

import { PrismaClient } from '@prisma/client';

/**
 * Read Replica Pool Manager
 * 
 * Manages connections to read replicas and load balancing
 */
export class ReadReplicaManager {
  private primaryClient: PrismaClient;
  private replicaClients: PrismaClient[] = [];
  private currentReplicaIndex = 0;

  constructor() {
    // Primary database connection (for writes)
    this.primaryClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Read replica connections
    this.initializeReplicas();
  }

  /**
   * Initialize read replica connections
   */
  private initializeReplicas(): void {
    const replicaUrls = this.getReplicaUrls();
    
    for (const url of replicaUrls) {
      const replica = new PrismaClient({
        datasources: {
          db: { url },
        },
      });
      this.replicaClients.push(replica);
    }

    console.log(`[ReadReplica] Initialized ${this.replicaClients.length} read replicas`);
  }

  /**
   * Get read replica URLs from environment
   */
  private getReplicaUrls(): string[] {
    const urls: string[] = [];
    
    // Support multiple replicas via READ_REPLICA_URL_1, READ_REPLICA_URL_2, etc.
    let i = 1;
    while (true) {
      const url = process.env[`READ_REPLICA_URL_${i}`];
      if (!url) break;
      urls.push(url);
      i++;
    }

    // Fallback to single READ_REPLICA_URL
    if (urls.length === 0 && process.env.READ_REPLICA_URL) {
      urls.push(process.env.READ_REPLICA_URL);
    }

    return urls;
  }

  /**
   * Get primary client (for writes)
   */
  getPrimaryClient(): PrismaClient {
    return this.primaryClient;
  }

  /**
   * Get read replica client (round-robin load balancing)
   */
  getReplicaClient(): PrismaClient {
    if (this.replicaClients.length === 0) {
      // Fallback to primary if no replicas configured
      return this.primaryClient;
    }

    const client = this.replicaClients[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicaClients.length;
    
    return client;
  }

  /**
   * Execute read query with automatic replica selection
   */
  async read<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = this.getReplicaClient();
    return operation(client);
  }

  /**
   * Execute write query on primary
   */
  async write<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    return operation(this.primaryClient);
  }

  /**
   * Check replica health
   */
  async checkReplicaHealth(): Promise<{
    healthy: number;
    unhealthy: number;
    replicas: Array<{
      index: number;
      healthy: boolean;
      lag?: number;
      error?: string;
    }>;
  }> {
    const results = await Promise.all(
      this.replicaClients.map(async (client, index) => {
        try {
          // Test connection
          await client.$queryRaw`SELECT 1`;
          
          // Check replication lag (if replica info available)
          const lag = await this.checkReplicationLag(client);

          return {
            index,
            healthy: true,
            lag,
          };
        } catch (error) {
          return {
            index,
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const healthy = results.filter(r => r.healthy).length;
    const unhealthy = results.filter(r => !r.healthy).length;

    return {
      healthy,
      unhealthy,
      replicas: results,
    };
  }

  /**
   * Check replication lag for a replica
   */
  private async checkReplicationLag(client: PrismaClient): Promise<number | undefined> {
    try {
      // Query replication stats
      const result = await client.$queryRaw<Array<{ lag: number }>>`
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag
      `;

      return result[0]?.lag;
    } catch (error) {
      // This query only works on replicas, primary will error
      return undefined;
    }
  }

  /**
   * Disconnect all clients
   */
  async disconnect(): Promise<void> {
    await Promise.all([
      this.primaryClient.$disconnect(),
      ...this.replicaClients.map(c => c.$disconnect()),
    ]);
  }
}

// Singleton instance
let replicaManagerInstance: ReadReplicaManager | null = null;

export function getReplicaManager(): ReadReplicaManager {
  if (!replicaManagerInstance) {
    replicaManagerInstance = new ReadReplicaManager();
  }
  return replicaManagerInstance;
}

/**
 * Helper function to execute read queries on replicas
 */
export async function readFromReplica<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const manager = getReplicaManager();
  return manager.read(operation);
}

/**
 * Helper function to execute write queries on primary
 */
export async function writeToPrimary<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const manager = getReplicaManager();
  return manager.write(operation);
}
