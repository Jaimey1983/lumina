import { Module } from '@nestjs/common';
import { PerformanceTrackingController } from './performance-tracking.controller';
import { StudentHistoryController } from './student-history.controller';
import { PerformanceTrackingService } from './performance-tracking.service';
import { GradeCalculationModule } from '../grade-calculation/grade-calculation.module';

@Module({
  imports: [GradeCalculationModule],
  controllers: [PerformanceTrackingController, StudentHistoryController],
  providers: [PerformanceTrackingService],
})
export class PerformanceTrackingModule {}
