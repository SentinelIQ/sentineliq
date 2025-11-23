/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `datePaid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProcessorUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionPlan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "ContactFormMessage" DROP CONSTRAINT "ContactFormMessage_userId_fkey";

-- DropIndex
DROP INDEX "User_paymentProcessorUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits",
DROP COLUMN "datePaid",
DROP COLUMN "paymentProcessorUserId",
DROP COLUMN "subscriptionPlan",
DROP COLUMN "subscriptionStatus",
ADD COLUMN     "currentWorkspaceId" TEXT,
ADD COLUMN     "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "paymentProcessorUserId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionPlan" TEXT,
    "datePaid" TIMESTAMP(3),
    "credits" INTEGER NOT NULL DEFAULT 3,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_paymentProcessorUserId_key" ON "Workspace"("paymentProcessorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentWorkspaceId_fkey" FOREIGN KEY ("currentWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactFormMessage" ADD CONSTRAINT "ContactFormMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
