/**
 * Session Timeout Middleware
 * 
 * Validates session timeout based on workspace configuration.
 * Each workspace can configure its own session timeout for enhanced security.
 * 
 * Features:
 * - Workspace-specific session timeout
 * - Automatic session invalidation after inactivity
 * - Activity tracking per session
 * - Compatible with Wasp auth system
 */

import type { Request, Response, NextFunction } from 'express';
import type { User } from 'wasp/entities';
import { prisma } from 'wasp/server';

interface SessionData {
  lastActivity: number;
  workspaceId?: string;
}

// In-memory session tracking (use Redis in production for multi-instance deployments)
const sessionStore = new Map<string, SessionData>();

/**
 * Get session timeout for a workspace (in seconds)
 * Defaults to 30 minutes (1800 seconds) if not configured
 */
async function getWorkspaceSessionTimeout(workspaceId: string): Promise<number> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { sessionTimeout: true },
    });
    
    return workspace?.sessionTimeout || 1800; // Default: 30 minutes
  } catch (error) {
    console.error('[Session] Error fetching workspace timeout:', error);
    return 1800; // Fallback to default
  }
}

/**
 * Extract session ID from request
 * Uses Wasp's session cookie
 */
function getSessionId(req: Request): string | null {
  // Wasp uses 'sessionId' cookie by default
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  return sessionId || null;
}

/**
 * Extract user from request context
 */
function getUser(req: Request): User | null {
  // Wasp injects user into request context after auth middleware
  return (req as any).user || null;
}

/**
 * Session timeout middleware
 * 
 * Checks if session has expired based on workspace configuration.
 * If expired, returns 401 Unauthorized.
 */
export async function sessionTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = getSessionId(req);
  const user = getUser(req);
  
  // Skip if no session or no user (public routes)
  if (!sessionId || !user) {
    return next();
  }
  
  // Skip for auth-related routes
  if (req.path.startsWith('/auth') || req.path.startsWith('/api/auth')) {
    return next();
  }
  
  try {
    // Get current workspace ID from user or request
    const workspaceId = (user as any).currentWorkspaceId || req.headers['x-workspace-id'];
    
    if (!workspaceId) {
      // No workspace context, use default timeout
      return handleSessionActivity(sessionId, null, next);
    }
    
    // Get workspace-specific timeout
    const timeoutSeconds = await getWorkspaceSessionTimeout(workspaceId as string);
    
    // Check session activity
    const sessionData = sessionStore.get(sessionId);
    const now = Date.now();
    
    if (sessionData) {
      const inactiveTime = (now - sessionData.lastActivity) / 1000; // Convert to seconds
      
      if (inactiveTime > timeoutSeconds) {
        // Session expired
        console.log(`[Session] Session expired for user ${user.id} (inactive for ${Math.floor(inactiveTime)}s, timeout: ${timeoutSeconds}s)`);
        
        // Clear session from store
        sessionStore.delete(sessionId);
        
        // Return 401 Unauthorized
        return res.status(401).json({
          error: 'Session expired due to inactivity',
          code: 'SESSION_TIMEOUT',
          timeoutSeconds,
        });
      }
    }
    
    // Update last activity
    sessionStore.set(sessionId, {
      lastActivity: now,
      workspaceId: workspaceId as string,
    });
    
    next();
  } catch (error) {
    console.error('[Session] Error in session timeout middleware:', error);
    // Don't block request on error
    next();
  }
}

/**
 * Handle session activity for sessions without workspace context
 */
function handleSessionActivity(sessionId: string, workspaceId: string | null, next: NextFunction) {
  const now = Date.now();
  const sessionData = sessionStore.get(sessionId);
  const defaultTimeout = 1800; // 30 minutes
  
  if (sessionData) {
    const inactiveTime = (now - sessionData.lastActivity) / 1000;
    
    if (inactiveTime > defaultTimeout) {
      sessionStore.delete(sessionId);
      // Let it pass for now, Wasp's auth will handle it
    }
  }
  
  sessionStore.set(sessionId, {
    lastActivity: now,
    workspaceId: workspaceId || undefined,
  });
  
  next();
}

/**
 * Clear session from store (call on logout)
 */
export function clearSession(sessionId: string) {
  sessionStore.delete(sessionId);
  console.log(`[Session] Session cleared: ${sessionId}`);
}

/**
 * Get active session count
 */
export function getActiveSessionCount(): number {
  return sessionStore.size;
}

/**
 * Clean up expired sessions (call periodically via cron job)
 */
export function cleanupExpiredSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours max
  let cleaned = 0;
  
  for (const [sessionId, data] of sessionStore.entries()) {
    if (now - data.lastActivity > maxAge) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Session] Cleaned up ${cleaned} expired sessions`);
  }
  
  return cleaned;
}

/**
 * Initialize session timeout middleware
 * Should be called after auth middleware in server setup
 */
export function initializeSessionTimeout(app: any) {
  app.use(sessionTimeoutMiddleware);
  
  // Setup periodic cleanup (every hour)
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
  
  console.log('✅ Session timeout middleware initialized');
}
