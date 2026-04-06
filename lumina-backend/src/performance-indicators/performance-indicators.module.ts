import { Module } from '@nestjs/common';
import { PerformanceIndicatorsController } from './performance-indicators.controller';
import { PerformanceIndicatorsService } from './performance-indicators.service';

@Module({
  controllers: [PerformanceIndicatorsController],
  providers: [PerformanceIndicatorsService],
  exports: [PerformanceIndicatorsService],
})
export class PerformanceIndicatorsModule {}
