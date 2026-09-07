import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import {
  GuardarResultadosDto,
  EndSessionDto,
  StudentResultDto,
} from './dto/save-results.dto';
import { NotaManualDto } from './dto/save-manual-grade.dto';
import { JoinAsGuestDto } from './dto/join-as-guest.dto';
import {
  activityTipoFromSlideContent,
  computeClassGradebookPromedio,
  esEvaluable,
  evaluateActivityResponse,
  extractActivityDefinition,
} from './class-results-gradebook.helper';
import { isActivityDraftResponse } from '@lumina/scoring';
import {
  CLASS_RESULT_MAX_SCORE_DEFAULT,
  resolvePersistedClassResultScore,
  resolvePersistedMaxScore,
  toPersistedResponseJson,
  toPrismaJsonValue,
} from './class-result-persist.helper';
import { namesMatch } from '../autonomous-sessions/name-matcher.helper';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly analyticsService: AnalyticsService,
    private readonly sessionGamification: SessionGamificationService,
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
            contentVersion: true,
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

    await this.prisma.classGuest.create({
      data: {
        classId: clase.id,
        userId: user.id,
      },
    });

    return {
      classId: clase.id,
      className: clase.title,
      studentId: user.id,
      studentName: user.name,
    };
  }

  /**
   * ¿Este studentId sigue sirviendo como guest de esta clase?
   * Público (mismo nivel de confianza que join/:codigo/guest).
   * No crea usuarios; solo evita duplicar un guest que ya existe.
   * El vínculo es por clase (ClassGuest al unirse y/o ClassResult si ya respondió).
   */
  async verifyGuestStudent(
    classId: string,
    studentId: string,
  ): Promise<{ valid: false } | { valid: true; studentName: string }> {
    const invalid = { valid: false as const };
    const id = classId?.trim();
    const userId = studentId?.trim();
    if (!id || !userId) return invalid;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isActive: true },
    });
    if (!user || user.isActive === false) return invalid;

    const result = await this.prisma.classResult.findFirst({
      where: { classId: id, studentId: user.id },
      select: { id: true },
    });
    if (result) {
      return { valid: true, studentName: user.name };
    }

    const isGuestEmail = /^guest_.+@lumina\.guest$/i.test(user.email);
    if (!isGuestEmail) return invalid;

    const guestJoin = await this.prisma.classGuest.findUnique({
      where: { classId_userId: { classId: id, userId: user.id } },
      select: { id: true },
    });
    if (!guestJoin) return invalid;

    return { valid: true, studentName: user.name };
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
        modoEntrega: true,
        timerGlobal: true,
        background: true,
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
            contentVersion: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    const activeSession = await this.prisma.classSession.findFirst({
      where: { classId: id, endedAt: null },
      select: { id: true },
      orderBy: { startedAt: 'desc' },
    });

    return {
      ...cls,
      sessionActive: Boolean(activeSession),
      activeSessionId: activeSession?.id ?? null,
    };
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
        background: true,
        timerGlobal: true,
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
      try {
        const slideCount = await this.prisma.slide.count({
          where: { classId: id },
        });
        await this.analyticsService.createSessionLog({
          sessionId: activeSession.id,
          classId: id,
          courseId: cls.courseId,
          teacherId: userId,
          totalSlides: slideCount,
          startedAt: activeSession.startedAt,
        });
      } catch {
        /* analytics no rompe el flujo */
      }
      return activeSession;
    }

    const newSession = await this.prisma.classSession.create({
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

    try {
      const slideCount = await this.prisma.slide.count({
        where: { classId: id },
      });
      await this.analyticsService.createSessionLog({
        sessionId: newSession.id,
        classId: id,
        courseId: cls.courseId,
        teacherId: userId,
        totalSlides: slideCount,
        startedAt: newSession.startedAt,
      });
    } catch {
      /* analytics no rompe el flujo */
    }

    return newSession;
  }

  async endSession(id: string, userId: string, dto?: EndSessionDto) {
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

    const explicitSessionId = dto?.sessionId?.trim();
    if (explicitSessionId && explicitSessionId !== activeSession.id) {
      throw new BadRequestException(
        'Solo se pueden guardar resultados de la sesión activa.',
      );
    }

    const resultados = (dto?.resultados ?? []).filter((r) => !!r.studentId);
    const endedAt = new Date();
    const updated = await this.prisma.$transaction(
      async (tx) => {
        if (resultados.length > 0) {
          await this.persistClassResults(tx, id, activeSession.id, resultados);
        }
        return tx.classSession.update({
          where: { id: activeSession.id },
          data: { endedAt },
          select: {
            id: true,
            classId: true,
            startedAt: true,
            endedAt: true,
          },
        });
      },
      { timeout: 15_000 },
    );

    try {
      await this.analyticsService.closeSessionLog(activeSession.id, endedAt);
    } catch {
      /* no-op */
    }

    try {
      await this.sessionGamification.terminarSesion(activeSession.id);
    } catch {
      /* no-op */
    }

    if (resultados.length > 0) {
      await this.recordResultsEngagement(id, activeSession.id, resultados);
    }

    return updated;
  }

  // ─── RESULTADOS ────────────────────────────────────────

  async saveResults(classId: string, dto: GuardarResultadosDto) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    const writeSessionId = await this.resolveWriteSessionId(classId, dto);

    await this.prisma.$transaction(
      async (tx) => {
        await this.persistClassResults(
          tx,
          classId,
          writeSessionId,
          dto.resultados,
        );
      },
      { timeout: 15_000 },
    );

    await this.recordResultsEngagement(classId, writeSessionId, dto.resultados);

    const n = dto.resultados.length;
    return { saved: n, guardados: n };
  }

  async getGradebook(classId: string, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const sessionId = await this.resolveGradebookSessionId(classId);

    const activitySlides = await this.prisma.slide.findMany({
      where: { classId },
      select: { id: true, content: true },
      orderBy: { order: 'asc' },
    });
    const evaluableSlides = activitySlides
      .map((s) => ({
        slideId: s.id,
        activityType: activityTipoFromSlideContent(s.content) ?? '',
      }))
      .filter((s) => esEvaluable(s.activityType));

    const autonomousGrades = await this.prisma.autonomousGrade.findMany({
      where: { classId, source: 'autonomous' },
      orderBy: { completedAt: 'asc' },
    });

    type GradebookRow = {
      studentId: string;
      nombre: string;
      promedio: number | null;
      resultados: any[];
      source: 'live' | 'autonomous';
    };

    const liveRows: GradebookRow[] = [];

    if (sessionId) {
      const results = await this.prisma.classResult.findMany({
        where: { classId, sessionId },
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
        orderBy: { updatedAt: 'asc' },
      });

      const byStudent = new Map<
        string,
        {
          studentId: string;
          nombre: string;
          resultados: typeof results;
          resultBySlideId: Map<
            string,
            {
              activityType: string;
              score: number | null;
              maxScore: number;
              isManual: boolean;
            }
          >;
        }
      >();

      for (const result of results) {
        let entry = byStudent.get(result.studentId);
        if (!entry) {
          entry = {
            studentId: result.studentId,
            nombre: result.student.name,
            resultados: [],
            resultBySlideId: new Map(),
          };
          byStudent.set(result.studentId, entry);
        }
        entry.resultados.push(result);
        entry.resultBySlideId.set(result.slideId, {
          activityType: result.activityType,
          score: result.score,
          maxScore: result.maxScore,
          isManual: result.isManual,
        });
      }

      for (const {
        studentId,
        nombre,
        resultados,
        resultBySlideId,
      } of byStudent.values()) {
        const entries = evaluableSlides.map((slide) => {
          const row = resultBySlideId.get(slide.slideId);
          return {
            activityType: row?.activityType || slide.activityType,
            score: row?.score ?? null,
            hasResult: resultBySlideId.has(slide.slideId),
            isManual: row?.isManual,
            maxScore: row?.maxScore ?? 5,
          };
        });
        liveRows.push({
          studentId,
          nombre,
          promedio: computeClassGradebookPromedio(entries),
          resultados,
          source: 'live',
        });
      }
    }

    const liveNames = liveRows.map((r) => r.nombre);

    const autonomousRows: GradebookRow[] = autonomousGrades
      .filter(
        (grade) =>
          !liveNames.some((name) => namesMatch(grade.studentName, name)),
      )
      .map((grade) => ({
        studentId: grade.studentId,
        nombre: grade.studentName,
        promedio: grade.score,
        resultados: [],
        source: 'autonomous' as const,
      }));

    return {
      actividades: evaluableSlides.map((s) => ({
        slideId: s.slideId,
        activityType: s.activityType,
        esManual: s.activityType === 'short_answer',
      })),
      estudiantes: [...liveRows, ...autonomousRows],
    };
  }

  async saveManualGrade(classId: string, dto: NotaManualDto, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const sessionId = await this.resolveManualWriteSessionId(
      classId,
      dto.sessionId,
    );

    return this.prisma.classResult.upsert({
      where: {
        classId_studentId_slideId_sessionId: {
          classId,
          studentId: dto.studentId,
          slideId: dto.slideId,
          sessionId,
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
        sessionId,
      },
      update: {
        score: dto.score,
        maxScore: 5.0,
        isManual: true,
      },
    });
  }

  async updateResultScore(
    classId: string,
    resultId: string,
    score: number,
    userId: string,
  ) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const result = await this.prisma.classResult.findFirst({
      where: { id: resultId, classId },
    });
    if (!result) throw new NotFoundException('Resultado no encontrado');

    // Solo score + isManual. El response original no se toca (auditoría Fase 3.4).
    return this.prisma.classResult.update({
      where: { id: resultId },
      data: { score, isManual: true },
    });
  }

  /**
   * Upsert incremental (Fase 3.5): persiste cada student-response en vivo
   * sin cerrar la sesión. No toca isManual ni el score si el docente ya calificó.
   * No reimplementa evaluación: llama a evaluateActivityResponse tal cual (Fase 2).
   */
  async upsertLiveStudentResponse(data: {
    classId: string;
    slideId: string;
    activityType: string;
    studentId: string;
    correct?: boolean | null;
    response?: unknown;
  }): Promise<void> {
    const classId = data.classId?.trim();
    const slideId = data.slideId?.trim();
    const studentId = data.studentId?.trim();
    const activityType = data.activityType?.trim();
    if (!classId || !slideId || !studentId || !activityType) return;
    // Torneo y Escape Room son gamificación narrativa (`exclude` en activity-scoring):
    // persistirlos aquí solo crearía filas con score/correct null en class_results.
    if (activityType === 'torneo' || activityType === 'escape_room') return;
    if (isActivityDraftResponse(data.response)) return;

    const [active, user] = await Promise.all([
      this.prisma.classSession.findFirst({
        where: { classId, endedAt: null },
        orderBy: { startedAt: 'desc' },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true },
      }),
    ]);
    if (!active || !user) return;

    const slide = await this.prisma.slide.findFirst({
      where: { id: slideId, classId },
      select: { content: true },
    });
    const definicion = extractActivityDefinition(slide?.content);
    const evaluated = evaluateActivityResponse(
      activityType,
      definicion ?? { tipo: activityType },
      data.response,
    );
    const persistItem = {
      activityType,
      score: evaluated.score,
      correct: evaluated.correct,
      maxScore: CLASS_RESULT_MAX_SCORE_DEFAULT,
      response: data.response,
    };
    const responseValue = toPrismaJsonValue(
      toPersistedResponseJson(persistItem),
    );
    const score = resolvePersistedClassResultScore(persistItem);
    const maxScore = resolvePersistedMaxScore(persistItem);

    const existing = await this.prisma.classResult.findUnique({
      where: {
        classId_studentId_slideId_sessionId: {
          classId,
          studentId,
          slideId,
          sessionId: active.id,
        },
      },
      select: { isManual: true },
    });

    await this.prisma.classResult.upsert({
      where: {
        classId_studentId_slideId_sessionId: {
          classId,
          studentId,
          slideId,
          sessionId: active.id,
        },
      },
      update: existing?.isManual
        ? { activityType, response: responseValue }
        : {
            activityType,
            response: responseValue,
            score,
            maxScore,
          },
      create: {
        classId,
        studentId,
        slideId,
        activityType,
        score,
        maxScore,
        response: responseValue,
        sessionId: active.id,
        isManual: false,
      },
    });
  }

  private async persistClassResults(
    db: { classResult: PrismaService['classResult'] },
    classId: string,
    writeSessionId: string,
    items: StudentResultDto[],
  ) {
    for (const item of items) {
      const responseValue = toPrismaJsonValue(toPersistedResponseJson(item));
      const maxScore = resolvePersistedMaxScore(item);
      const score = resolvePersistedClassResultScore(item);
      await db.classResult.upsert({
        where: {
          classId_studentId_slideId_sessionId: {
            classId,
            studentId: item.studentId,
            slideId: item.slideId,
            sessionId: writeSessionId,
          },
        },
        update: {
          activityType: item.activityType,
          response: responseValue,
          sessionId: writeSessionId,
          score,
          maxScore,
        },
        create: {
          classId,
          studentId: item.studentId,
          slideId: item.slideId,
          activityType: item.activityType,
          score,
          maxScore,
          response: responseValue,
          sessionId: writeSessionId,
          isManual: false,
        },
      });
    }
  }

  private async recordResultsEngagement(
    classId: string,
    sessionId: string,
    items: StudentResultDto[],
  ) {
    const studentIds = [...new Set(items.map((r) => r.studentId))];
    const [users, slidesMeta] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, lastName: true },
      }),
      this.prisma.slide.findMany({
        where: { classId },
        select: { id: true, order: true },
      }),
    ]);
    const studentNameById = new Map(
      users.map((u) => [u.id, `${u.name} ${u.lastName}`.trim()]),
    );
    const slideOrderById = new Map(slidesMeta.map((s) => [s.id, s.order]));

    for (const item of items) {
      try {
        const slideIndex =
          item.slideIndex ?? slideOrderById.get(item.slideId) ?? 0;
        const responded =
          (item.score !== undefined && item.score !== null) ||
          item.correct === true ||
          item.correct === false;
        await this.analyticsService.recordSlideEngagement({
          sessionId,
          slideId: item.slideId,
          slideIndex,
          activityType: item.activityType,
          studentId: item.studentId,
          studentName: studentNameById.get(item.studentId) ?? '',
          responded,
          source: 'live',
        });
      } catch {
        /* no-op */
      }
    }
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
        contentVersion: true,
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

    const data: Prisma.SlideUpdateManyMutationInput = {
      contentVersion: { increment: 1 },
    };
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) {
      data.content = dto.content as Prisma.InputJsonValue;
    }

    // Optimistic locking: updateMany con where de versión → 0 filas = conflicto
    if (dto.expectedVersion !== undefined) {
      const result = await this.prisma.slide.updateMany({
        where: {
          id: slideId,
          classId,
          contentVersion: dto.expectedVersion,
        },
        data,
      });
      if (result.count === 0) {
        const current = await this.prisma.slide.findFirst({
          where: { id: slideId, classId },
          select: { contentVersion: true },
        });
        if (!current) {
          throw new NotFoundException('Slide no encontrado');
        }
        throw new ConflictException({
          message:
            'Conflicto de versión: el slide fue modificado por otra sesión',
          currentVersion: current.contentVersion,
          expectedVersion: dto.expectedVersion,
        });
      }
      return this.prisma.slide.findUniqueOrThrow({ where: { id: slideId } });
    }

    // Compat: sin expectedVersion sigue last-write-wins, pero incrementa versión
    return this.prisma.slide.update({
      where: { id: slideId },
      data,
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

  async getSlideVersions(classId: string, slideId: string, userId: string) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const slide = await this.prisma.slide.findFirst({
      where: { id: slideId, classId },
      select: { id: true },
    });
    if (!slide) throw new NotFoundException('Slide no encontrado');

    return this.prisma.slideVersion.findMany({
      where: { slideId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        slideId: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async createSlideVersion(
    classId: string,
    slideId: string,
    content: Record<string, unknown>,
    userId: string,
  ) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const slide = await this.prisma.slide.findFirst({
      where: { id: slideId, classId },
      select: { id: true },
    });
    if (!slide) throw new NotFoundException('Slide no encontrado');

    const created = await this.prisma.slideVersion.create({
      data: {
        slideId,
        content: content as Prisma.InputJsonValue,
      },
    });

    const excess = await this.prisma.slideVersion.findMany({
      where: { slideId },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      select: { id: true },
    });
    if (excess.length > 0) {
      await this.prisma.slideVersion.deleteMany({
        where: { id: { in: excess.map((v) => v.id) } },
      });
    }

    return created;
  }

  async restoreSlideVersion(
    classId: string,
    slideId: string,
    versionId: string,
    userId: string,
  ) {
    const cls = await this.findOneRaw(classId);
    await this.verifyTeacherOwnership(cls.courseId, userId);

    const slide = await this.prisma.slide.findFirst({
      where: { id: slideId, classId },
      select: { id: true },
    });
    if (!slide) throw new NotFoundException('Slide no encontrado');

    const version = await this.prisma.slideVersion.findFirst({
      where: { id: versionId, slideId },
    });
    if (!version) throw new NotFoundException('Versión no encontrada');

    return this.prisma.slide.update({
      where: { id: slideId },
      data: {
        content: version.content as Prisma.InputJsonValue,
        contentVersion: { increment: 1 },
      },
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
        Array.from(
          { length: 6 },
          () => chars[Math.floor(Math.random() * chars.length)],
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

  private async ensureSessionBelongsToClass(
    classId: string,
    sessionId: string,
  ): Promise<void> {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, classId },
      select: { id: true },
    });
    if (!session) {
      throw new BadRequestException('La sesión no pertenece a esta clase.');
    }
  }

  /** Solo se puede guardar en una sesión activa (endedAt: null). */
  private async resolveWriteSessionId(
    classId: string,
    dto: GuardarResultadosDto,
  ): Promise<string> {
    const active = await this.prisma.classSession.findFirst({
      where: { classId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });

    if (!active) {
      throw new BadRequestException(
        'No hay una sesión activa para esta clase.',
      );
    }

    let explicit = dto.sessionId?.trim();
    if (!explicit) {
      for (const r of dto.resultados) {
        const t = r.sessionId?.trim();
        if (t) {
          explicit = t;
          break;
        }
      }
    }

    if (explicit && explicit !== active.id) {
      throw new BadRequestException(
        'Solo se pueden guardar resultados de la sesión activa.',
      );
    }

    return active.id;
  }

  private async resolveManualWriteSessionId(
    classId: string,
    explicitFromDto?: string,
  ): Promise<string> {
    const trimmed = explicitFromDto?.trim();
    const active = await this.prisma.classSession.findFirst({
      where: { classId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });

    if (active) {
      if (trimmed && trimmed !== active.id) {
        throw new BadRequestException(
          'Solo se pueden registrar notas manuales en la sesión activa.',
        );
      }
      return active.id;
    }

    if (!trimmed) {
      throw new BadRequestException(
        'Indica sessionId o activa una sesión para la calificación manual.',
      );
    }

    await this.ensureSessionBelongsToClass(classId, trimmed);
    return trimmed;
  }

  /** Gradebook: sesión en vivo, o la última sesión ya cerrada. */
  private async resolveGradebookSessionId(
    classId: string,
  ): Promise<string | null> {
    const active = await this.prisma.classSession.findFirst({
      where: { classId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });
    if (active) {
      return active.id;
    }

    const latestEnded = await this.prisma.classSession.findFirst({
      where: { classId, endedAt: { not: null } },
      orderBy: { endedAt: 'desc' },
      select: { id: true },
    });
    return latestEnded?.id ?? null;
  }
}
