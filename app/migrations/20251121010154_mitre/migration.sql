/*
  Warnings:

  - You are about to drop the column `createdById` on the `TTP` table. All the data in the column will be lost.
  - Changed the type of `resourceType` on the `TTP` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "TTP" DROP CONSTRAINT "TTP_createdById_fkey";

-- DropForeignKey
ALTER TABLE "TTP" DROP CONSTRAINT "TTP_workspaceId_fkey";

-- DropIndex
DROP INDEX "TTP_workspaceId_resourceType_idx";

-- AlterTable
ALTER TABLE "TTP" DROP COLUMN "createdById",
ADD COLUMN     "userId" TEXT,
DROP COLUMN "resourceType",
ADD COLUMN     "resourceType" TEXT NOT NULL,
ALTER COLUMN "workspaceId" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropEnum
DROP TYPE "ResourceType";

-- CreateIndex
CREATE INDEX "TTP_resourceId_resourceType_idx" ON "TTP"("resourceId", "resourceType");

-- AddForeignKey
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
