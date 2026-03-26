import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto';
import { UpdateSelfEvaluationDto } from './dto/update-self-evaluation.dto';

@Injectable()
export class SelfEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ── Crear autoevaluación (docente la registra) ─────────────────────────────
  async create(
    courseId: string,
    dto: CreateSelfEvaluationDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'selfEvaluations',
    );

    // 1. Verificar que el estudiante está matriculado en el curso
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId } },
    });
    if (!enrollment) {
      throw new BadRequestException(
        `El estudiante ${dto.userId} no está matriculado en el curso ${courseId}`,
      );
    }

    // 2. Verificar que el período pertenece al curso
    const period = await this.prisma.period.findFirst({
      where: { id: dto.periodId, courseId },
      select: { id: true },
    });
    if (!period) {
      throw new NotFoundException(
        `Período ${dto.periodId} no encontrado en el curso ${courseId}`,
      );
    }

    // 3. Crear — lanza P2002 si ya existe (unique: userId+courseId+periodId)
    try {
      return await this.prisma.selfEvaluation.create({
        data: {
          score: dto.score,
          feedback: dto.feedback,
          userId: dto.userId,
          courseId,
          periodId: dto.periodId,
        },
        select: {
          id: true,
          score: true,
          feedback: true,
          userId: true,
          courseId: true,
          periodId: true,
          createdAt: true,
          user: { select: { id: true, name: true, lastName: true } },
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'Ya existe una autoevaluación para este estudiante en este período. Use PATCH para actualizarla.',
        );
      }
      throw e;
    }
  }

  // ── Listar autoevaluaciones de un curso por período ────────────────────────
  async findAll(
    courseId: string,
    periodId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'selfEvaluations',
    );

    const entries = await this.prisma.selfEvaluation.findMany({
      where: { courseId, periodId },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        user: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: entries,
      meta: { total: entries.length, periodId, courseId },
    };
  }

  // ── Ver autoevaluación de un estudiante específico ─────────────────────────
  async findOne(
    courseId: string,
    periodId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(
      courseId,
      requesterId,
      requesterRole,
    );

    const entry = await this.prisma.selfEvaluation.findUnique({
      where: { userId_courseId_periodId: { userId, courseId, periodId } },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        user: { select: { id: true, name: true, lastName: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException(
        `No hay autoevaluación para el estudiante ${userId} en este período`,
      );
    }

    return entry;
  }

  // ── Actualizar autoevaluación ──────────────────────────────────────────────
  async update(
    courseId: string,
    periodId: string,
    userId: string,
    dto: UpdateSelfEvaluationDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'selfEvaluations',
    );
    await this.findOne(courseId, periodId, userId, requesterId, requesterRole);

    return this.prisma.selfEvaluation.update({
      where: { userId_courseId_periodId: { userId, courseId, periodId } },
      data: {
        ...(dto.score !== undefined && { score: dto.score }),
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
      },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        user: { select: { id: true, name: true, lastName: true } },
      },
    });
  }

  // ── Eliminar autoevaluación ────────────────────────────────────────────────
  // SelfEvaluation no tiene isActive — se elimina físicamente si no hay nota final calculada
  async remove(
    courseId: string,
    periodId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'selfEvaluations',
    );
    await this.findOne(courseId, periodId, userId, requesterId, requesterRole);

    await this.prisma.selfEvaluation.delete({
      where: { userId_courseId_periodId: { userId, courseId, periodId } },
    });

    return { message: 'Autoevaluación eliminada correctamente' };
  }
}
