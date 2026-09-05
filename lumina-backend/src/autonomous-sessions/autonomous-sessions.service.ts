import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutonomousSessionDto } from './dto/create-autonomous-session.dto';
import { UpdateAutonomousSessionDto } from './dto/update-autonomous-session.dto';
import { JoinAutonomousSessionDto } from './dto/join-autonomous-session.dto';
import { SaveProgressDto, CompleteSessionDto } from './dto/save-progress.dto';
import { namesMatch } from './name-matcher.helper';
import {
  extractActivityDefinition,
  scoreActivityResponse,
} from '../classes/class-results-gradebook.helper';
import { toPrismaJsonValue } from '../classes/class-result-persist.helper';

function getDesempeno(score: number): string {
  if (score >= 4.7) return 'Superior';
  if (score >= 4.0) return 'Alto';
  if (score >= 3.0) return 'B?sico';
  return 'Bajo';
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type VideoAnswerEntry = { questionIndex: number; answer: string };

function extractVideoAnswerEntries(response: unknown): VideoAnswerEntry[] {
  if (!response || typeof response !== 'object') return [];
  const asRecord = response as Record<string, unknown>;
  const rawHistorial = asRecord.historial;
  if (Array.isArray(rawHistorial)) {
    return rawHistorial
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const o = item as Record<string, unknown>;
        const questionIndex =
          typeof o.questionIndex === 'number' ? o.questionIndex : NaN;
        const answer = typeof o.answer === 'string' ? o.answer : '';
        if (!Number.isFinite(questionIndex) || !answer.trim()) return null;
        return { questionIndex, answer };
      })
      .filter((x): x is VideoAnswerEntry => x !== null);
  }

  const questionIndex =
    typeof asRecord.questionIndex === 'number' ? asRecord.questionIndex : NaN;
  const answer = typeof asRecord.answer === 'string' ? asRecord.answer : '';
  if (!Number.isFinite(questionIndex) || !answer.trim()) return [];
  return [{ questionIndex, answer }];
}

function mergeVideoInteractiveResponse(
  existing: unknown,
  incoming: unknown,
): unknown {
  const mergedByQuestion = new Map<number, string>();
  for (const entry of extractVideoAnswerEntries(existing)) {
    mergedByQuestion.set(entry.questionIndex, entry.answer);
  }
  for (const entry of extractVideoAnswerEntries(incoming)) {
    // Latest answer per question wins.
    mergedByQuestion.set(entry.questionIndex, entry.answer);
  }
  const historial = Array.from(mergedByQuestion.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([questionIndex, answer]) => ({ questionIndex, answer }));
  return { historial };
}

@Injectable()
export class AutonomousSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    classId: string,
    teacherId: string,
    dto: CreateAutonomousSessionDto,
  ) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    const opensAt = new Date(dto.opensAt);
    const closesAt = new Date(dto.closesAt);
    if (opensAt >= closesAt)
      throw new BadRequestException('opensAt debe ser anterior a closesAt');

    const pin = dto.pin ?? generatePin();

    return this.prisma.autonomousSession.create({
      data: {
        classId,
        teacherId,
        opensAt,
        closesAt,
        pin,
        allowBackNav: dto.allowBackNav ?? true,
        maxAttempts: dto.maxAttempts ?? 1,
        timerBehavior: dto.timerBehavior ?? 'advance',
        requireManualStart: dto.requireManualStart ?? false,
        purpose: dto.purpose ?? 'independent',
      },
    });
  }

  async findAllByClass(classId: string) {
    const sessions = await this.prisma.autonomousSession.findMany({
      where: { classId },
      include: {
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const updates: Promise<any>[] = [];

    for (const session of sessions) {
      let newStatus = session.status;
      if (session.status === 'scheduled' && session.opensAt <= now) {
        newStatus = 'open';
      } else if (session.status === 'open' && session.closesAt <= now) {
        newStatus = 'closed';
      }
      if (newStatus !== session.status) {
        updates.push(
          this.prisma.autonomousSession.update({
            where: { id: session.id },
            data: { status: newStatus },
          }),
        );
        session.status = newStatus;
      }
    }

    if (updates.length > 0) await Promise.all(updates);

    return sessions;
  }

  async findOne(sessionId: string) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            description: true,
            codigo: true,
            slides: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesi?n aut?noma no encontrada');

    const now = new Date();
    let updatedStatus = session.status;

    if (session.status === 'scheduled' && session.opensAt <= now) {
      updatedStatus = 'open';
    } else if (session.status === 'open' && session.closesAt <= now) {
      updatedStatus = 'closed';
      await this.prisma.autonomousResult.updateMany({
        where: { sessionId, status: 'in_progress' },
        data: { status: 'expired' },
      });
    }

    if (updatedStatus !== session.status) {
      await this.prisma.autonomousSession.update({
        where: { id: sessionId },
        data: { status: updatedStatus },
      });
      session.status = updatedStatus;
    }

    return session;
  }

  async join(sessionId: string, dto: JoinAutonomousSessionDto) {
    const session = await this.findOne(sessionId);
    if (session.status !== 'open') {
      throw new BadRequestException('La sesi?n no est? abierta');
    }

    if (dto.pin !== session.pin) {
      throw new ForbiddenException('PIN incorrecto');
    }

    if (session.purpose === 'recovery') {
      const classResults = await this.prisma.classResult.findMany({
        where: { classId: session.classId },
        include: { student: { select: { name: true, lastName: true } } },
        distinct: ['studentId'],
      });

      for (const result of classResults) {
        const fullName = `${result.student.name} ${result.student.lastName}`;
        if (namesMatch(dto.studentName, fullName)) {
          throw new ForbiddenException(
            'Ya tienes una nota registrada para esta clase. Consulta con tu docente.',
          );
        }
      }

      const existingGrades = await this.prisma.autonomousGrade.findMany({
        where: { classId: session.classId },
      });

      for (const grade of existingGrades) {
        if (namesMatch(dto.studentName, grade.studentName)) {
          throw new ForbiddenException(
            'Ya tienes una nota registrada para esta clase. Consulta con tu docente.',
          );
        }
      }
    }

    const allResults = await this.prisma.autonomousResult.findMany({
      where: { sessionId },
    });

    const matchedResult = allResults.find((r) =>
      namesMatch(dto.studentName, r.studentName),
    );

    if (matchedResult) {
      const studentId = matchedResult.studentId;
      const studentResults = allResults.filter(
        (r) => r.studentId === studentId,
      );

      const completedCount = studentResults.filter(
        (r) => r.status === 'completed',
      ).length;
      if (session.maxAttempts !== -1 && completedCount >= session.maxAttempts) {
        throw new ForbiddenException('Ya completaste esta tarea');
      }

      const inProgress = studentResults.find((r) => r.status === 'in_progress');
      if (inProgress) {
        const existingProgress = await this.prisma.autonomousProgress.findMany({
          where: {
            sessionId,
            studentId,
            attemptNumber: inProgress.attemptNumber,
          },
          orderBy: { answeredAt: 'asc' },
        });
        return {
          session,
          studentId,
          attemptNumber: inProgress.attemptNumber,
          existingProgress,
          resuming: true,
        };
      }

      const maxAttemptNumber = Math.max(
        ...studentResults.map((r) => r.attemptNumber),
        0,
      );
      const attemptNumber = maxAttemptNumber + 1;

      await this.prisma.autonomousResult.create({
        data: {
          sessionId,
          studentId,
          studentName: matchedResult.studentName,
          attemptNumber,
          status: 'in_progress',
        },
      });

      return {
        session,
        studentId,
        attemptNumber,
        existingProgress: [],
        resuming: false,
      };
    }

    const studentId = nanoid();
    await this.prisma.autonomousResult.create({
      data: {
        sessionId,
        studentId,
        studentName: dto.studentName,
        attemptNumber: 1,
        status: 'in_progress',
      },
    });

    return {
      session,
      studentId,
      attemptNumber: 1,
      existingProgress: [],
      resuming: false,
    };
  }

  async saveProgress(sessionId: string, dto: SaveProgressDto) {
    if (!dto.activityType) return { saved: true };

    const existing = await this.prisma.autonomousProgress.findFirst({
      where: {
        sessionId,
        studentId: dto.studentId,
        slideId: dto.slideId,
        attemptNumber: dto.attemptNumber,
      },
    });

    let responseToStore: unknown = dto.response;
    if (
      dto.activityType === 'video_interactivo' &&
      dto.response !== null &&
      dto.response !== undefined
    ) {
      responseToStore = mergeVideoInteractiveResponse(
        existing?.response,
        dto.response,
      );
    }

    // Compute score immediately when activityType is provided (never on drafts)
    let computedScore: number | null = null;
    if (dto.activityType && dto.draft !== true) {
      const slide = await this.prisma.slide.findUnique({
        where: { id: dto.slideId },
        select: { content: true },
      });
      if (slide) {
        const actividad = extractActivityDefinition(slide.content);
        computedScore = scoreActivityResponse(
          dto.activityType,
          responseToStore ?? null,
          actividad,
        );
      }
    }

    // Si ya existe con score calculado y la nueva response es null → no actualizar
    if (
      existing?.score !== null &&
      existing?.score !== undefined &&
      dto.response === null
    ) {
      return { saved: true };
    }

    if (existing) {
      // Only overwrite activityType/score when activityType is explicitly provided
      await this.prisma.autonomousProgress.update({
        where: { id: existing.id },
        data: {
          response: toPrismaJsonValue(responseToStore),
          answeredAt: new Date(),
          ...(dto.activityType !== undefined
            ? {
                activityType: dto.activityType,
                ...(dto.draft !== true ? { score: computedScore } : {}),
              }
            : {}),
        },
      });
    } else {
      const result = await this.prisma.autonomousResult.findFirst({
        where: {
          sessionId,
          studentId: dto.studentId,
          attemptNumber: dto.attemptNumber,
        },
        select: { studentName: true },
      });
      await this.prisma.autonomousProgress.create({
        data: {
          sessionId,
          studentId: dto.studentId,
          studentName: result?.studentName ?? '',
          slideId: dto.slideId,
          response: toPrismaJsonValue(responseToStore),
          attemptNumber: dto.attemptNumber,
          activityType: dto.activityType,
          score: computedScore,
        },
      });
    }

    return { saved: true };
  }

  async complete(sessionId: string, dto: CompleteSessionDto) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      select: { id: true, classId: true, purpose: true },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const result = await this.prisma.autonomousResult.findFirst({
      where: {
        sessionId,
        studentId: dto.studentId,
        attemptNumber: dto.attemptNumber,
      },
    });
    if (!result) throw new NotFoundException('Resultado no encontrado');

    const progressEntries = await this.prisma.autonomousProgress.findMany({
      where: {
        sessionId,
        studentId: dto.studentId,
        attemptNumber: dto.attemptNumber,
      },
    });

    // Prefer pre-computed per-slide scores (saved at saveProgress time)
    const scoredEntries = progressEntries.filter(
      (p) => p.activityType !== null && p.score !== null,
    );

    let finalScore: number;

    if (scoredEntries.length > 0) {
      const total = scoredEntries.reduce((acc, p) => acc + (p.score ?? 0), 0);
      finalScore = Math.round((total / scoredEntries.length) * 100) / 100;
    } else {
      // Fallback: recompute from class slides + raw responses
      const classData = await this.prisma.class.findUnique({
        where: { id: session.classId },
        include: { slides: { orderBy: { order: 'asc' } } },
      });

      const progressBySlide = new Map(
        progressEntries.map((p) => [p.slideId, p]),
      );
      const activitySlides: {
        slideId: string;
        activityType: string;
        activityDef: unknown;
      }[] = [];

      for (const slide of classData?.slides ?? []) {
        const actividad = extractActivityDefinition(slide.content);
        if (!actividad) continue;
        const tipo = actividad.tipo;
        if (typeof tipo !== 'string' || !tipo.trim()) continue;
        activitySlides.push({
          slideId: slide.id,
          activityType: tipo,
          activityDef: actividad,
        });
      }

      if (activitySlides.length === 0) {
        finalScore = 1.0;
      } else {
        const scores = activitySlides.map(
          ({ slideId, activityType, activityDef }) => {
            const entry = progressBySlide.get(slideId);
            return scoreActivityResponse(
              activityType,
              entry?.response ?? null,
              activityDef,
            );
          },
        );
        const total = scores.reduce((acc, s) => acc + s, 0);
        finalScore = Math.round((total / scores.length) * 100) / 100;
      }
    }

    const desempeno = getDesempeno(finalScore);

    await this.prisma.autonomousResult.update({
      where: { id: result.id },
      data: { status: 'completed', finalScore, completedAt: new Date() },
    });

    if (session.purpose === 'recovery') {
      await this.prisma.autonomousGrade.create({
        data: {
          sessionId,
          classId: session.classId,
          studentId: result.studentId,
          studentName: result.studentName,
          score: finalScore,
          source: 'autonomous',
          completedAt: new Date(),
        },
      });
    }

    return { finalScore, desempeno };
  }

  async update(
    sessionId: string,
    teacherId: string,
    dto: UpdateAutonomousSessionDto,
  ) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        teacherId: true,
        status: true,
        opensAt: true,
        closesAt: true,
      },
    });
    if (!session) throw new NotFoundException('Sesi?n aut?noma no encontrada');
    if (session.teacherId !== teacherId)
      throw new ForbiddenException('Sin permiso');

    const data: Record<string, unknown> = {};

    if (dto.opensAt !== undefined) {
      if (session.status !== 'scheduled') {
        throw new BadRequestException(
          'Solo se puede cambiar la apertura mientras la tarea est? programada',
        );
      }
      data.opensAt = new Date(dto.opensAt);
    }
    if (dto.closesAt !== undefined) {
      data.closesAt = new Date(dto.closesAt);
    }

    if (dto.opensAt !== undefined || dto.closesAt !== undefined) {
      const nextOpens =
        dto.opensAt !== undefined ? new Date(dto.opensAt) : session.opensAt;
      const nextCloses =
        dto.closesAt !== undefined ? new Date(dto.closesAt) : session.closesAt;
      if (nextCloses <= nextOpens) {
        throw new BadRequestException('closesAt debe ser posterior a opensAt');
      }
    }

    if (dto.allowBackNav !== undefined) data.allowBackNav = dto.allowBackNav;
    if (dto.timerBehavior !== undefined) data.timerBehavior = dto.timerBehavior;
    if (dto.maxAttempts !== undefined) data.maxAttempts = dto.maxAttempts;

    return this.prisma.autonomousSession.update({
      where: { id: sessionId },
      data,
    });
  }

  async remove(sessionId: string, teacherId: string) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      select: { id: true, teacherId: true, status: true },
    });
    if (!session) throw new NotFoundException('Sesi?n aut?noma no encontrada');
    if (session.teacherId !== teacherId)
      throw new ForbiddenException('Sin permiso');

    if (session.status === 'open') {
      throw new BadRequestException('No se puede cancelar una tarea abierta');
    }

    await this.prisma.autonomousProgress.deleteMany({ where: { sessionId } });
    await this.prisma.autonomousResult.deleteMany({ where: { sessionId } });
    await this.prisma.autonomousSession.delete({ where: { id: sessionId } });

    return { deleted: true };
  }

  async getResults(sessionId: string, teacherId: string) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      select: { teacherId: true },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.teacherId !== teacherId)
      throw new ForbiddenException('Sin permiso');

    const [results, progress] = await Promise.all([
      this.prisma.autonomousResult.findMany({
        where: { sessionId },
        orderBy: [{ studentName: 'asc' }, { attemptNumber: 'asc' }],
      }),
      this.prisma.autonomousProgress.findMany({
        where: { sessionId },
        orderBy: { answeredAt: 'asc' },
      }),
    ]);

    return results.map((r) => {
      const studentProgress = progress.filter(
        (p) =>
          p.studentId === r.studentId && p.attemptNumber === r.attemptNumber,
      );

      const resultados = studentProgress
        .filter((p) => p.activityType !== null && p.score !== null)
        .map((p) => ({
          id: p.id,
          slideId: p.slideId,
          activityType: p.activityType,
          score: p.score,
          maxScore: 5,
          isManual:
            p.activityType === 'short_answer' ||
            p.activityType === 'encuesta_viva' ||
            p.activityType === 'nube_palabras',
        }));

      const promedioFromProgress =
        resultados.length > 0
          ? Math.round(
              (resultados.reduce((acc, item) => acc + item.score, 0) /
                resultados.length) *
                100,
            ) / 100
          : null;

      return {
        studentId: r.studentId,
        nombre: r.studentName,
        // Use live aggregate from progress so manual score edits are reflected immediately.
        promedio: promedioFromProgress ?? r.finalScore ?? 0,
        source: 'autonomous' as const,
        resultados,
      };
    });
  }

  async updateProgressScore(
    sessionId: string,
    progressId: string,
    teacherId: string,
    score: number,
  ) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      select: { id: true, teacherId: true },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.teacherId !== teacherId)
      throw new ForbiddenException('Sin permiso');

    const progress = await this.prisma.autonomousProgress.findUnique({
      where: { id: progressId },
      select: { id: true, sessionId: true },
    });
    if (!progress || progress.sessionId !== sessionId) {
      throw new NotFoundException('Progreso no encontrado para esta sesión');
    }

    const roundedScore = Math.round(score * 10) / 10;
    const updatedProgress = await this.prisma.autonomousProgress.update({
      where: { id: progressId },
      data: { score: roundedScore },
    });

    const allAttemptProgress = await this.prisma.autonomousProgress.findMany({
      where: {
        sessionId,
        studentId: updatedProgress.studentId,
        attemptNumber: updatedProgress.attemptNumber,
        activityType: { not: null },
        score: { not: null },
      },
      select: { score: true },
    });
    const recomputedFinal =
      allAttemptProgress.length > 0
        ? Math.round(
            (allAttemptProgress.reduce((acc, p) => acc + (p.score ?? 0), 0) /
              allAttemptProgress.length) *
              100,
          ) / 100
        : null;

    await this.prisma.autonomousResult.updateMany({
      where: {
        sessionId,
        studentId: updatedProgress.studentId,
        attemptNumber: updatedProgress.attemptNumber,
      },
      data: { finalScore: recomputedFinal ?? undefined },
    });

    return { updated: true, id: progressId, score: roundedScore };
  }
}
