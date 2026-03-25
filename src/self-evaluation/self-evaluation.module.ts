import { Module } from '@nestjs/common';
import { SelfEvaluationService } from './self-evaluation.service';
import { SelfEvaluationController } from './self-evaluation.controller';

@Module({
  controllers: [SelfEvaluationController],
  providers: [SelfEvaluationService],
  exports: [SelfEvaluationService],
})
export class SelfEvaluationModule {}
