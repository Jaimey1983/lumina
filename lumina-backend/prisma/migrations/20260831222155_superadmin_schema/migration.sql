-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('INVITATION_CODE', 'MANUAL_DOCUMENT', 'INSTITUTIONAL_EMAIL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "documentIssuedAt" TIMESTAMP(3),
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "institutionalEmail" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationMethod" "VerificationMethod",
ADD COLUMN     "verificationStatus" "VerificationStatus",
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "invitation_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetRole" "Role" NOT NULL DEFAULT 'TEACHER',
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_domains" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "autoVerify" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_impersonation_sessions" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "admin_impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_events" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "payloadVersion" INTEGER NOT NULL DEFAULT 1,
    "actorUserId" TEXT,
    "studentId" TEXT,
    "teacherId" TEXT,
    "classId" TEXT,
    "courseId" TEXT,
    "activityId" TEXT,
    "activityType" TEXT,
    "subjectArea" TEXT,
    "gradeLevel" TEXT,
    "payload" JSONB NOT NULL,
    "aiProvider" TEXT,
    "aiEdited" BOOLEAN,
    "studyPhase" TEXT,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metric_snapshots" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER,

    CONSTRAINT "daily_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "consentStatus" TEXT NOT NULL,
    "consentDate" TIMESTAMP(3),
    "revokedDate" TIMESTAMP(3),
    "scope" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_export_jobs" (
    "id" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filters" JSONB NOT NULL,
    "anonymization" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileUrl" TEXT,

    CONSTRAINT "research_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_codes_code_key" ON "invitation_codes"("code");

-- CreateIndex
CREATE INDEX "invitation_codes_createdById_idx" ON "invitation_codes"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_domains_domain_key" ON "trusted_domains"("domain");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_timestamp_idx" ON "admin_audit_logs"("adminId", "timestamp");

-- CreateIndex
CREATE INDEX "admin_audit_logs_targetUserId_timestamp_idx" ON "admin_audit_logs"("targetUserId", "timestamp");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_timestamp_idx" ON "admin_audit_logs"("action", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "admin_impersonation_sessions_jti_key" ON "admin_impersonation_sessions"("jti");

-- CreateIndex
CREATE INDEX "admin_impersonation_sessions_adminId_startedAt_idx" ON "admin_impersonation_sessions"("adminId", "startedAt");

-- CreateIndex
CREATE INDEX "admin_impersonation_sessions_targetUserId_idx" ON "admin_impersonation_sessions"("targetUserId");

-- CreateIndex
CREATE INDEX "learning_events_eventType_timestamp_idx" ON "learning_events"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "learning_events_actorUserId_timestamp_idx" ON "learning_events"("actorUserId", "timestamp");

-- CreateIndex
CREATE INDEX "learning_events_studentId_idx" ON "learning_events"("studentId");

-- CreateIndex
CREATE INDEX "learning_events_teacherId_idx" ON "learning_events"("teacherId");

-- CreateIndex
CREATE INDEX "learning_events_activityId_idx" ON "learning_events"("activityId");

-- CreateIndex
CREATE INDEX "learning_events_teacherId_eventType_timestamp_idx" ON "learning_events"("teacherId", "eventType", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metric_snapshots_date_scope_metricKey_key" ON "daily_metric_snapshots"("date", "scope", "metricKey");

-- CreateIndex
CREATE UNIQUE INDEX "research_consents_userId_key" ON "research_consents"("userId");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_role_verificationStatus_idx" ON "users"("role", "verificationStatus");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_impersonation_sessions" ADD CONSTRAINT "admin_impersonation_sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_impersonation_sessions" ADD CONSTRAINT "admin_impersonation_sessions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_consents" ADD CONSTRAINT "research_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
