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
import { GuardarResultadosDto } from './dto/save-results.dto';
import { NotaManualDto } from './dto/save-manual-grade.dto';
import { JoinAsGuestDto } from './dto/join-as-guest.dto';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ─── CLASES ────────────────────────────────────────────

  async create(dto: CreateClassDto, userId: string) {
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
        codigo: codigo.toUpperCase(),
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
    const codigoNormalizado = codigo.toUpperCase();
    const clase = await this.prisma.class.findFirst({
      where: {
        codigo: {
          equals: codigoNormalizado,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        codigo: true,
        status: true,
        slides: {
          select: {
            id: true,
            order: true,
            type: true,
            title: true,
            content: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!clase) throw new NotFoundException('Código de clase inválido');
    return clase;
  }

  async joinAsGuest(codigo: string, dto: JoinAsGuestDto) {
    const codigoNormalizado = codigo.toUpperCase();
    const clase = await this.prisma.class.findFirst({
      where: {
        codigo: {
          equals: codigoNormalizado,
          mode: 'insensitive',
        },
      },
      select: { id: true, title: true },
    });
    if (!clase) throw new NotFoundException('Código de clase inválido');

    const email = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}@lumina.guest`;
    const password = await bcrypt.hash(Math.random().toString(36), 4);

    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        name: dto.nombre,
        lastName: '',
        role: 'STUDENT',
        isActive: true,
      },
      select: { id: true, name: true },
    });

    return {
      classId: clase.id,
      className: clase.title,
      studentId: user.id,
      studentName: user.name,
    };
  }

  async findOne(id: string) {
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

  // ─── SESIONES ──────────────────────────────────────────

  async startSession(id: string, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const activeSession = await this.prisma.classSession.findFirst({
      where: {
        classId: id,
        endedAt: null,
      },
      select: {
        id: true,
        classId: true,
        startedAt: true,
        activeSlide: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (activeSession) {
      return activeSession;
    }

    return this.prisma.classSession.create({
      data: {
        classId: id,
        activeSlide: 0,
      },
      select: {
        id: true,
        classId: true,
        startedAt: true,
        activeSlide: true,
      },
    });
  }

  async endSession(id: string, userId: string) {
    const cls = await this.findOneRaw(id);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const activeSession = await this.prisma.classSession.findFirst({
      where: {
        classId: id,
        endedAt: null,
      },
      select: { id: true },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeSession) {
      throw new NotFoundException('No hay una sesión activa para esta clase');
    }

    return this.prisma.classSession.update({
      where: { id: activeSession.id },
      data: { endedAt: new Date() },
      select: {
        id: true,
        classId: true,
        startedAt: true,
        endedAt: true,
      },
    });
  }

  // ─── RESULTADOS ────────────────────────────────────────

  async saveResults(classId: string, dto: GuardarResultadosDto) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    const sessionId =
      dto.sessionId !== undefined &&
      dto.sessionId !== null &&
      String(dto.sessionId).trim() !== ''
        ? String(dto.sessionId).trim()
        : undefined;

    for (const item of dto.resultados) {
      const responsePayload: Record<
        string,
        Prisma.InputJsonValue | boolean | null
      > = {};
      if (item.correct !== undefined && item.correct !== null) {
        responsePayload.correct = item.correct;
      }
      if (item.historial !== undefined) {
        responsePayload.historial = item.historial as Prisma.InputJsonValue;
      }
      const responseValue:
        | Prisma.NullableJsonNullValueInput
        | Prisma.InputJsonValue =
        Object.keys(responsePayload).length > 0
          ? (responsePayload as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull;

      const itemSessionId =
        item.sessionId !== undefined &&
        item.sessionId !== null &&
        String(item.sessionId).trim() !== ''
          ? String(item.sessionId).trim()
          : undefined;
      const resolvedSessionId = itemSessionId ?? sessionId ?? null;

      const maxScore = item.maxScore ?? 1;
      let resolvedScore: number | undefined;
      if (item.score !== undefined) {
        resolvedScore = item.score;
      } else if (item.correct === true) {
        resolvedScore = maxScore;
      } else if (item.correct === false) {
        resolvedScore = 0;
      }
      const createScore = resolvedScore ?? 0;

      const updateData: Prisma.ClassResultUncheckedUpdateInput = {
        activityType: item.activityType,
        response: responseValue,
        sessionId: resolvedSessionId,
        isManual: false,
      };
      if (resolvedScore !== undefined) {
        updateData.score = resolvedScore;
        updateData.maxScore =
          item.maxScore !== undefined ? item.maxScore : maxScore;
      } else if (item.maxScore !== undefined) {
        updateData.maxScore = item.maxScore;
      }

      await this.prisma.classResult.upsert({
        where: {
          classId_studentId_slideId: {
            classId,
            studentId: item.studentId,
            slideId: item.slideId,
          },
        },
        update: updateData,
        create: {
          classId,
          studentId: item.studentId,
          slideId: item.slideId,
          activityType: item.activityType,
          score: createScore,
          maxScore: maxScore,
          response: responseValue,
          sessionId: resolvedSessionId,
          isManual: false,
        },
      });
    }

    const n = dto.resultados.length;
    return { saved: n, guardados: n };
  }

  async getGradebook(classId: string, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const results = await this.prisma.classResult.findMany({
      where: { classId },
      select: {
        id: true,
        studentId: true,
        slideId: true,
        activityType: true,
        score: true,
        maxScore: true,
        isManual: true,
        response: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: { id: true, name: true },
        },
      },
    });

    const byStudent = new Map<
      string,
      {
        studentId: string;
        nombre: string;
        resultados: typeof results;
        sum: number;
        count: number;
      }
    >();

    for (const result of results) {
      if (!byStudent.has(result.studentId)) {
        byStudent.set(result.studentId, {
          studentId: result.studentId,
          nombre: result.student.name,
          resultados: [],
          sum: 0,
          count: 0,
        });
      }
      const entry = byStudent.get(result.studentId)!;
      entry.resultados.push(result);
      if (result.maxScore > 0) {
        entry.sum += (result.score / result.maxScore) * 5.0;
        entry.count += 1;
      }
    }

    return Array.from(byStudent.values()).map(
      ({ studentId, nombre, resultados, sum, count }) => ({
        studentId,
        nombre,
        promedio: count > 0 ? Number((sum / count).toFixed(2)) : 0,
        resultados,
      }),
    );
  }

  async saveManualGrade(classId: string, dto: NotaManualDto, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    return this.prisma.classResult.upsert({
      where: {
        classId_studentId_slideId: {
          classId,
          studentId: dto.studentId,
          slideId: dto.slideId,
        },
      },
      create: {
        classId,
        studentId: dto.studentId,
        slideId: dto.slideId,
        activityType: 'manual',
        score: dto.score,
        maxScore: 5.0,
        isManual: true,
      },
      update: {
        score: dto.score,
        maxScore: 5.0,
        isManual: true,
      },
    });
  }

  // ─── SLIDES ────────────────────────────────────────────

  async addSlide(classId: string, dto: CreateSlideDto, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

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

    await this.prisma.slide.delete({ where: { id: slideId } });

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
      throw new NotFoundException(
        'Uno o más slides no pertenecen a esta clase',
      );

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
        Array.from({ length: 6 }, () =>
          chars[Math.floor(Math.random() * chars.length)],
        )
          .join('')
          .toUpperCase();
      existe = !!(await this.prisma.class.findFirst({
        where: {
          codigo: {
            equals: codigo,
            mode: 'insensitive',
          },
        },
      }));
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
}
