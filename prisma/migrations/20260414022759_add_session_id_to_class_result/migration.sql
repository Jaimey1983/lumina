-- AlterTable
ALTER TABLE "class_results" ADD COLUMN     "sessionId" TEXT;

-- AddForeignKey
ALTER TABLE "class_results" ADD CONSTRAINT "class_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
