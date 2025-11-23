export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;

export type LogLevelType = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// Priority order for log levels
export const LOG_LEVEL_PRIORITY: Record<LogLevelType, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// Color codes for console output
export const LOG_LEVEL_COLORS: Record<LogLevelType, string> = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  CRITICAL: '\x1b[35m', // Magenta
};

export const RESET_COLOR = '\x1b[0m';
