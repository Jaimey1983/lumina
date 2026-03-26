import { Module } from '@nestjs/common';
import { ClassEditorController } from './class-editor.controller';
import { ClassEditorService } from './class-editor.service';

@Module({
  controllers: [ClassEditorController],
  providers: [ClassEditorService],
  exports: [ClassEditorService],
})
export class ClassEditorModule {}
