-- Migration: MITRE ATT&CK TTP Polymorphic Association
-- Description: Transform TTP from Case-specific to generic resource linking
-- Date: November 20, 2025
-- Author: SentinelIQ Team

-- ============================================
-- PHASE 1: Add New Columns
-- ============================================

-- Add new polymorphic columns (nullable initially for safe migration)
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "resourceId" TEXT;
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "resourceType" TEXT;
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "confidence" INTEGER;
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "severity" TEXT;

-- ============================================
-- PHASE 2: Migrate Existing Data
-- ============================================

-- Migrate existing Case-based TTPs to new polymorphic structure
UPDATE "TTP" t
SET 
  "resourceId" = t."caseId",
  "resourceType" = 'CASE',
  "workspaceId" = (SELECT c."workspaceId" FROM "Case" c WHERE c."id" = t."caseId"),
  "createdById" = COALESCE(
    (SELECT c."investigatorId" FROM "Case" c WHERE c."id" = t."caseId"),
    (SELECT w."ownerId" FROM "Case" c JOIN "Workspace" w ON c."workspaceId" = w."id" WHERE c."id" = t."caseId")
  ),
  "updatedAt" = COALESCE(t."createdAt", CURRENT_TIMESTAMP)
WHERE "resourceId" IS NULL;

-- ============================================
-- PHASE 3: Validate Migration
-- ============================================

-- Check for any records with NULL values after migration
DO $$
DECLARE
  null_resource_id_count INTEGER;
  null_resource_type_count INTEGER;
  null_workspace_id_count INTEGER;
  null_created_by_id_count INTEGER;
  total_ttps INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_resource_id_count FROM "TTP" WHERE "resourceId" IS NULL;
  SELECT COUNT(*) INTO null_resource_type_count FROM "TTP" WHERE "resourceType" IS NULL;
  SELECT COUNT(*) INTO null_workspace_id_count FROM "TTP" WHERE "workspaceId" IS NULL;
  SELECT COUNT(*) INTO null_created_by_id_count FROM "TTP" WHERE "createdById" IS NULL;
  SELECT COUNT(*) INTO total_ttps FROM "TTP";
  
  RAISE NOTICE 'Migration Validation Results:';
  RAISE NOTICE '  Total TTPs: %', total_ttps;
  RAISE NOTICE '  NULL resourceId: %', null_resource_id_count;
  RAISE NOTICE '  NULL resourceType: %', null_resource_type_count;
  RAISE NOTICE '  NULL workspaceId: %', null_workspace_id_count;
  RAISE NOTICE '  NULL createdById: %', null_created_by_id_count;
  
  IF null_resource_id_count > 0 OR null_resource_type_count > 0 OR null_workspace_id_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: Found % records with NULL values', 
      (null_resource_id_count + null_resource_type_count + null_workspace_id_count);
  END IF;
  
  RAISE NOTICE '✅ Migration validation passed - all records migrated successfully';
END $$;

-- ============================================
-- PHASE 4: Create Enum Type
-- ============================================

-- Create ResourceType enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ResourceType') THEN
    CREATE TYPE "ResourceType" AS ENUM ('CASE', 'ALERT', 'INCIDENT', 'BRAND_INFRINGEMENT');
    RAISE NOTICE '✅ Created ResourceType enum';
  ELSE
    RAISE NOTICE 'ℹ️  ResourceType enum already exists';
  END IF;
END $$;

-- Convert resourceType column to enum
ALTER TABLE "TTP" ALTER COLUMN "resourceType" TYPE "ResourceType" USING "resourceType"::"ResourceType";

-- ============================================
-- PHASE 5: Add Constraints
-- ============================================

-- Make columns NOT NULL
ALTER TABLE "TTP" ALTER COLUMN "resourceId" SET NOT NULL;
ALTER TABLE "TTP" ALTER COLUMN "resourceType" SET NOT NULL;
ALTER TABLE "TTP" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "TTP" ALTER COLUMN "updatedAt" SET NOT NULL;

-- ============================================
-- PHASE 6: Create Indexes
-- ============================================

-- Create new performance indexes
CREATE INDEX IF NOT EXISTS "TTP_resourceId_resourceType_idx" 
  ON "TTP"("resourceId", "resourceType");

CREATE INDEX IF NOT EXISTS "TTP_workspaceId_resourceType_idx" 
  ON "TTP"("workspaceId", "resourceType");

-- Keep existing MITRE indexes
CREATE INDEX IF NOT EXISTS "TTP_tacticId_techniqueId_idx" 
  ON "TTP"("tacticId", "techniqueId");

-- ============================================
-- PHASE 7: Add Foreign Keys
-- ============================================

-- Add FK to Workspace (for multi-tenancy)
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_workspaceId_fkey" 
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Add FK to User (for audit trail)
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- ============================================
-- PHASE 8: Add Unique Constraint
-- ============================================

-- Prevent duplicate TTPs per resource
CREATE UNIQUE INDEX IF NOT EXISTS "TTP_unique_per_resource_idx" 
  ON "TTP"("resourceId", "resourceType", "techniqueId", COALESCE("subtechniqueId", ''));

-- ============================================
-- PHASE 9: Remove Old Constraints
-- ============================================

-- Drop old caseId index (if exists)
DROP INDEX IF EXISTS "TTP_caseId_idx";

-- Drop old FK constraint to Case
ALTER TABLE "TTP" DROP CONSTRAINT IF EXISTS "TTP_caseId_fkey";

-- ============================================
-- PHASE 10: Remove Old Column
-- ============================================

-- Drop the old caseId column (data already migrated)
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "caseId";

-- ============================================
-- PHASE 11: Final Verification
-- ============================================

DO $$
DECLARE
  case_ttps_count INTEGER;
  alert_ttps_count INTEGER;
  incident_ttps_count INTEGER;
  brand_ttps_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO case_ttps_count FROM "TTP" WHERE "resourceType" = 'CASE';
  SELECT COUNT(*) INTO alert_ttps_count FROM "TTP" WHERE "resourceType" = 'ALERT';
  SELECT COUNT(*) INTO incident_ttps_count FROM "TTP" WHERE "resourceType" = 'INCIDENT';
  SELECT COUNT(*) INTO brand_ttps_count FROM "TTP" WHERE "resourceType" = 'BRAND_INFRINGEMENT';
  SELECT COUNT(*) INTO total_count FROM "TTP";
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TTP Statistics by Resource Type:';
  RAISE NOTICE '  CASE:                %', case_ttps_count;
  RAISE NOTICE '  ALERT:               %', alert_ttps_count;
  RAISE NOTICE '  INCIDENT:            %', incident_ttps_count;
  RAISE NOTICE '  BRAND_INFRINGEMENT:  %', brand_ttps_count;
  RAISE NOTICE '  --------------------------------';
  RAISE NOTICE '  TOTAL:               %', total_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All TTPs migrated to polymorphic structure';
  RAISE NOTICE '✅ Old caseId column removed';
  RAISE NOTICE '✅ New indexes created';
  RAISE NOTICE '✅ Foreign keys established';
  RAISE NOTICE '';
END $$;
