import { Module } from '@nestjs/common';
import { ProgressMapController } from './progress-map.controller';
import { ProgressMapService } from './progress-map.service';

@Module({
  controllers: [ProgressMapController],
  providers: [ProgressMapService],
  exports: [ProgressMapService],
})
export class ProgressMapModule {}
