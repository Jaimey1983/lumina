import { Module } from '@nestjs/common';
import { TorneoService } from './torneo.service';

@Module({
  providers: [TorneoService],
  exports: [TorneoService],
})
export class TorneoModule {}
