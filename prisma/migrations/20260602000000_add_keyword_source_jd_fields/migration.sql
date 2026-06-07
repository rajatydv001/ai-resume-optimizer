-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "keywordSource" TEXT NOT NULL DEFAULT 'role',
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "jdKeywords" TEXT;
