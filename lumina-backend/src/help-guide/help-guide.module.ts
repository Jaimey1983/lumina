import { Module } from '@nestjs/common';
import { HelpGuideController } from './help-guide.controller';
import { HelpGuideService } from './help-guide.service';

@Module({
  controllers: [HelpGuideController],
  providers: [HelpGuideService],
})
export class HelpGuideModule {}
