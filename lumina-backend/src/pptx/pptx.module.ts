import { Module } from '@nestjs/common';
import { PptxController } from './pptx.controller';
import { PptxService } from './pptx.service';

@Module({
  controllers: [PptxController],
  providers: [PptxService],
})
export class PptxModule {}
