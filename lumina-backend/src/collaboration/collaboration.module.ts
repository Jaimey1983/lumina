import { Module } from '@nestjs/common';
import { CollaborationController } from './collaboration.controller';
import { ClassCollabController } from './class-collab.controller';
import { CollaborationService } from './collaboration.service';

@Module({
  controllers: [CollaborationController, ClassCollabController],
  providers: [CollaborationService],
})
export class CollaborationModule {}
