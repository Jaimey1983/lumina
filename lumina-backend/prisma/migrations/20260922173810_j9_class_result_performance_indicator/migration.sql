-- AlterTable
ALTER TABLE "class_results" ADD COLUMN     "performanceIndicatorId" TEXT;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "performanceIndicatorId" TEXT;

-- CreateIndex
CREATE INDEX "class_results_performanceIndicatorId_idx" ON "class_results"("performanceIndicatorId");

-- CreateIndex
CREATE INDEX "classes_performanceIndicatorId_idx" ON "classes"("performanceIndicatorId");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_performanceIndicatorId_fkey" FOREIGN KEY ("performanceIndicatorId") REFERENCES "performance_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_results" ADD CONSTRAINT "class_results_performanceIndicatorId_fkey" FOREIGN KEY ("performanceIndicatorId") REFERENCES "performance_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
