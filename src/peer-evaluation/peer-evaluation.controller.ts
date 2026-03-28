import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { PeerEvaluationService } from './peer-evaluation.service';
import { CreatePeerEvaluationDto } from './dto/create-peer-evaluation.dto';
import { UpdatePeerEvaluationDto } from './dto/update-peer-evaluation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId/peer-evaluations')
@UseGuards(JwtAuthGuard)
export class PeerEvaluationController {
  constructor(private readonly peerEvaluationService: PeerEvaluationService) {}

  // POST /courses/:courseId/peer-evaluations
  // El docente registra la coevaluación
  @Post()
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreatePeerEvaluationDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.peerEvaluationService.create(courseId, dto, user.id, user.role);
  }

  // GET /courses/:courseId/peer-evaluations?periodId=xxx
  // Lista todas las coevaluaciones del curso — TEACHER/ADMIN/SUPERADMIN
  @Get()
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  findAll(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    if (!periodId?.trim()) {
      throw new BadRequestException(
        'Query periodId es obligatorio (ej. ?periodId=...)',
      );
    }
    return this.peerEvaluationService.findAll(
      courseId,
      periodId.trim(),
      user.id,
      user.role,
    );
  }

  // GET /courses/:courseId/peer-evaluations/students/:evaluatedId?periodId=xxx
  // Coevaluaciones recibidas por un estudiante + promedio
  // TEACHER/ADMIN/SUPERADMIN ven cualquiera — STUDENT solo las suyas
  @Get('students/:evaluatedId')
  async findByEvaluated(
    @Param('courseId') courseId: string,
    @Param('evaluatedId') evaluatedId: string,
    @Query('periodId') periodId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    const requester = user;
    const isPrivileged = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(
      requester.role,
    );
    const isOwnRecord = requester.id === evaluatedId;

    if (!isPrivileged && !isOwnRecord) {
      throw new ForbiddenException(
        'Solo puedes consultar tus propias coevaluaciones',
      );
    }

    if (!periodId?.trim()) {
      throw new BadRequestException(
        'Query periodId es obligatorio (ej. ?periodId=...)',
      );
    }

    return this.peerEvaluationService.findByEvaluated(
      courseId,
      periodId.trim(),
      evaluatedId,
      requester.id,
      requester.role,
    );
  }

  // PATCH /courses/:courseId/peer-evaluations/:id
  // Actualizar una coevaluación por ID — solo docente
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePeerEvaluationDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.peerEvaluationService.update(
      id,
      courseId,
      dto,
      user.id,
      user.role,
    );
  }

  // DELETE /courses/:courseId/peer-evaluations/:id
  // Eliminar una coevaluación — solo docente
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.peerEvaluationService.remove(id, courseId, user.id, user.role);
  }
}
