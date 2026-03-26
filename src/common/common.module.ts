import { Global, Module } from '@nestjs/common';
import { CourseAuthorizationService } from './course-authorization.service';

@Global()
@Module({
  providers: [CourseAuthorizationService],
  exports: [CourseAuthorizationService],
})
export class CommonModule {}
