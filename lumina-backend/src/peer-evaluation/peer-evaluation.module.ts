import { Module } from '@nestjs/common';
import { PeerEvaluationService } from './peer-evaluation.service';
import { PeerEvaluationController } from './peer-evaluation.controller';

@Module({
  controllers: [PeerEvaluationController],
  providers: [PeerEvaluationService],
  exports: [PeerEvaluationService],
})
export class PeerEvaluationModule {}
