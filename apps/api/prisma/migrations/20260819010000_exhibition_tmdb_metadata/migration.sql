-- AlterTable
ALTER TABLE "Exhibition" ADD COLUMN "runtimeMinutes" INTEGER,
ADD COLUMN "overview" TEXT,
ADD COLUMN "releaseDate" TEXT,
ADD COLUMN "genres" JSONB;
