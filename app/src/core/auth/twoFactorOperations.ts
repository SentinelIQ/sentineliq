import { HttpError } from 'wasp/server';
import {
  generateTwoFactorSecret,
  generateBackupCodes as generateBackupCodesUtil,
  generateQRCodeData,
  verifyTOTP,
  verifyBackupCode,
  removeBackupCode,
} from './twoFactor';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../../server/validation';

const verify2FASchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

const disable2FASchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

/**
 * Enable 2FA for user account
 * Returns secret and QR code data for authenticator app
 */
export const enable2FA = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.twoFactorEnabled) {
    throw new HttpError(400, '2FA is already enabled');
  }

  const secret = generateTwoFactorSecret();
  const backupCodes = generateBackupCodesUtil();
  const qrCodeData = generateQRCodeData(user.email || user.username || '', secret);

  // Store secret temporarily (will be confirmed after verification)
  await context.entities.User.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
      // Don't enable yet - wait for verification
    },
  });

  return {
    secret,
    qrCodeData,
    backupCodes,
  };
};

/**
 * Verify and activate 2FA
 */
export const verify2FA = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { token } = ensureArgsSchemaOrThrowHttpError(verify2FASchema, rawArgs);

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.twoFactorSecret) {
    throw new HttpError(400, '2FA setup not initiated. Call enable2FA first.');
  }

  // Verify the token
  const isValid = verifyTOTP(user.twoFactorSecret, token);

  if (!isValid) {
    throw new HttpError(400, 'Invalid verification code');
  }

  // Activate 2FA
  await context.entities.User.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
    },
  });

  return true;
};

/**
 * Disable 2FA
 */
export const disable2FA = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { token } = ensureArgsSchemaOrThrowHttpError(disable2FASchema, rawArgs);

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new HttpError(400, '2FA is not enabled');
  }

  // Verify token or backup code
  const isValidToken = verifyTOTP(user.twoFactorSecret || '', token);
  const isValidBackup = verifyBackupCode(user.twoFactorBackupCodes, token);

  if (!isValidToken && !isValidBackup) {
    throw new HttpError(400, 'Invalid verification code');
  }

  // Disable 2FA
  await context.entities.User.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  return true;
};

/**
 * Regenerate backup codes
 */
export const generateNew2FABackupCodes = async (rawArgs: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { token } = ensureArgsSchemaOrThrowHttpError(verify2FASchema, rawArgs);

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new HttpError(400, '2FA is not enabled');
  }

  // Verify token
  const isValid = verifyTOTP(user.twoFactorSecret || '', token);

  if (!isValid) {
    throw new HttpError(400, 'Invalid verification code');
  }

  const newBackupCodes = generateBackupCodesUtil();

  await context.entities.User.update({
    where: { id: user.id },
    data: {
      twoFactorBackupCodes: newBackupCodes,
    },
  });

  return newBackupCodes;
};
