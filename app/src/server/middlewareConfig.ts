/**
 * Express Middleware Configuration
 * 
 * Configures body parser limits and other Express middleware settings.
 * This is used by Wasp's middlewareConfigFn to apply request size limits.
 */

import type { Application } from 'express';
import express from 'express';

/**
 * Configure request size limits middleware
 * 
 * Applies size limits to different content types to prevent DoS attacks
 * and memory exhaustion from large payloads.
 */
export function configureMiddleware(app: Application) {
  // JSON payload limit (10MB for most API requests)
  app.use(express.json({ 
    limit: '10mb',
    strict: true,
  }));

  // URL-encoded payload limit (10MB for form submissions)
  app.use(express.urlencoded({ 
    limit: '10mb',
    extended: true,
    parameterLimit: 10000,
  }));

  // Text payload limit (10MB for text uploads)
  app.use(express.text({ 
    limit: '10mb',
  }));

  // Raw payload limit (50MB for file uploads via multipart/form-data)
  // Note: File uploads are handled separately by multer in upload.ts
  app.use(express.raw({ 
    limit: '50mb',
    type: 'application/octet-stream',
  }));

  console.log('✅ Request size limits configured');
  console.log('   - JSON: 10MB');
  console.log('   - URL-encoded: 10MB');
  console.log('   - Text: 10MB');
  console.log('   - Raw/Files: 50MB');
}
