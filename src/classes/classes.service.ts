import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { SaveResultsDto } from './dto/save-results.dto';
import { SaveManualGradeDto } from './dto/save-manual-grade.dto';
import { nanoid } from 'nanoid';

const AUTOMATIC_ACTIVITY_TYPES = new Set([
  'quiz_multiple',
  'verdadero_falso',
  'completar_blancos',
  'arrastrar_soltar',
  'emparejar',
  'ordenar_pasos',
  'video_interactivo',
]);

const MANUAL_ACTIVITY_TYPES = new Set([
  'short_answer',
  'encuesta_viva',
  'nube_palabras',
]);

type GradebookActivity = {
  slideId: string;
  activityType: string;
  esManual: boolean;
};

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ─── CLASES ────────────────────────────────────────────

  async create(dto: CreateClassDto, userId: string) {
    // Verificar que el curso existe y pertenece al teacher
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { id: true, teacherId: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (course.teacherId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para crear clases en este curso',
      );
    }

    const codigo = await this.generarCodigoUnico();

    return this.prisma.class.create({
      data: {
        title: dto.title,
        description: dto.description,
        code: nanoid(8),
        codigo,
        courseId: dto.courseId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        codigo: true,
        status: true,
        courseId: true,
        createdAt: true,
      },
    });
  }

  async findAllByCourse(courseId: string, userId: string, userRole: string) {
    // Verificar acceso al curso
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    return this.prisma.class.findMany({
      where: {
        courseId,
        status: { not: 'ARCHIVED' },
      },
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        status: true,
        createdAt: true,
        _count: { select: { slides: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCodigo(codigo: string) {
    const clase = await this.prisma.class.findUnique({
      where: { codigo },
      select: { id: true, title: true, codigo: true, status: true },
    });
    if (!clase) throw new NotFoundException('Código de clase inválido');
    return clase;
  }

  async findOne(id: string, userId: string, userRole: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        codigo: true,
        status: true,
        courseId: true,
        desempeno: true,
        createdAt: true,
        updatedAt: true,
        slides: {
          select: {
            id: true,
            order: true,
            type: true,
            title: true,
            content: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');
    await this.courseAuth.verifyCourseReadAccess(
      cls.courseId,
      userId,
      userRole,
    );
    return cls;
  }

  async update(id: string, dto: UpdateClassDto, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const { desempeno, status, ...rest } = dto;
    return this.prisma.class.update({
      where: { id },
      data: {
        ...rest,
        ...(status !== undefined ? { status } : {}),
        ...(desempeno !== undefined
          ? { desempeno: desempeno as Prisma.InputJsonValue }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        desempeno: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async publish(id: string, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    return this.prisma.class.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      select: { id: true, status: true },
    });
  }

  async remove(id: string, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    return this.prisma.class.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      select: { id: true, status: true },
    });
  }

  async startSession(id: string, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const activeSession = await this.prisma.classSession.findFirst({
      where: {
        classId: id,
        finishedAt: null,
      },
      select: {
        id: true,
        classId: true,
        startedAt: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (activeSession) {
      return activeSession;
    }

    return this.prisma.classSession.create({
      data: {
        classId: id,
      },
      select: {
        id: true,
        classId: true,
        startedAt: true,
      },
    });
  }

  async endSession(id: string, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const activeSession = await this.prisma.classSession.findFirst({
      where: {
        classId: id,
        finishedAt: null,
      },
      select: {
        id: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeSession) {
      throw new NotFoundException('No hay una sesión activa para esta clase');
    }

    return this.prisma.classSession.update({
      where: { id: activeSession.id },
      data: {
        finishedAt: new Date(),
      },
      select: {
        id: true,
        classId: true,
        startedAt: true,
        finishedAt: true,
      },
    });
  }

  async saveResults(classId: string, dto: SaveResultsDto, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const session = await this.prisma.classSession.findUnique({
      where: { id: dto.sessionId },
      select: { id: true, classId: true },
    });

    if (!session || session.classId !== classId) {
      throw new NotFoundException('Sesión de clase no encontrada');
    }

    if (dto.results.length > 0) {
      await this.prisma.classResult.createMany({
        data: dto.results.map((result) => ({
          sessionId: dto.sessionId,
          studentId: result.studentId,
          slideId: result.slideId,
          activityType: result.activityType,
          correct: result.correct ?? null,
          historial: (result.historial ?? []) as Prisma.InputJsonValue,
        })),
      });
    }

    return { saved: dto.results.length };
  }

  async getGradebook(classId: string, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const classWithSlides = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        slides: {
          select: {
            id: true,
            order: true,
            content: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!classWithSlides) {
      throw new NotFoundException('Clase no encontrada');
    }

    const actividades: GradebookActivity[] = [];
    for (const slide of classWithSlides.slides) {
      const blocks = this.extractSlideBlocks(slide.content);
      const activityBlocks = blocks.filter(
        (block) => this.getStringField(block, 'tipo') === 'actividad',
      );
      if (activityBlocks.length === 0) {
        continue;
      }

      for (const block of activityBlocks) {
        const activityType = this.extractActivityType(block);
        actividades.push({
          slideId: slide.id,
          activityType,
          esManual: MANUAL_ACTIVITY_TYPES.has(activityType),
        });
      }
    }

    const latestSession = await this.prisma.classSession.findFirst({
      where: {
        classId,
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: 'desc' },
      select: {
        id: true,
        results: {
          orderBy: { createdAt: 'asc' },
          select: {
            studentId: true,
            slideId: true,
            activityType: true,
            correct: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!latestSession) {
      return {
        actividades,
        estudiantes: [],
      };
    }

    const resultsByStudent = new Map<
      string,
      {
        studentId: string;
        nombre: string;
        email: string;
        notas: Record<string, number | null>;
        notaFinal: number;
        resultByActivityKey: Map<string, { correct: boolean | null }>;
      }
    >();

    for (const result of latestSession.results) {
      const existing = resultsByStudent.get(result.studentId);
      if (!existing) {
        resultsByStudent.set(result.studentId, {
          studentId: result.student.id,
          nombre: result.student.name,
          email: result.student.email,
          notas: {},
          notaFinal: 0,
          resultByActivityKey: new Map(),
        });
      }

      const studentEntry = resultsByStudent.get(result.studentId);
      if (!studentEntry) continue;

      const key = `${result.slideId}::${result.activityType}`;
      studentEntry.resultByActivityKey.set(key, { correct: result.correct });
    }

    const estudiantes = Array.from(resultsByStudent.values()).map((student) => {
      let sum = 0;
      let count = 0;

      for (const actividad of actividades) {
        const activityKey = `${actividad.slideId}::${actividad.activityType}`;
        const result = student.resultByActivityKey.get(activityKey);

        let nota: number | null;
        if (MANUAL_ACTIVITY_TYPES.has(actividad.activityType)) {
          nota = result ? null : 0;
        } else if (AUTOMATIC_ACTIVITY_TYPES.has(actividad.activityType)) {
          nota = result?.correct === true ? 5.0 : 0.0;
        } else {
          nota = result?.correct === true ? 5.0 : 0.0;
        }

        student.notas[actividad.slideId] = nota;

        if (nota === null) {
          sum += 0;
          count += 1;
        } else {
          sum += nota;
          count += 1;
        }
      }

      student.notaFinal = count > 0 ? Number((sum / count).toFixed(2)) : 0;
      return {
        studentId: student.studentId,
        nombre: student.nombre,
        email: student.email,
        notas: student.notas,
        notaFinal: student.notaFinal,
      };
    });

    return {
      actividades,
      estudiantes,
    };
  }

  async saveManualGrade(classId: string, dto: SaveManualGradeDto, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const lastFinishedSession = await this.prisma.classSession.findFirst({
      where: {
        classId,
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: 'desc' },
      select: { id: true },
    });

    if (!lastFinishedSession) {
      throw new NotFoundException('No hay sesión finalizada para esta clase');
    }

    const existingResult = await this.prisma.classResult.findFirst({
      where: {
        sessionId: lastFinishedSession.id,
        studentId: dto.studentId,
        slideId: dto.slideId,
      },
      select: {
        id: true,
        historial: true,
      },
    });

    const newHistoryEntry = { nota: dto.nota, manual: true };
    const manualCorrect = dto.nota >= 3.0;

    if (existingResult) {
      const historialActual = Array.isArray(existingResult.historial)
        ? [...existingResult.historial]
        : [];
      historialActual.push(newHistoryEntry);

      await this.prisma.classResult.update({
        where: { id: existingResult.id },
        data: {
          correct: manualCorrect,
          historial: historialActual as Prisma.InputJsonValue,
        },
      });

      return { saved: true, nota: dto.nota };
    }

    const slide = await this.prisma.slide.findUnique({
      where: { id: dto.slideId },
      select: {
        id: true,
        classId: true,
        content: true,
      },
    });

    if (!slide || slide.classId !== classId) {
      throw new NotFoundException('Slide no encontrado');
    }

    const activityBlock = this.extractSlideBlocks(slide.content).find(
      (block) => this.getStringField(block, 'tipo') === 'actividad',
    );
    const activityType = activityBlock
      ? this.extractActivityType(activityBlock)
      : 'short_answer';

    await this.prisma.classResult.create({
      data: {
        sessionId: lastFinishedSession.id,
        studentId: dto.studentId,
        slideId: dto.slideId,
        activityType,
        correct: manualCorrect,
        historial: [newHistoryEntry] as Prisma.InputJsonValue,
      },
    });

    return { saved: true, nota: dto.nota };
  }

  // ─── SLIDES ────────────────────────────────────────────

  async addSlide(classId: string, dto: CreateSlideDto, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    // Calcular el siguiente order
    const lastSlide = await this.prisma.slide.findFirst({
      where: { classId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastSlide?.order ?? 0) + 1;

    return this.prisma.slide.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content as Prisma.InputJsonValue,
        order: nextOrder,
        class: { connect: { id: classId } },
      },
      select: {
        id: true,
        order: true,
        type: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async updateSlide(
    classId: string,
    slideId: string,
    dto: UpdateSlideDto,
    userId: string,
  ) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
    });
    if (!slide || slide.classId !== classId) {
      throw new NotFoundException('Slide no encontrado');
    }

    return this.prisma.slide.update({
      where: { id: slideId },
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content as Prisma.InputJsonValue,
      },
    });
  }

  async removeSlide(classId: string, slideId: string, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
    });
    if (!slide || slide.classId !== classId) {
      throw new NotFoundException('Slide no encontrado');
    }

    // Eliminar el slide (cascade en DB lo maneja)
    await this.prisma.slide.delete({ where: { id: slideId } });

    // Reordenar los slides restantes
    const remaining = await this.prisma.slide.findMany({
      where: { classId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    await Promise.all(
      remaining.map((s, index) =>
        this.prisma.slide.update({
          where: { id: s.id },
          data: { order: index + 1 },
        }),
      ),
    );

    return { message: 'Slide eliminado correctamente' };
  }

  async reorderSlides(
    classId: string,
    userId: string,
    order: { id: string; order: number }[],
  ) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const slides = await this.prisma.slide.findMany({
      where: { classId },
      select: { id: true },
    });
    const validIds = new Set(slides.map((s) => s.id));
    const allValid = order.every((item) => validIds.has(item.id));
    if (!allValid)
      throw new NotFoundException('Uno o más slides no pertenecen a esta clase');

    await this.prisma.$transaction(
      order.map((item) =>
        this.prisma.slide.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return this.prisma.slide.findMany({
      where: { classId },
      select: { id: true, order: true, type: true, title: true },
      orderBy: { order: 'asc' },
    });
  }

  async addSlideAtPosition(
    classId: string,
    userId: string,
    afterOrder: number,
    dto: CreateSlideDto,
  ) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.slide.updateMany({
        where: { classId, order: { gt: afterOrder } },
        data: { order: { increment: 1 } },
      });

      return tx.slide.create({
        data: {
          type: dto.type,
          title: dto.title,
          content: dto.content as Prisma.InputJsonValue,
          order: afterOrder + 1,
          class: { connect: { id: classId } },
        },
      });
    });

    return this.prisma.slide.findMany({
      where: { classId },
      select: {
        id: true,
        order: true,
        type: true,
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  // ─── HELPERS PRIVADOS ──────────────────────────────────

  private async generarCodigoUnico(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo: string;
    let existe: boolean;
    do {
      codigo =
        'LUM-' +
        Array.from({ length: 4 }, () =>
          chars[Math.floor(Math.random() * chars.length)],
        ).join('');
      existe = !!(await this.prisma.class.findUnique({ where: { codigo } }));
    } while (existe);
    return codigo;
  }

  private async findOneRaw(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      select: { id: true, courseId: true, status: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');
    return cls;
  }

  private async verifyTeacherOwnership(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course || course.teacherId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta clase',
      );
    }
  }

  private extractSlideBlocks(content: Prisma.JsonValue | null): Record<string, unknown>[] {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return [];
    }

    const blocks = (content as { blocks?: unknown }).blocks;
    if (!Array.isArray(blocks)) {
      return [];
    }

    return blocks.filter(
      (block): block is Record<string, unknown> =>
        !!block && typeof block === 'object' && !Array.isArray(block),
    );
  }

  private getStringField(
    obj: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = obj[key];
    return typeof value === 'string' ? value : null;
  }

  private extractActivityType(block: Record<string, unknown>): string {
    return (
      this.getStringField(block, 'activityType') ??
      this.getStringField(block, 'tipoActividad') ??
      this.getStringField(block, 'actividadTipo') ??
      this.getStringField(block, 'subtipo') ??
      this.getStringField(block, 'tipoActividadInteractiva') ??
      'actividad'
    );
  }
}
