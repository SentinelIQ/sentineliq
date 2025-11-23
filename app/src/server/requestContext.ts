/**
 * Extract IP address from request context
 * Checks common headers for proxied requests (X-Forwarded-For, X-Real-IP)
 */
export function getClientIp(request: any): string | undefined {
  if (!request) return undefined;

  // Check X-Forwarded-For header (common with proxies/load balancers)
  const xForwardedFor = request.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = xForwardedFor.split(',').map((ip: string) => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Check X-Real-IP header (common with nginx)
  const xRealIp = request.headers?.['x-real-ip'];
  if (xRealIp) return xRealIp;

  // Check CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = request.headers?.['cf-connecting-ip'];
  if (cfConnectingIp) return cfConnectingIp;

  // Fallback to direct connection IP
  const remoteAddress = request.socket?.remoteAddress || request.connection?.remoteAddress;
  if (remoteAddress) {
    // Remove IPv6 prefix if present
    return remoteAddress.replace(/^::ffff:/, '');
  }

  return undefined;
}

/**
 * Extract user agent from request context
 */
export function getUserAgent(request: any): string | undefined {
  if (!request) return undefined;
  return request.headers?.['user-agent'];
}

/**
 * Extract request context for audit logging
 */
export function extractRequestContext(context: any): {
  ipAddress?: string;
  userAgent?: string;
} {
  const request = context?.req || context?.request;
  
  return {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  };
}
