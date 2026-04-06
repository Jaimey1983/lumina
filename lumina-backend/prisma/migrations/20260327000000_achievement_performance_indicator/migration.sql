-- CreateEnum
CREATE TYPE "AchievementScope" AS ENUM ('SPECIFIC', 'SUBJECT', 'GENERAL');

-- CreateEnum
CREATE TYPE "CompetenceType" AS ENUM ('COGNITIVE', 'METHODOLOGICAL', 'INTERPERSONAL', 'INSTRUMENTAL', 'SUBJECT_SPECIFIC');

-- CreateEnum
CREATE TYPE "CompetenceScope" AS ENUM ('GENERAL', 'SPECIFIC');

-- CreateTable: achievements
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "scope" "AchievementScope" NOT NULL DEFAULT 'SPECIFIC',
    "courseId" TEXT NOT NULL,
    "aspectId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: performance_indicators
CREATE TABLE "performance_indicators" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "competenceType" "CompetenceType" NOT NULL,
    "competenceScope" "CompetenceScope" NOT NULL DEFAULT 'GENERAL',
    "subject" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "achievementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_indicators_pkey" PRIMARY KEY ("id")
);

-- Add performanceIndicatorId as nullable first for data migration
ALTER TABLE "activities" ADD COLUMN "performanceIndicatorId" TEXT;

-- Data migration: for each existing indicator, create a matching achievement and performance indicator,
-- then update activities to reference the new performance indicator.
DO $$
DECLARE
    r_ind RECORD;
    r_act RECORD;
    v_aspect RECORD;
    v_course_id TEXT;
    v_period_id TEXT;
    v_achievement_id TEXT;
    v_pi_id TEXT;
BEGIN
    -- Iterate over each indicator
    FOR r_ind IN SELECT i.id, i.name, i.weight, i."aspectId"
                 FROM indicators i
    LOOP
        -- Get courseId from aspect → structure → course
        SELECT s."courseId" INTO v_course_id
        FROM aspects a
        JOIN gradebook_structures s ON s.id = a."structureId"
        WHERE a.id = r_ind."aspectId";

        -- Get the first active period for this course (or any period)
        SELECT p.id INTO v_period_id
        FROM periods p
        WHERE p."courseId" = v_course_id
        ORDER BY p."startDate" ASC
        LIMIT 1;

        -- If no period exists, create a placeholder period
        IF v_period_id IS NULL THEN
            v_period_id := gen_random_uuid()::text;
            INSERT INTO periods (id, name, "startDate", "endDate", "isActive", "courseId", "createdAt")
            VALUES (v_period_id, 'Período 1', NOW(), NOW() + INTERVAL '6 months', true, v_course_id, NOW());
        END IF;

        -- Generate a unique code (use first 25 chars of name, or fallback)
        -- Create the achievement
        v_achievement_id := gen_random_uuid()::text;
        INSERT INTO achievements (id, code, statement, scope, "courseId", "aspectId", "periodId", "createdAt")
        VALUES (
            v_achievement_id,
            LEFT(REGEXP_REPLACE(r_ind.name, '[^A-Za-z0-9]', '', 'g'), 25) || '-' || LEFT(r_ind.id, 4),
            r_ind.name,
            'SPECIFIC',
            v_course_id,
            r_ind."aspectId",
            v_period_id,
            NOW()
        );

        -- Create one performance indicator (COGNITIVE) with the same weight
        v_pi_id := gen_random_uuid()::text;
        INSERT INTO performance_indicators (id, statement, "competenceType", "competenceScope", weight, "achievementId", "createdAt")
        VALUES (
            v_pi_id,
            r_ind.name,
            'COGNITIVE',
            'GENERAL',
            r_ind.weight,
            v_achievement_id,
            NOW()
        );

        -- Update all activities that reference this indicator
        UPDATE activities
        SET "performanceIndicatorId" = v_pi_id
        WHERE "indicatorId" = r_ind.id;
    END LOOP;
END $$;

-- For any remaining activities with no performanceIndicatorId, create a placeholder
-- (This handles edge cases)
DO $$
DECLARE
    r_act RECORD;
    v_pi_id TEXT;
    v_ach_id TEXT;
    v_course_id TEXT;
    v_period_id TEXT;
    v_aspect_id TEXT;
BEGIN
    FOR r_act IN SELECT a.id, a."indicatorId"
                 FROM activities a
                 WHERE a."performanceIndicatorId" IS NULL
    LOOP
        -- Get aspect and course from the indicator
        SELECT asp.id, s."courseId" INTO v_aspect_id, v_course_id
        FROM indicators i
        JOIN aspects asp ON asp.id = i."aspectId"
        JOIN gradebook_structures s ON s.id = asp."structureId"
        WHERE i.id = r_act."indicatorId";

        SELECT p.id INTO v_period_id
        FROM periods p WHERE p."courseId" = v_course_id LIMIT 1;

        v_ach_id := gen_random_uuid()::text;
        INSERT INTO achievements (id, code, statement, scope, "courseId", "aspectId", "periodId", "createdAt")
        VALUES (v_ach_id, 'MIGR-' || LEFT(r_act."indicatorId", 4), 'Logro migrado', 'SPECIFIC', v_course_id, v_aspect_id, v_period_id, NOW());

        v_pi_id := gen_random_uuid()::text;
        INSERT INTO performance_indicators (id, statement, "competenceType", "competenceScope", weight, "achievementId", "createdAt")
        VALUES (v_pi_id, 'Indicador migrado', 'COGNITIVE', 'GENERAL', 1.0, v_ach_id, NOW());

        UPDATE activities SET "performanceIndicatorId" = v_pi_id WHERE id = r_act.id;
    END LOOP;
END $$;

-- Now make performanceIndicatorId NOT NULL
ALTER TABLE "activities" ALTER COLUMN "performanceIndicatorId" SET NOT NULL;

-- Drop old indicatorId column from activities
ALTER TABLE "activities" DROP COLUMN "indicatorId";

-- Drop old indicators table
DROP TABLE "indicators";

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_courseId_key" ON "achievements"("code", "courseId");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_aspectId_fkey" FOREIGN KEY ("aspectId") REFERENCES "aspects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_indicators" ADD CONSTRAINT "performance_indicators_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_performanceIndicatorId_fkey" FOREIGN KEY ("performanceIndicatorId") REFERENCES "performance_indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
