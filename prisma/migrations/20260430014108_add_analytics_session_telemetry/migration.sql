-- CreateTable
CREATE TABLE "session_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "totalSlides" INTEGER NOT NULL DEFAULT 0,
    "peakConnections" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_connections" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "reconnections" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "student_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slide_engagements" (
    "id" TEXT NOT NULL,
    "sessionLogId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "slideIndex" INTEGER NOT NULL,
    "activityType" TEXT,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "timeOnSlide" INTEGER NOT NULL DEFAULT 0,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'live',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slide_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_logs_sessionId_key" ON "session_logs"("sessionId");

-- CreateIndex
CREATE INDEX "student_connections_sessionId_studentId_idx" ON "student_connections"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "slide_engagements_sessionLogId_slideId_studentId_key" ON "slide_engagements"("sessionLogId", "slideId", "studentId");

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slide_engagements" ADD CONSTRAINT "slide_engagements_sessionLogId_fkey" FOREIGN KEY ("sessionLogId") REFERENCES "session_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
