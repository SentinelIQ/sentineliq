-- ROLLBACK SCRIPT: MITRE ATT&CK TTP Polymorphic Association
-- Description: Revert TTP back to Case-specific FK model
-- WARNING: This will lose TTP associations for non-Case resources (ALERT, INCIDENT, BRAND_INFRINGEMENT)
-- Date: November 20, 2025

-- ============================================
-- PHASE 1: Add Back Old Column
-- ============================================

-- Re-add caseId column
ALTER TABLE "TTP" ADD COLUMN IF NOT EXISTS "caseId" TEXT;

-- ============================================
-- PHASE 2: Migrate Data Back
-- ============================================

-- Restore caseId from resourceId for CASE type
UPDATE "TTP"
SET "caseId" = "resourceId"
WHERE "resourceType" = 'CASE';

-- ============================================
-- PHASE 3: Validation
-- ============================================

DO $$
DECLARE
  null_case_id_count INTEGER;
  case_ttps_count INTEGER;
  non_case_ttps_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_case_id_count FROM "TTP" WHERE "caseId" IS NULL AND "resourceType" = 'CASE';
  SELECT COUNT(*) INTO case_ttps_count FROM "TTP" WHERE "resourceType" = 'CASE';
  SELECT COUNT(*) INTO non_case_ttps_count FROM "TTP" WHERE "resourceType" != 'CASE';
  
  RAISE NOTICE 'Rollback Validation:';
  RAISE NOTICE '  CASE TTPs migrated back: %', case_ttps_count;
  RAISE NOTICE '  CASE TTPs with NULL caseId: %', null_case_id_count;
  RAISE NOTICE '  ⚠️  Non-CASE TTPs (will be deleted): %', non_case_ttps_count;
  
  IF null_case_id_count > 0 THEN
    RAISE EXCEPTION 'Rollback validation failed: % CASE TTPs have NULL caseId', null_case_id_count;
  END IF;
END $$;

-- ============================================
-- PHASE 4: Delete Non-Case TTPs
-- ============================================

-- WARNING: This deletes TTPs associated with ALERT, INCIDENT, BRAND_INFRINGEMENT
DELETE FROM "TTP" WHERE "resourceType" != 'CASE';

-- ============================================
-- PHASE 5: Make caseId NOT NULL
-- ============================================

ALTER TABLE "TTP" ALTER COLUMN "caseId" SET NOT NULL;

-- ============================================
-- PHASE 6: Re-create Old Constraints
-- ============================================

-- Re-add FK to Case
ALTER TABLE "TTP" ADD CONSTRAINT "TTP_caseId_fkey" 
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Re-create caseId index
CREATE INDEX IF NOT EXISTS "TTP_caseId_idx" ON "TTP"("caseId");

-- ============================================
-- PHASE 7: Remove New Constraints
-- ============================================

-- Drop unique constraint on polymorphic fields
DROP INDEX IF EXISTS "TTP_unique_per_resource_idx";

-- Drop polymorphic indexes
DROP INDEX IF EXISTS "TTP_resourceId_resourceType_idx";
DROP INDEX IF EXISTS "TTP_workspaceId_resourceType_idx";

-- Drop new FKs
ALTER TABLE "TTP" DROP CONSTRAINT IF EXISTS "TTP_workspaceId_fkey";
ALTER TABLE "TTP" DROP CONSTRAINT IF EXISTS "TTP_createdById_fkey";

-- ============================================
-- PHASE 8: Remove New Columns
-- ============================================

ALTER TABLE "TTP" DROP COLUMN IF EXISTS "resourceId";
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "resourceType";
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "workspaceId";
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "createdById";
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "confidence";
ALTER TABLE "TTP" DROP COLUMN IF EXISTS "severity";

-- ============================================
-- PHASE 9: Drop Enum Type
-- ============================================

DROP TYPE IF EXISTS "ResourceType";

-- ============================================
-- PHASE 10: Final Verification
-- ============================================

DO $$
DECLARE
  total_ttps INTEGER;
  null_case_ids INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ttps FROM "TTP";
  SELECT COUNT(*) INTO null_case_ids FROM "TTP" WHERE "caseId" IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ROLLBACK COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '  Total TTPs: %', total_ttps;
  RAISE NOTICE '  NULL caseIds: %', null_case_ids;
  RAISE NOTICE '';
  
  IF null_case_ids = 0 THEN
    RAISE NOTICE '✅ Rollback successful - all TTPs have valid caseId';
  ELSE
    RAISE WARNING '⚠️  Found % TTPs with NULL caseId', null_case_ids;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  WARNING: All non-CASE TTPs were deleted during rollback';
  RAISE NOTICE '';
END $$;
