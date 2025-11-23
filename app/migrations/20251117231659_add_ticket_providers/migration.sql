-- CreateEnum
CREATE TYPE "TicketProviderType" AS ENUM ('JIRA', 'SERVICENOW', 'AZURE_DEVOPS');

-- CreateTable
CREATE TABLE "TicketProvider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" "TicketProviderType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,

    CONSTRAINT "TicketProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketProvider_workspaceId_provider_key" ON "TicketProvider"("workspaceId", "provider");

-- AddForeignKey
ALTER TABLE "TicketProvider" ADD CONSTRAINT "TicketProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
