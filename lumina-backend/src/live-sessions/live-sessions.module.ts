import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LiveSessionsGateway } from './live-sessions.gateway';
import { LiveSessionsService } from './live-sessions.service';

@Module({
  imports: [AuthModule],
  providers: [LiveSessionsGateway, LiveSessionsService],
  exports: [LiveSessionsService],
})
export class LiveSessionsModule {}
