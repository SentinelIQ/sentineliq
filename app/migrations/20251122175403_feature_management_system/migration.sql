-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isGloballyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "availableInFree" BOOLEAN NOT NULL DEFAULT false,
    "availableInHobby" BOOLEAN NOT NULL DEFAULT true,
    "availableInPro" BOOLEAN NOT NULL DEFAULT true,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "deprecationDate" TIMESTAMP(3),
    "removalDate" TIMESTAMP(3),

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceFeatureOverride" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "featureFlagId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL,
    "enabledById" TEXT,
    "enabledAt" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "WorkspaceFeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_module_isGloballyEnabled_idx" ON "FeatureFlag"("module", "isGloballyEnabled");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "WorkspaceFeatureOverride_workspaceId_isEnabled_idx" ON "WorkspaceFeatureOverride"("workspaceId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceFeatureOverride_workspaceId_featureFlagId_key" ON "WorkspaceFeatureOverride"("workspaceId", "featureFlagId");

-- AddForeignKey
ALTER TABLE "WorkspaceFeatureOverride" ADD CONSTRAINT "WorkspaceFeatureOverride_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceFeatureOverride" ADD CONSTRAINT "WorkspaceFeatureOverride_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
