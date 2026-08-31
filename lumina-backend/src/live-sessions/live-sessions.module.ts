import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { LiveSessionsGateway } from './live-sessions.gateway';
import { LiveSessionsService } from './live-sessions.service';

import { EscapeRoomModule } from '../escape-room/escape-room.module';
import { TorneoModule } from '../torneo/torneo.module';

@Module({
  imports: [AuthModule, AnalyticsModule, TorneoModule, EscapeRoomModule],
  providers: [LiveSessionsGateway, LiveSessionsService],
  exports: [LiveSessionsService],
})
export class LiveSessionsModule {}
