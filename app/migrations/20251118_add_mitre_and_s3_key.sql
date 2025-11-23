-- CreateTable "MitreTactic"
CREATE TABLE "MitreTactic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MitreTactic_pkey" PRIMARY KEY ("id")
);

-- CreateTable "MitreTechnique"
CREATE TABLE "MitreTechnique" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "tacticId" TEXT NOT NULL,
    "parentId" TEXT,
    "platforms" TEXT[],
    "dataSources" TEXT[],
    "defenses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MitreTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MitreTechnique_tacticId_idx" ON "MitreTechnique"("tacticId");

-- CreateIndex
CREATE INDEX "MitreTechnique_parentId_idx" ON "MitreTechnique"("parentId");

-- AddForeignKey
ALTER TABLE "MitreTechnique" ADD CONSTRAINT "MitreTechnique_tacticId_fkey" FOREIGN KEY ("tacticId") REFERENCES "MitreTactic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MitreTechnique" ADD CONSTRAINT "MitreTechnique_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MitreTechnique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add s3Key column to Evidence
ALTER TABLE "Evidence" ADD COLUMN "s3Key" TEXT;
