import { HttpError } from 'wasp/server';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';

/**
 * 2FA - Two-Factor Authentication utilities
 * Using TOTP (Time-based One-Time Password) algorithm
 */

/**
 * Generate a secret key for 2FA using speakeasy
 */
export function generateTwoFactorSecret(): string {
  const secret = speakeasy.generateSecret({
    length: 32,
    name: 'SentinelIQ',
    issuer: 'SentinelIQ',
  });
  return secret.base32;
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify TOTP code using speakeasy
 */
export function verifyTOTP(secret: string, token: string): boolean {
  if (!token || token.length !== 6) {
    return false;
  }
  
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after (60 seconds grace period)
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Verify backup code
 */
export function verifyBackupCode(backupCodes: string[], code: string): boolean {
  return backupCodes.includes(code.toUpperCase());
}

/**
 * Remove used backup code
 */
export function removeBackupCode(backupCodes: string[], usedCode: string): string[] {
  return backupCodes.filter(code => code !== usedCode.toUpperCase());
}

/**
 * Generate QR code data for authenticator apps
 */
export function generateQRCodeData(email: string, secret: string): string {
  const issuer = 'SentinelIQ';
  const otpauthUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
  return otpauthUrl;
}

/**
 * Account lockout utilities
 */
export const ACCOUNT_LOCKOUT = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};

export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

export function calculateLockoutTime(): Date {
  return new Date(Date.now() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MS);
}

export function shouldLockAccount(loginAttempts: number): boolean {
  return loginAttempts >= ACCOUNT_LOCKOUT.MAX_ATTEMPTS;
}
