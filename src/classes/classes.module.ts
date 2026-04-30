import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassesGateway } from './classes.gateway';

@Module({
  imports: [AnalyticsModule],
  controllers: [ClassesController],
  providers: [ClassesService, ClassesGateway],
})
export class ClassesModule {}
