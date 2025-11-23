-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "secondaryColor" TEXT;

-- CreateTable
CREATE TABLE "OwnershipTransferConfirmation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "workspaceId" TEXT NOT NULL,
    "currentOwnerId" TEXT NOT NULL,
    "newOwnerId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "OwnershipTransferConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnershipTransferConfirmation_token_key" ON "OwnershipTransferConfirmation"("token");

-- CreateIndex
CREATE INDEX "OwnershipTransferConfirmation_token_idx" ON "OwnershipTransferConfirmation"("token");

-- CreateIndex
CREATE INDEX "OwnershipTransferConfirmation_workspaceId_idx" ON "OwnershipTransferConfirmation"("workspaceId");

-- CreateIndex
CREATE INDEX "OwnershipTransferConfirmation_newOwnerId_idx" ON "OwnershipTransferConfirmation"("newOwnerId");
