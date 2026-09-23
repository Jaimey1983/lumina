import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { CurriculumService } from './curriculum.service';
import { GenerateDesempenoDto } from './dto/generate-desempeno.dto';
import { CreateDesempenoDto } from './dto/create-desempeno.dto';
import { GenerateIndicadoresClaseDto } from './dto/generate-indicadores-clase.dto';
import { SaveIndicadoresGuardadosDto } from './dto/save-indicadores-guardados.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /** POST /curriculum/generate-desempeno — Genera un desempeño con 4 indicadores usando IA */
  @Post('generate-desempeno')
  generateDesempeno(@Body() dto: GenerateDesempenoDto) {
    return this.curriculumService.generateDesempeno(dto);
  }

  /**
   * POST /curriculum/courses/:courseId/desempenos — Entrada 1 del motor
   * curricular único (Etapa J / J6.2): genera y persiste un `Desempeno` a
   * nivel de curso a partir de componente EBC + competencia ICFES.
   */
  @Post('courses/:courseId/desempenos')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createDesempenoCurso(
    @Param('courseId') courseId: string,
    @Body() dto: CreateDesempenoDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.generateDesempenoCurso(
      courseId,
      dto,
      user.id,
      user.role,
    );
  }

  /** GET /curriculum/courses/:courseId/desempenos — lista los desempeños del curso. */
  @Get('courses/:courseId/desempenos')
  listDesempenosCurso(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.listDesempenosCurso(
      courseId,
      user.id,
      user.role,
    );
  }

  /** DELETE /curriculum/courses/:courseId/desempenos/:desempenoId */
  @Delete('courses/:courseId/desempenos/:desempenoId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  removeDesempenoCurso(
    @Param('courseId') courseId: string,
    @Param('desempenoId') desempenoId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.removeDesempenoCurso(
      courseId,
      desempenoId,
      user.id,
      user.role,
    );
  }

  /**
   * GET /curriculum/courses/:courseId/desempenos/:desempenoId/unidades-dba
   * — Entrada 2 (J6.3), camino DBA: unidades curadas del componente del
   * `Desempeno`, cada una con sus evidencias de aprendizaje.
   */
  @Get('courses/:courseId/desempenos/:desempenoId/unidades-dba')
  listUnidadesDbaParaDesempeno(
    @Param('courseId') courseId: string,
    @Param('desempenoId') desempenoId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.listUnidadesDbaParaDesempeno(
      courseId,
      desempenoId,
      user.id,
      user.role,
    );
  }

  /**
   * GET /curriculum/courses/:courseId/desempenos/:desempenoId/subprocesos-ebc
   * — Entrada 2 (J6.3), camino EBC: todos los subprocesos del componente.
   */
  @Get('courses/:courseId/desempenos/:desempenoId/subprocesos-ebc')
  listSubprocesosEbcParaDesempeno(
    @Param('courseId') courseId: string,
    @Param('desempenoId') desempenoId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.listSubprocesosEbcParaDesempeno(
      courseId,
      desempenoId,
      user.id,
      user.role,
    );
  }

  /**
   * POST /curriculum/courses/:courseId/desempenos/:desempenoId/generar-indicadores
   * — Entrada 2 (J6.3): genera (sin persistir) los 3 indicadores de la clase
   * a partir del camino DBA/EBC elegido.
   */
  @Post('courses/:courseId/desempenos/:desempenoId/generar-indicadores')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  generateIndicadoresClase(
    @Param('courseId') courseId: string,
    @Param('desempenoId') desempenoId: string,
    @Body() dto: GenerateIndicadoresClaseDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.generateIndicadoresClase(
      courseId,
      desempenoId,
      dto,
      user.id,
      user.role,
    );
  }

  /**
   * GET /curriculum/courses/:courseId/desempenos/:desempenoId/indicadores
   * — banco de indicadores ya guardados para este desempeño, reutilizables
   * al crear otra clase del mismo curso (seguimiento a J6.3).
   */
  @Get('courses/:courseId/desempenos/:desempenoId/indicadores')
  listIndicadoresGuardados(
    @Param('courseId') courseId: string,
    @Param('desempenoId') desempenoId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.listIndicadoresGuardados(
      courseId,
      desempenoId,
      user.id,
      user.role,
    );
  }

  /**
   * POST /curriculum/courses/:courseId/desempenos/:desempenoId/indicadores
   * — guarda un lote de indicadores en el banco reutilizable del desempeño.
   */
  @Post('courses/:courseId/desempenos/:desempenoId/indicadores')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  guardarIndicadores(
    @Param('courseId') courseId: string,
    @Param('desempenoId') desempenoId: string,
    @Body() dto: SaveIndicadoresGuardadosDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.curriculumService.guardarIndicadores(
      courseId,
      desempenoId,
      dto,
      user.id,
      user.role,
    );
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
