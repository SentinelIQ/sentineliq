/*
  Warnings:

  - You are about to drop the column `lastCorrelationRun` on the `EclipseConfig` table. All the data in the column will be lost.

*/
-- DropTable
DROP TABLE IF EXISTS "EclipseCorrelation" CASCADE;

-- AlterTable
ALTER TABLE "EclipseConfig" DROP COLUMN IF EXISTS "lastCorrelationRun";

-- DropEnum
DROP TYPE IF EXISTS "EclipseCorrelationType";
