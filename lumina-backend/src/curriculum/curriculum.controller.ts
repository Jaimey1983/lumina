import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurriculumService } from './curriculum.service';
import { GenerateDesempenoDto } from './dto/generate-desempeno.dto';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /** POST /curriculum/generate-desempeno — Genera un desempeño con 4 indicadores usando IA */
  @Post('generate-desempeno')
  generateDesempeno(@Body() dto: GenerateDesempenoDto) {
    return this.curriculumService.generateDesempeno(dto);
  }

  /**
   * GET /curriculum/:area/:grado — unidad curricular real del dataset único
   * (J2). Declarada al final: es un catch-all de 2 segmentos bajo GET
   * /curriculum — cualquier ruta GET estática nueva que se agregue a este
   * controller debe ir ANTES de esta, o quedará ensombrecida.
   */
  @Get(':area/:grado')
  getCurriculumUnit(
    @Param('area') area: string,
    @Param('grado') grado: string,
  ) {
    return this.curriculumService.getCurriculumUnit(area, grado);
  }
}
