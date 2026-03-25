import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { SelfEvaluationService } from './self-evaluation.service';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto';
import { UpdateSelfEvaluationDto } from './dto/update-self-evaluation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId/self-evaluations')
@UseGuards(JwtAuthGuard)
export class SelfEvaluationController {
  constructor(private readonly selfEvaluationService: SelfEvaluationService) {}

  // POST /courses/:courseId/self-evaluations
  // El docente registra la autoevaluación del estudiante
  @Post()
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateSelfEvaluationDto,
  ) {
    return this.selfEvaluationService.create(courseId, dto);
  }

  // GET /courses/:courseId/self-evaluations?periodId=xxx
  // Lista todas — TEACHER/ADMIN/SUPERADMIN
  @Get()
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  findAll(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.selfEvaluationService.findAll(courseId, periodId);
  }

  // GET /courses/:courseId/self-evaluations/students/:userId?periodId=xxx
  // TEACHER/ADMIN/SUPERADMIN ven cualquiera — STUDENT solo la suya
  @Get('students/:userId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Query('periodId') periodId: string,
    @Request() req,
  ) {
    const requester = req.user;
    const isPrivileged = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(requester.role);
    const isOwnRecord = requester.id === userId;

    if (!isPrivileged && !isOwnRecord) {
      throw new ForbiddenException('Solo puedes consultar tu propia autoevaluación');
    }

    return this.selfEvaluationService.findOne(courseId, periodId, userId);
  }

  // PATCH /courses/:courseId/self-evaluations/students/:userId?periodId=xxx
  // Solo docente puede actualizar
  @Patch('students/:userId')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Query('periodId') periodId: string,
    @Body() dto: UpdateSelfEvaluationDto,
  ) {
    return this.selfEvaluationService.update(courseId, periodId, userId, dto);
  }

  // DELETE /courses/:courseId/self-evaluations/students/:userId?periodId=xxx
  // Solo docente puede eliminar
  @Delete('students/:userId')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.selfEvaluationService.remove(courseId, periodId, userId);
  }
}
