import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ChemistryService } from './chemistry.service';

@Controller('chemistry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChemistryController {
  constructor(private readonly chemistryService: ChemistryService) {}

  /**
   * GET /chemistry/pubchem/resolve?name=water
   * Proxy PubChem para el editor (docente); el alumno solo ve SMILES ya guardados en el slide.
   */
  @Get('pubchem/resolve')
  @Roles(
    'TEACHER',
    'TEACHER_ASSISTANT',
    'DEPARTMENT_HEAD',
    'ADMIN',
    'SUPERADMIN',
  )
  resolveByName(@Query('name') name: string) {
    return this.chemistryService.resolveCompoundByName(name);
  }
}
