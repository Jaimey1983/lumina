import { Module } from '@nestjs/common';
import { GradeCalculationService } from './grade-calculation.service';
import { GradeCalculationController } from './grade-calculation.controller';

@Module({
  controllers: [GradeCalculationController],
  providers: [GradeCalculationService],
  exports: [GradeCalculationService],
})
export class GradeCalculationModule {}
