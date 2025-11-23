-- AlterTable
ALTER TABLE "BrandAlert" ADD COLUMN     "alertMetadata" JSONB,
ADD COLUMN     "analysisData" JSONB,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "detectionType" TEXT NOT NULL DEFAULT 'CONTENT',
ADD COLUMN     "screenshotUrl" TEXT;

-- CreateIndex
CREATE INDEX "BrandAlert_detectionType_idx" ON "BrandAlert"("detectionType");
