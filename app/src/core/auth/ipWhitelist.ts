import type { Workspace } from 'wasp/entities';
import { HttpError } from 'wasp/server';

/**
 * Check if an IP address is in CIDR notation
 */
function isCIDR(ip: string): boolean {
  return ip.includes('/');
}

/**
 * Check if an IP address matches a CIDR range
 * Supports both IPv4 and simple wildcard patterns
 */
function ipMatchesCIDR(ip: string, cidr: string): boolean {
  if (!isCIDR(cidr)) {
    // Simple exact match or wildcard
    if (cidr.includes('*')) {
      const pattern = cidr.replace(/\./g, '\\.').replace(/\*/g, '\\d+');
      return new RegExp(`^${pattern}$`).test(ip);
    }
    return ip === cidr;
  }

  // Parse CIDR notation (simplified for IPv4)
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Extract client IP from request
 * Handles various proxy headers
 */
export function getClientIp(req: any): string | undefined {
  // Check various headers in order of preference
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
    return ips[0];
  }

  return (
    req.headers['x-real-ip'] ||
    req.headers['x-client-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    undefined
  );
}

/**
 * Validate IP address format
 */
export function isValidIPAddress(ip: string): boolean {
  // IPv4 validation (basic)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 validation (basic)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Validate CIDR notation
 */
export function isValidCIDR(cidr: string): boolean {
  if (!cidr.includes('/')) {
    return false;
  }

  const [ip, bits] = cidr.split('/');
  
  if (!isValidIPAddress(ip)) {
    return false;
  }

  const bitsNum = parseInt(bits);
  return bitsNum >= 0 && bitsNum <= 32;
}

/**
 * Validate IP whitelist entry (supports IP, CIDR, and wildcards)
 */
export function isValidWhitelistEntry(entry: string): boolean {
  // Support wildcards (e.g., 192.168.1.*)
  if (entry.includes('*')) {
    const pattern = entry.replace(/\*/g, '\\d+');
    try {
      new RegExp(`^${pattern}$`);
      return true;
    } catch {
      return false;
    }
  }

  // Support CIDR notation
  if (entry.includes('/')) {
    return isValidCIDR(entry);
  }

  // Support regular IP addresses
  return isValidIPAddress(entry);
}

/**
 * Check if an IP is whitelisted for a workspace
 */
export function isIpWhitelisted(
  ip: string | undefined,
  workspace: Workspace
): boolean {
  // If IP whitelisting is not enabled, allow all
  if (!workspace.ipWhitelistEnabled) {
    return true;
  }

  // If no IP provided, deny access
  if (!ip) {
    return false;
  }

  // If whitelist is empty, deny access (fail-secure)
  if (!workspace.ipWhitelist || workspace.ipWhitelist.length === 0) {
    return false;
  }

  // Check if IP matches any entry in whitelist
  return workspace.ipWhitelist.some((entry) => {
    try {
      return ipMatchesCIDR(ip, entry);
    } catch (error) {
      console.error(`Invalid whitelist entry: ${entry}`, error);
      return false;
    }
  });
}

/**
 * Express middleware to enforce IP whitelisting for workspace routes
 */
export function createIpWhitelistMiddleware(getWorkspace: (req: any) => Promise<Workspace | null>) {
  return async (req: any, res: any, next: any) => {
    try {
      const workspace = await getWorkspace(req);
      
      if (!workspace) {
        return next(); // Let other middleware handle this
      }

      const clientIp = getClientIp(req);
      
      if (!isIpWhitelisted(clientIp, workspace)) {
        throw new HttpError(403, 'Access denied: IP address not whitelisted for this workspace');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Normalize IP address (remove IPv6 prefix if present)
 */
export function normalizeIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  
  // Remove IPv6 prefix for IPv4-mapped addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}
