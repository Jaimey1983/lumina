import { Module } from '@nestjs/common';
import { AiFeaturesController } from './ai-features.controller';
import { CourseAiController } from './course-ai.controller';
import { AiKeysController } from './ai-keys.controller';
import { AiFeaturesService } from './ai-features.service';
import { AiKeysService } from './ai-keys.service';
import { AiStaffGuard } from './ai-staff';

@Module({
  controllers: [AiFeaturesController, CourseAiController, AiKeysController],
  providers: [AiFeaturesService, AiKeysService, AiStaffGuard],
})
export class AiFeaturesModule {}
