-- CreateTable
CREATE TABLE "escape_room_runs" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escape_room_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escape_room_teams" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salaIndex" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escape_room_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escape_room_team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escape_room_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escape_room_team_rooms" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "salaIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abierta',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "pistasReveladas" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "solvedByStudentId" TEXT,
    "solvedByStudentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escape_room_team_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escape_room_runs_sessionId_slideId_key" ON "escape_room_runs"("sessionId", "slideId");

-- CreateIndex
CREATE INDEX "escape_room_runs_classId_idx" ON "escape_room_runs"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "escape_room_teams_runId_name_key" ON "escape_room_teams"("runId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "escape_room_team_members_runId_studentId_key" ON "escape_room_team_members"("runId", "studentId");

-- CreateIndex
CREATE INDEX "escape_room_team_members_teamId_idx" ON "escape_room_team_members"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "escape_room_team_rooms_teamId_salaId_key" ON "escape_room_team_rooms"("teamId", "salaId");

-- AddForeignKey
ALTER TABLE "escape_room_teams" ADD CONSTRAINT "escape_room_teams_runId_fkey" FOREIGN KEY ("runId") REFERENCES "escape_room_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escape_room_team_members" ADD CONSTRAINT "escape_room_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "escape_room_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escape_room_team_rooms" ADD CONSTRAINT "escape_room_team_rooms_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "escape_room_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
