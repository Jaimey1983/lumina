import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { LiveSessionsGateway } from './live-sessions.gateway';
import { LiveSessionsService } from './live-sessions.service';

@Module({
  imports: [AuthModule, AnalyticsModule],
  providers: [LiveSessionsGateway, LiveSessionsService],
  exports: [LiveSessionsService],
})
export class LiveSessionsModule {}
