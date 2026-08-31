import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassesGateway } from './classes.gateway';
import { EscapeRoomModule } from '../escape-room/escape-room.module';
import { TorneoModule } from '../torneo/torneo.module';

@Module({
  imports: [AnalyticsModule, TorneoModule, GamificationModule, EscapeRoomModule],
  controllers: [ClassesController],
  providers: [ClassesService, ClassesGateway],
})
export class ClassesModule {}
