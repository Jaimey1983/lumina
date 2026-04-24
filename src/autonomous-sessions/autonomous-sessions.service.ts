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
import { sumAndDenominatorForClassGradebook } from '../classes/class-results-gradebook.helper';
import { namesMatch } from './name-matcher.helper';

function getDesempeno(score: number): string {
  if (score >= 4.7) return 'Superior';
  if (score >= 4.0) return 'Alto';
  if (score >= 3.0) return 'Básico';
  return 'Bajo';
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AutonomousSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(classId: string, teacherId: string, dto: CreateAutonomousSessionDto) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    const opensAt = new Date(dto.opensAt);
    const closesAt = new Date(dto.closesAt);
    if (opensAt >= closesAt) throw new BadRequestException('opensAt debe ser anterior a closesAt');

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
      },
    });
  }

  async findAllByClass(classId: string) {
    return this.prisma.autonomousSession.findMany({
      where: { classId },
      include: {
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(sessionId: string) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            slides: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión autónoma no encontrada');

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
      throw new BadRequestException('La sesión no está abierta');
    }

    if (dto.pin !== session.pin) {
      throw new ForbiddenException('PIN incorrecto');
    }

    const allResults = await this.prisma.autonomousResult.findMany({
      where: { sessionId },
    });

    const matchedResult = allResults.find((r) => namesMatch(dto.studentName, r.studentName));

    if (matchedResult) {
      const studentId = matchedResult.studentId;
      const studentResults = allResults.filter((r) => r.studentId === studentId);

      const completedCount = studentResults.filter((r) => r.status === 'completed').length;
      if (session.maxAttempts !== -1 && completedCount >= session.maxAttempts) {
        throw new ForbiddenException('Ya completaste esta tarea');
      }

      const inProgress = studentResults.find((r) => r.status === 'in_progress');
      if (inProgress) {
        const existingProgress = await this.prisma.autonomousProgress.findMany({
          where: { sessionId, studentId, attemptNumber: inProgress.attemptNumber },
          orderBy: { answeredAt: 'asc' },
        });
        return { studentId, attemptNumber: inProgress.attemptNumber, existingProgress, resuming: true };
      }

      const maxAttemptNumber = Math.max(...studentResults.map((r) => r.attemptNumber), 0);
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

      return { studentId, attemptNumber, existingProgress: [], resuming: false };
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

    return { studentId, attemptNumber: 1, existingProgress: [], resuming: false };
  }

  async saveProgress(sessionId: string, dto: SaveProgressDto) {
    const existing = await this.prisma.autonomousProgress.findFirst({
      where: {
        sessionId,
        studentId: dto.studentId,
        slideId: dto.slideId,
        attemptNumber: dto.attemptNumber,
      },
    });

    if (existing) {
      await this.prisma.autonomousProgress.update({
        where: { id: existing.id },
        data: { response: dto.response as any, answeredAt: new Date() },
      });
    } else {
      const result = await this.prisma.autonomousResult.findFirst({
        where: { sessionId, studentId: dto.studentId, attemptNumber: dto.attemptNumber },
        select: { studentName: true },
      });
      await this.prisma.autonomousProgress.create({
        data: {
          sessionId,
          studentId: dto.studentId,
          studentName: result?.studentName ?? '',
          slideId: dto.slideId,
          response: dto.response as any,
          attemptNumber: dto.attemptNumber,
        },
      });
    }

    return { saved: true };
  }

  async complete(sessionId: string, dto: CompleteSessionDto) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            slides: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const result = await this.prisma.autonomousResult.findFirst({
      where: { sessionId, studentId: dto.studentId, attemptNumber: dto.attemptNumber },
    });
    if (!result) throw new NotFoundException('Resultado no encontrado');

    const progress = await this.prisma.autonomousProgress.findMany({
      where: { sessionId, studentId: dto.studentId, attemptNumber: dto.attemptNumber },
    });

    const activitySlideIds: string[] = [];
    const resultBySlideId = new Map<string, { activityType: string; score: number | null; maxScore: number }>();

    for (const slide of session.class.slides) {
      const content = slide.content as any;
      const bloques = content?.bloques ?? [];
      const activityBlock = bloques.find((b: any) => b.tipo === 'actividad');
      if (!activityBlock) continue;

      const activityType: string = activityBlock.actividad?.tipo ?? '';
      activitySlideIds.push(slide.id);

      const progressEntry = progress.find((p) => p.slideId === slide.id);
      if (!progressEntry) {
        resultBySlideId.set(slide.id, { activityType, score: 0, maxScore: 1 });
        continue;
      }

      const resp = progressEntry.response as any;
      const score = resp?.score != null ? Number(resp.score) : null;
      const maxScore = resp?.maxScore != null ? Number(resp.maxScore) : 1;
      resultBySlideId.set(slide.id, { activityType, score, maxScore });
    }

    const { sum, denominator } = sumAndDenominatorForClassGradebook(activitySlideIds, resultBySlideId);
    const finalScore = denominator > 0 ? Math.round((sum / denominator) * 100) / 100 : 0;
    const desempeno = getDesempeno(finalScore);

    await this.prisma.autonomousResult.update({
      where: { id: result.id },
      data: { status: 'completed', finalScore, completedAt: new Date() },
    });

    return { finalScore, desempeno };
  }

  async update(sessionId: string, teacherId: string, dto: UpdateAutonomousSessionDto) {
    const session = await this.prisma.autonomousSession.findUnique({
      where: { id: sessionId },
      select: { id: true, teacherId: true, status: true, opensAt: true, closesAt: true },
    });
    if (!session) throw new NotFoundException('Sesión autónoma no encontrada');
    if (session.teacherId !== teacherId) throw new ForbiddenException('Sin permiso');

    const data: Record<string, unknown> = {};

    if (dto.opensAt !== undefined) {
      if (session.status !== 'scheduled') {
        throw new BadRequestException('Solo se puede cambiar la apertura mientras la tarea está programada');
      }
      data.opensAt = new Date(dto.opensAt);
    }
    if (dto.closesAt !== undefined) {
      data.closesAt = new Date(dto.closesAt);
    }

    if (dto.opensAt !== undefined || dto.closesAt !== undefined) {
      const nextOpens = dto.opensAt !== undefined ? new Date(dto.opensAt) : session.opensAt;
      const nextCloses = dto.closesAt !== undefined ? new Date(dto.closesAt) : session.closesAt;
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
    if (!session) throw new NotFoundException('Sesión autónoma no encontrada');
    if (session.teacherId !== teacherId) throw new ForbiddenException('Sin permiso');

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
    if (session.teacherId !== teacherId) throw new ForbiddenException('Sin permiso');

    const results = await this.prisma.autonomousResult.findMany({
      where: { sessionId },
      orderBy: [{ studentName: 'asc' }, { attemptNumber: 'asc' }],
    });

    const progress = await this.prisma.autonomousProgress.findMany({
      where: { sessionId },
      orderBy: { answeredAt: 'asc' },
    });

    return results.map((r) => ({
      ...r,
      progress: progress.filter(
        (p) => p.studentId === r.studentId && p.attemptNumber === r.attemptNumber,
      ),
    }));
  }
}
