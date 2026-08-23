/*
  Warnings:

  - You are about to drop the `ClassResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClassSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClassResult" DROP CONSTRAINT "ClassResult_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ClassResult" DROP CONSTRAINT "ClassResult_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ClassSession" DROP CONSTRAINT "ClassSession_classId_fkey";

-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "codigo" DROP DEFAULT;

-- DropTable
DROP TABLE "ClassResult";

-- DropTable
DROP TABLE "ClassSession";

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "activeSlide" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_results" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_results_classId_studentId_slideId_key" ON "class_results"("classId", "studentId", "slideId");

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_results" ADD CONSTRAINT "class_results_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_results" ADD CONSTRAINT "class_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
