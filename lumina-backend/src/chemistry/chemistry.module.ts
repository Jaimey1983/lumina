import { Module } from '@nestjs/common';
import { ChemistryController } from './chemistry.controller';
import { ChemistryService } from './chemistry.service';

@Module({
  controllers: [ChemistryController],
  providers: [ChemistryService],
  exports: [ChemistryService],
})
export class ChemistryModule {}
