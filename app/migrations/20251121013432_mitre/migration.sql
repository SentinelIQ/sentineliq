/*
  Warnings:

  - Made the column `workspaceId` on table `TTP` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'TTP_LINKED';
ALTER TYPE "AuditAction" ADD VALUE 'TTP_UNLINKED';
ALTER TYPE "AuditAction" ADD VALUE 'TTP_OCCURRENCE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TTP_SYNCED';

-- DropForeignKey
ALTER TABLE "TTP" DROP CONSTRAINT "TTP_workspaceId_fkey";

-- AlterTable
ALTER TABLE "TTP" ADD COLUMN     "createdBy" TEXT,
ALTER COLUMN "workspaceId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "TTP_workspaceId_resourceId_resourceType_idx" ON "TTP"("workspaceId", "resourceId", "resourceType");

-- CreateIndex
CREATE INDEX "TTP_workspaceId_tacticId_techniqueId_idx" ON "TTP"("workspaceId", "tacticId", "techniqueId");

-- AddForeignKey
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
