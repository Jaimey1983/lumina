-- F1.4: optimistic locking de slides + unicidad de respuestas de torneo

ALTER TABLE "slides" ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 0;

-- Conservar la respuesta más antigua si hubo carrera previa (check-then-insert)
DELETE FROM "torneo_answers" a
USING "torneo_answers" b
WHERE a."torneoId" = b."torneoId"
  AND a."questionIndex" = b."questionIndex"
  AND a."studentId" = b."studentId"
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX "torneo_answers_torneoId_questionIndex_studentId_key"
  ON "torneo_answers"("torneoId", "questionIndex", "studentId");
