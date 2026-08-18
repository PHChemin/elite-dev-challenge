-- CreateTable
CREATE TABLE "Exhibition" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "tmdbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "Exhibition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exhibition_organizerId_tmdbId_key" ON "Exhibition"("organizerId", "tmdbId");

-- AddForeignKey
ALTER TABLE "Exhibition" ADD CONSTRAINT "Exhibition_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "exhibitionId" TEXT;

-- Backfill: one cartaz per organizer + TMDb title
INSERT INTO "Exhibition" ("id", "organizerId", "tmdbId", "title", "posterUrl", "publishStatus")
SELECT
    gen_random_uuid()::text,
    e."organizerId",
    e."tmdbId",
    (ARRAY_AGG(e."title" ORDER BY e."startsAt"))[1],
    (ARRAY_AGG(e."posterUrl" ORDER BY e."startsAt"))[1],
    CASE
        WHEN bool_or(e."publishStatus" = 'published'::"PublishStatus") THEN 'published'::"PublishStatus"
        ELSE 'draft'::"PublishStatus"
    END
FROM "Event" e
GROUP BY e."organizerId", e."tmdbId";

UPDATE "Event" AS ev
SET "exhibitionId" = ex."id"
FROM "Exhibition" AS ex
WHERE ev."organizerId" = ex."organizerId"
  AND ev."tmdbId" = ex."tmdbId";

ALTER TABLE "Event" ALTER COLUMN "exhibitionId" SET NOT NULL;

ALTER TABLE "Event" DROP CONSTRAINT "Event_organizerId_fkey";

ALTER TABLE "Event" DROP COLUMN "organizerId",
DROP COLUMN "tmdbId",
DROP COLUMN "title",
DROP COLUMN "posterUrl";

ALTER TABLE "Event" ADD CONSTRAINT "Event_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "Exhibition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Event_exhibitionId_startsAt_venueName_key" ON "Event"("exhibitionId", "startsAt", "venueName");
