-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "versionGroupId" TEXT;

-- Backfill: set versionGroupId to id for all existing records
UPDATE "Resume" SET "versionGroupId" = "id" WHERE "versionGroupId" IS NULL;

CREATE INDEX IF NOT EXISTS "Resume_versionGroupId_idx" ON "Resume"("versionGroupId");
