import { Module } from '@nestjs/common';
import { H5pActivitiesController } from './h5p-activities.controller';
import { H5pActivitiesService } from './h5p-activities.service';

@Module({
  controllers: [H5pActivitiesController],
  providers: [H5pActivitiesService],
  exports: [H5pActivitiesService],
})
export class H5pActivitiesModule {}
