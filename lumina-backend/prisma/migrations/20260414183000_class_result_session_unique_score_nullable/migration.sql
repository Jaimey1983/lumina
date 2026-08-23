-- Backfill sessionId desde la sesión más antigua de cada clase
UPDATE "class_results" AS cr
SET "sessionId" = (
  SELECT cs."id"
  FROM "class_sessions" cs
  WHERE cs."classId" = cr."classId"
  ORDER BY cs."startedAt" ASC
  LIMIT 1
)
WHERE cr."sessionId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "class_sessions" cs2
    WHERE cs2."classId" = cr."classId"
  );

-- Clases con resultados huérfanos (sin ninguna sesión): crear sesión de migración
INSERT INTO "class_sessions" ("id", "classId", "startedAt", "endedAt", "activeSlide", "createdAt", "updatedAt")
SELECT
  'cmig-' || c."id",
  c."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "classes" c
WHERE EXISTS (
  SELECT 1
  FROM "class_results" cr
  WHERE cr."classId" = c."id" AND cr."sessionId" IS NULL
)
  AND NOT EXISTS (
  SELECT 1
  FROM "class_sessions" cs
  WHERE cs."classId" = c."id"
);

UPDATE "class_results" AS cr
SET "sessionId" = (
  SELECT cs."id"
  FROM "class_sessions" cs
  WHERE cs."classId" = cr."classId"
  ORDER BY cs."startedAt" ASC
  LIMIT 1
)
WHERE cr."sessionId" IS NULL;

-- Índice único anterior
DROP INDEX IF EXISTS "class_results_classId_studentId_slideId_key";

-- score nullable (sin default forzado a 0)
ALTER TABLE "class_results" ALTER COLUMN "score" DROP DEFAULT;
ALTER TABLE "class_results" ALTER COLUMN "score" DROP NOT NULL;

-- sessionId obligatorio
ALTER TABLE "class_results" ALTER COLUMN "sessionId" SET NOT NULL;

-- FK: CASCADE al borrar sesión
ALTER TABLE "class_results" DROP CONSTRAINT IF EXISTS "class_results_sessionId_fkey";

ALTER TABLE "class_results"
  ADD CONSTRAINT "class_results_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "class_sessions" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "class_results_classId_studentId_slideId_sessionId_key"
  ON "class_results" ("classId", "studentId", "slideId", "sessionId");
