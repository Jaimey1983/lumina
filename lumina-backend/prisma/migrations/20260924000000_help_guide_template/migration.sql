-- AlterTable
ALTER TABLE "classes" ADD COLUMN "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "templateKey" TEXT,
ADD COLUMN "templateVersion" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "welcomeGuideDismissedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "classes_templateKey_key" ON "classes"("templateKey");
