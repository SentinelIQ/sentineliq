import { randomBytes } from 'crypto';
import type { User, RefreshToken } from 'wasp/entities';
import { HttpError } from 'wasp/server';

type Context = any;

const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MAX_REFRESH_TOKENS_PER_USER = 5; // Limit number of active refresh tokens

/**
 * Generate a cryptographically secure refresh token
 */
export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

/**
 * Create a new refresh token for a user
 */
export async function createRefreshToken(
  userId: string,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  context: Context
): Promise<RefreshToken> {
  const token = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Clean up old expired tokens
  await context.entities.RefreshToken.deleteMany({
    where: {
      userId,
      expiresAt: { lt: new Date() },
    },
  });

  // Limit number of active refresh tokens per user
  const activeTokens = await context.entities.RefreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'asc' },
  });

  // If user has too many tokens, revoke the oldest ones
  if (activeTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
    const tokensToRevoke = activeTokens.slice(0, activeTokens.length - MAX_REFRESH_TOKENS_PER_USER + 1);
    await context.entities.RefreshToken.updateMany({
      where: {
        id: { in: tokensToRevoke.map((t: any) => t.id) },
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  // Create new refresh token
  return await context.entities.RefreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Validate and rotate a refresh token
 */
export async function validateAndRotateRefreshToken(
  token: string,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  context: Context
): Promise<{ user: User; newRefreshToken: RefreshToken }> {
  const refreshToken = await context.entities.RefreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken) {
    throw new HttpError(401, 'Invalid refresh token');
  }

  if (refreshToken.isRevoked) {
    throw new HttpError(401, 'Refresh token has been revoked');
  }

  if (refreshToken.expiresAt < new Date()) {
    throw new HttpError(401, 'Refresh token has expired');
  }

  // Check if token is being reused (possible security breach)
  if (refreshToken.usageCount > 0) {
    // Token rotation: revoke the old token family on reuse
    await context.entities.RefreshToken.updateMany({
      where: {
        userId: refreshToken.userId,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    throw new HttpError(401, 'Refresh token reuse detected - all tokens revoked');
  }

  // Mark old token as used (will be deleted when creating new one)
  await context.entities.RefreshToken.update({
    where: { id: refreshToken.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  // Create new refresh token (rotation)
  const newRefreshToken = await createRefreshToken(
    refreshToken.userId,
    ipAddress,
    userAgent,
    context
  );

  return {
    user: refreshToken.user,
    newRefreshToken,
  };
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(
  token: string,
  context: Context
): Promise<void> {
  await context.entities.RefreshToken.updateMany({
    where: { token },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(
  userId: string,
  context: Context
): Promise<void> {
  await context.entities.RefreshToken.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Clean up expired refresh tokens (should be run as a scheduled job)
 */
export async function cleanupExpiredRefreshTokens(context: Context): Promise<number> {
  const result = await context.entities.RefreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isRevoked: true,
          revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
        },
      ],
    },
  });

  return result.count;
}
