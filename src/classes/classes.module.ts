import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassesGateway } from './classes.gateway';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, ClassesGateway],
})
export class ClassesModule {}
