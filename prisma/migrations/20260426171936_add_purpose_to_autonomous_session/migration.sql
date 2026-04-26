-- AlterTable
ALTER TABLE "autonomous_sessions" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'independent';

-- CreateTable
CREATE TABLE "autonomous_grades" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'autonomous',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_grades_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "autonomous_grades" ADD CONSTRAINT "autonomous_grades_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "autonomous_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_grades" ADD CONSTRAINT "autonomous_grades_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
