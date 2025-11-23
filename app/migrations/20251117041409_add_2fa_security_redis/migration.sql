-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "twoFactorBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "appliedCoupon" TEXT,
ADD COLUMN     "couponDiscountPercent" INTEGER,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialUsed" BOOLEAN NOT NULL DEFAULT false;
