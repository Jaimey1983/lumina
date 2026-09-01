import { Module } from '@nestjs/common';

import { TeacherVerifiedGuard } from './teacher-verified.guard';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  controllers: [VerificationController],
  providers: [VerificationService, TeacherVerifiedGuard],
  exports: [VerificationService, TeacherVerifiedGuard],
})
export class VerificationModule {}
