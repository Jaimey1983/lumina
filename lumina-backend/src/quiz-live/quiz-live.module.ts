import { Module } from '@nestjs/common';
import { QuizLiveService } from './quiz-live.service';

@Module({
  providers: [QuizLiveService],
  exports: [QuizLiveService],
})
export class QuizLiveModule {}
