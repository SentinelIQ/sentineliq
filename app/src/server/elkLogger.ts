/**
 * ELK Logger Integration
 * Sends structured logs to Logstash for aggregation in Elasticsearch
 */

import net from 'net';
import type { LogLevelType } from '../core/logs/levels';
import { createLogger } from '../core/logs/logger.js';

type LogLevel = LogLevelType;

// Simple console fallback for when logger is not available
function logToConsole(level: string, message: string, metadata?: any) {
  console.log(`[ELK-Logger] [${level}] ${message}`, metadata || '');
}

// ELK Configuration
const ELK_ENABLED = process.env.ELK_ENABLED === 'true';
const LOGSTASH_HOST = process.env.LOGSTASH_HOST || 'localhost';
const LOGSTASH_PORT = parseInt(process.env.LOGSTASH_PORT || '5000', 10);
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Connection retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  component?: string;
  workspaceId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  environment: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  requestId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
}

class ELKLogger {
  private client: net.Socket | null = null;
  private connected: boolean = false;
  private retryCount: number = 0;
  private buffer: string[] = [];
  private maxBufferSize: number = 1000;

  constructor() {
    if (ELK_ENABLED) {
      this.connect();
    }
  }

  /**
   * Connect to Logstash
   */
  private connect(): void {
    try {
      this.client = new net.Socket();

      this.client.connect(LOGSTASH_PORT, LOGSTASH_HOST, () => {
        this.connected = true;
        this.retryCount = 0;
        logToConsole('INFO', 'Connected to Logstash', {
          host: LOGSTASH_HOST,
          port: LOGSTASH_PORT,
        });

        // Flush buffer
        this.flushBuffer();
      });

      this.client.on('error', (err) => {
        this.connected = false;
        logToConsole('ERROR', 'Logstash connection error', {
          error: err.message,
          retryCount: this.retryCount,
        });

        this.reconnect();
      });

      this.client.on('close', () => {
        this.connected = false;
        logToConsole('WARN', 'Logstash connection closed');
        this.reconnect();
      });
    } catch (error) {
      logToConsole('ERROR', 'Failed to initialize Logstash connection', { error });
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.retryCount >= MAX_RETRIES) {
      logToConsole('ERROR', 'Max reconnection attempts reached', {
        maxRetries: MAX_RETRIES,
      });
      return;
    }

    const delay = RETRY_DELAY * Math.pow(2, this.retryCount);
    this.retryCount++;

    setTimeout(() => {
      logToConsole('INFO', 'Attempting to reconnect to Logstash', {
        attempt: this.retryCount,
        delay,
      });
      this.connect();
    }, delay);
  }

  /**
   * Send log entry to Logstash
   */
  public send(entry: LogEntry): void {
    if (!ELK_ENABLED) {
      return;
    }

    try {
      const logEntry = {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
        environment: ENVIRONMENT,
      };

      const logString = JSON.stringify(logEntry) + '\n';

      if (this.connected && this.client) {
        this.client.write(logString, (err) => {
          if (err) {
            logToConsole('ERROR', 'Failed to write to Logstash', { error: err.message });
            this.addToBuffer(logString);
          }
        });
      } else {
        this.addToBuffer(logString);
      }
    } catch (error) {
      logToConsole('ERROR', 'Failed to send log entry', { error });
    }
  }

  /**
   * Add log to buffer when connection is unavailable
   */
  private addToBuffer(logString: string): void {
    if (this.buffer.length >= this.maxBufferSize) {
      // Remove oldest entry
      this.buffer.shift();
    }
    this.buffer.push(logString);
  }

  /**
   * Flush buffered logs
   */
  private flushBuffer(): void {
    if (this.buffer.length === 0) {
      return;
    }

    logToConsole('INFO', 'Flushing log buffer', { count: this.buffer.length });

    while (this.buffer.length > 0) {
      const logString = this.buffer.shift();
      if (logString && this.client) {
        this.client.write(logString);
      }
    }
  }

  /**
   * Close connection gracefully
   */
  public close(): void {
    if (this.client) {
      this.flushBuffer();
      this.client.end();
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * Health check
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get buffer size
   */
  public getBufferSize(): number {
    return this.buffer.length;
  }
}

// Singleton instance
const elkLogger = new ELKLogger();

// Graceful shutdown
process.on('SIGINT', () => {
  elkLogger.close();
});

process.on('SIGTERM', () => {
  elkLogger.close();
});

/**
 * Helper function to send logs to ELK
 */
export function sendToELK(
  level: LogLevel,
  component: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    environment: ENVIRONMENT,
    metadata,
  };

  // Extract common fields from metadata
  if (metadata) {
    if (metadata.workspaceId) entry.workspaceId = metadata.workspaceId;
    if (metadata.userId) entry.userId = metadata.userId;
    if (metadata.requestId) entry.requestId = metadata.requestId;
    if (metadata.ip) entry.ip = metadata.ip;
    if (metadata.userAgent) entry.userAgent = metadata.userAgent;
    if (metadata.duration) entry.duration = metadata.duration;
    
    // Extract error info
    if (metadata.error) {
      entry.error = {
        message: metadata.error.message || String(metadata.error),
        stack: metadata.error.stack,
        code: metadata.error.code,
      };
    }
  }

  elkLogger.send(entry);
}

/**
 * Get ELK logger instance for advanced usage
 */
export function getELKLogger(): ELKLogger {
  return elkLogger;
}

export default elkLogger;
