import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreatePeerEvaluationDto } from './dto/create-peer-evaluation.dto';
import { UpdatePeerEvaluationDto } from './dto/update-peer-evaluation.dto';

const STUDENT_SELECT = { id: true, name: true, lastName: true };

@Injectable()
export class PeerEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ── Crear coevaluación (docente la registra) ───────────────────────────────
  async create(
    courseId: string,
    dto: CreatePeerEvaluationDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'peerEvaluations',
    );

    // 1. Restricción de dominio: nadie se coevalúa a sí mismo
    if (dto.evaluatorId === dto.evaluatedId) {
      throw new BadRequestException(
        'El evaluador y el evaluado no pueden ser la misma persona',
      );
    }

    // 2. Ambos deben estar matriculados en el curso
    const [evaluatorEnrollment, evaluatedEnrollment] = await Promise.all([
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: dto.evaluatorId, courseId } },
      }),
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: dto.evaluatedId, courseId } },
      }),
    ]);

    if (!evaluatorEnrollment) {
      throw new BadRequestException(
        `El evaluador ${dto.evaluatorId} no está matriculado en el curso ${courseId}`,
      );
    }
    if (!evaluatedEnrollment) {
      throw new BadRequestException(
        `El evaluado ${dto.evaluatedId} no está matriculado en el curso ${courseId}`,
      );
    }

    // 3. Verificar que el período pertenece al curso
    const period = await this.prisma.period.findFirst({
      where: { id: dto.periodId, courseId },
      select: { id: true },
    });
    if (!period) {
      throw new NotFoundException(
        `Período ${dto.periodId} no encontrado en el curso ${courseId}`,
      );
    }

    // 4. Crear — P2002 si ya existe (unique: evaluatorId+evaluatedId+courseId+periodId)
    try {
      return await this.prisma.peerEvaluation.create({
        data: {
          score: dto.score,
          feedback: dto.feedback,
          evaluatorId: dto.evaluatorId,
          evaluatedId: dto.evaluatedId,
          courseId,
          periodId: dto.periodId,
        },
        select: {
          id: true,
          score: true,
          feedback: true,
          courseId: true,
          periodId: true,
          createdAt: true,
          evaluator: { select: STUDENT_SELECT },
          evaluated: { select: STUDENT_SELECT },
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'Ya existe una coevaluación de este evaluador para este estudiante en este período. Use PATCH para actualizarla.',
        );
      }
      throw e;
    }
  }

  // ── Listar todas las coevaluaciones de un curso por período ───────────────
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
      'peerEvaluations',
    );

    const entries = await this.prisma.peerEvaluation.findMany({
      where: { courseId, periodId },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        evaluator: { select: STUDENT_SELECT },
        evaluated: { select: STUDENT_SELECT },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: entries,
      meta: { total: entries.length, periodId, courseId },
    };
  }

  // ── Ver coevaluaciones recibidas por un estudiante en un período ───────────
  async findByEvaluated(
    courseId: string,
    periodId: string,
    evaluatedId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(
      courseId,
      requesterId,
      requesterRole,
    );

    const entries = await this.prisma.peerEvaluation.findMany({
      where: { courseId, periodId, evaluatedId },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        evaluator: { select: STUDENT_SELECT },
      },
      orderBy: { createdAt: 'asc' },
    });

    const average =
      entries.length > 0
        ? Math.round(
            (entries.reduce((sum, e) => sum + e.score, 0) / entries.length) *
              100,
          ) / 100
        : null;

    return {
      data: entries,
      meta: {
        total: entries.length,
        average,
        evaluatedId,
        periodId,
        courseId,
      },
    };
  }

  // ── Obtener una coevaluación por ID ────────────────────────────────────────
  async findOne(id: string, courseId: string) {
    const entry = await this.prisma.peerEvaluation.findFirst({
      where: { id, courseId },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        evaluator: { select: STUDENT_SELECT },
        evaluated: { select: STUDENT_SELECT },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Coevaluación ${id} no encontrada`);
    }

    return entry;
  }

  // ── Actualizar coevaluación ────────────────────────────────────────────────
  async update(
    id: string,
    courseId: string,
    dto: UpdatePeerEvaluationDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'peerEvaluations',
    );
    await this.findOne(id, courseId);

    return this.prisma.peerEvaluation.update({
      where: { id },
      data: {
        ...(dto.score !== undefined && { score: dto.score }),
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
      },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        evaluator: { select: STUDENT_SELECT },
        evaluated: { select: STUDENT_SELECT },
      },
    });
  }

  // ── Eliminar coevaluación ──────────────────────────────────────────────────
  async remove(
    id: string,
    courseId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'peerEvaluations',
    );
    await this.findOne(id, courseId);

    await this.prisma.peerEvaluation.delete({ where: { id } });

    return { message: 'Coevaluación eliminada correctamente' };
  }
}
