import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { SessionGamificationService } from './session-gamification.service';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, SessionGamificationService],
  exports: [GamificationService, SessionGamificationService],
})
export class GamificationModule {}
