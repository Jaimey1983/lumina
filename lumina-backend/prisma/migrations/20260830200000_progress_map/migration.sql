-- AlterTable
ALTER TABLE "courses" ADD COLUMN "progressMap" JSONB;

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "student_class_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'COMPLETED',
    "completedAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual_teacher',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_class_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_class_progress_userId_classId_key" ON "student_class_progress"("userId", "classId");

-- CreateIndex
CREATE INDEX "student_class_progress_userId_courseId_idx" ON "student_class_progress"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "student_class_progress" ADD CONSTRAINT "student_class_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_progress" ADD CONSTRAINT "student_class_progress_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_progress" ADD CONSTRAINT "student_class_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
