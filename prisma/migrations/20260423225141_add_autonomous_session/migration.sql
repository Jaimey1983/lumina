-- CreateTable
CREATE TABLE "autonomous_sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "allowBackNav" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "timerBehavior" TEXT NOT NULL DEFAULT 'advance',
    "requireManualStart" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomous_progress" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "response" JSONB,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "autonomous_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomous_results" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "finalScore" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_results_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "autonomous_sessions" ADD CONSTRAINT "autonomous_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_progress" ADD CONSTRAINT "autonomous_progress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "autonomous_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_results" ADD CONSTRAINT "autonomous_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "autonomous_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
