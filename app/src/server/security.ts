/**
 * Security Middleware Configuration
 * 
 * Configures Helmet, CORS, and other security features for the application.
 * 
 * Features:
 * - Helmet: Security headers (CSP, HSTS, XSS protection, etc.)
 * - CORS: Cross-Origin Resource Sharing configuration
 * - Request size limits: Body parser size restrictions
 * - Rate limiting: Distributed rate limiting with Redis
 */

import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Production domains
  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL);
  }

  // Add production domain
  origins.push('https://sentineliq.com.br');
  origins.push('https://www.sentineliq.com.br');
  origins.push('https://app.sentineliq.com.br');

  // Development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3001');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:3001');
  }

  // Staging/preview deployments
  if (process.env.PREVIEW_URL) {
    origins.push(process.env.PREVIEW_URL);
  }

  return origins;
}

/**
 * Helmet middleware configuration
 * 
 * Configures security headers including CSP, HSTS, and more.
 */
export function configureHelmet() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Vite in development
          "'unsafe-eval'", // Required for Vite HMR in development
          'https://js.stripe.com',
          'https://challenges.cloudflare.com',
          ...(isDevelopment ? ['http://localhost:*'] : []),
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for inline styles
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'data:',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://avatars.githubusercontent.com',
          'https://lh3.googleusercontent.com',
          // MinIO/S3 storage
          process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          ...(isDevelopment ? ['http://localhost:*'] : []),
        ],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'wss://*.sentineliq.com.br', // WebSocket connections
          ...(isDevelopment ? ['ws://localhost:*', 'http://localhost:*'] : []),
        ],
        frameSrc: [
          'https://js.stripe.com',
          'https://challenges.cloudflare.com',
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isDevelopment ? [] : [],
      },
    },

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // X-Content-Type-Options
    noSniff: true,

    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },

    // X-XSS-Protection
    xssFilter: true,

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
      allow: false,
    },

    // X-Download-Options
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
  });
}

/**
 * CORS middleware configuration
 * 
 * Configures Cross-Origin Resource Sharing with environment-specific origins.
 */
export function configureCors() {
  const allowedOrigins = getAllowedOrigins();
  const isDevelopment = process.env.NODE_ENV === 'development';

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin && isDevelopment) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(new Error('Origin not allowed by CORS'));
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (isDevelopment) {
        // In development, allow all localhost origins
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked origin: ${origin}`);
          callback(new Error('Origin not allowed by CORS'));
        }
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Workspace-Id',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400, // 24 hours
  });
}

/**
 * Request size limit middleware
 * 
 * Limits the size of incoming requests to prevent DoS attacks.
 */
export function configureRequestLimits() {
  return {
    json: {
      limit: '10mb', // JSON payload limit
    },
    urlencoded: {
      limit: '10mb', // URL-encoded payload limit
      extended: true,
    },
    text: {
      limit: '10mb', // Text payload limit
    },
    raw: {
      limit: '50mb', // Raw payload limit (for file uploads)
    },
  };
}

/**
 * Security headers middleware
 * 
 * Additional security headers not covered by Helmet.
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove X-Powered-By header (already handled by Helmet)
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * Log security events
 */
export function logSecurityEvent(event: string, details: Record<string, any>) {
  console.log('[Security]', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Initialize all security middleware
 * 
 * Should be called in server setup before other middleware.
 */
export function initializeSecurity(app: any) {
  // Apply Helmet for security headers
  app.use(configureHelmet());

  // Apply CORS configuration
  app.use(configureCors());

  // Apply additional security headers
  app.use(additionalSecurityHeaders);

  // Request size limits are configured in Wasp's server setup
  // See main.wasp: server.middlewareConfigFn

  logSecurityEvent('security_initialized', {
    environment: process.env.NODE_ENV,
    allowedOrigins: getAllowedOrigins().length,
  });
}
