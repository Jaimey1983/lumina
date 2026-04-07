import { Module } from '@nestjs/common';
import { AiFeaturesController } from './ai-features.controller';
import { CourseAiController } from './course-ai.controller';
import { AiFeaturesService } from './ai-features.service';

@Module({
  controllers: [AiFeaturesController, CourseAiController],
  providers: [AiFeaturesService],
})
export class AiFeaturesModule {}
