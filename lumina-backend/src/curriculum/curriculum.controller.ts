import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurriculumService } from './curriculum.service';
import { GenerateDesempenoDto } from './dto/generate-desempeno.dto';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /** GET /curriculum/dba?area=&grado= — DBA del banco para el área y grado indicados */
  @Get('dba')
  getDba(@Query('area') area: string, @Query('grado') grado: string) {
    return this.curriculumService.getDba(area ?? '', grado ?? '');
  }

  /** POST /curriculum/generate-desempeno — Genera un desempeño con 4 indicadores usando IA */
  @Post('generate-desempeno')
  generateDesempeno(@Body() dto: GenerateDesempenoDto) {
    return this.curriculumService.generateDesempeno(dto);
  }
}
