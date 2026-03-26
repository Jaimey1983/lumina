import { Module } from '@nestjs/common';
import { GradebookReportsController } from './gradebook-reports.controller';
import { GradebookReportsService } from './gradebook-reports.service';
import { GradeCalculationModule } from '../grade-calculation/grade-calculation.module';

@Module({
  imports: [GradeCalculationModule],
  controllers: [GradebookReportsController],
  providers: [GradebookReportsService],
})
export class GradebookReportsModule {}
