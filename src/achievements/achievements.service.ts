import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { QueryAchievementDto } from './dto/query-achievement.dto';
import { AchievementScope, CompetenceType, CompetenceScope } from '@prisma/client';

const COMPETENCE_TYPES_AUTO = [
  CompetenceType.COGNITIVE,
  CompetenceType.METHODOLOGICAL,
  CompetenceType.INTERPERSONAL,
  CompetenceType.INSTRUMENTAL,
] as const;

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  async create(courseId: string, dto: CreateAchievementDto, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, role, 'gradebook');

    // Verify structure exists
    const structure = await this.prisma.gradebookStructure.findUnique({
      where: { courseId },
      select: { id: true },
    });
    if (!structure) {
      throw new NotFoundException('No existe estructura de calificación para este curso');
    }

    // Verify aspect belongs to this course
    const aspect = await this.prisma.aspect.findUnique({
      where: { id: dto.aspectId },
      select: { id: true, structureId: true, structure: { select: { courseId: true } } },
    });
    if (!aspect || aspect.structure.courseId !== courseId) {
      throw new NotFoundException('Aspecto no encontrado en este curso');
    }

    // Verify period belongs to course
    const period = await this.prisma.period.findFirst({
      where: { id: dto.periodId, courseId },
      select: { id: true },
    });
    if (!period) {
      throw new NotFoundException('Período no encontrado en este curso');
    }

    // Check unique code per course
    const existing = await this.prisma.achievement.findUnique({
      where: { code_courseId: { code: dto.code, courseId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un logro con el código "${dto.code}" en este curso`);
    }

    // Generate PI statements via OpenAI if available
    const piStatements = await this.generatePIStatements(dto.statement);

    // Create achievement + 4 PIs in a transaction
    const achievement = await this.prisma.$transaction(async (tx) => {
      const ach = await tx.achievement.create({
        data: {
          code: dto.code,
          statement: dto.statement,
          scope: dto.scope ?? AchievementScope.SPECIFIC,
          courseId,
          aspectId: dto.aspectId,
          periodId: dto.periodId,
        },
        select: {
          id: true,
          code: true,
          statement: true,
          scope: true,
          courseId: true,
          aspectId: true,
          periodId: true,
          createdAt: true,
        },
      });

      // Create 4 default PIs
      await tx.performanceIndicator.createMany({
        data: COMPETENCE_TYPES_AUTO.map((ct, i) => ({
          statement: piStatements[i] ?? '',
          competenceType: ct,
          competenceScope: CompetenceScope.GENERAL,
          weight: 0.25,
          achievementId: ach.id,
        })),
      });

      return ach;
    });

    return this.findOne(courseId, achievement.id, userId, role);
  }

  async findAll(courseId: string, query: QueryAchievementDto, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const where: any = { courseId };
    if (query.aspectId) where.aspectId = query.aspectId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.scope) where.scope = query.scope;

    return this.prisma.achievement.findMany({
      where,
      select: {
        id: true,
        code: true,
        statement: true,
        scope: true,
        courseId: true,
        aspectId: true,
        periodId: true,
        createdAt: true,
        aspect: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
        _count: { select: { performanceIndicators: true } },
      },
      orderBy: [{ aspectId: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(courseId: string, achievementId: string, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: {
        id: true,
        code: true,
        statement: true,
        scope: true,
        courseId: true,
        aspectId: true,
        periodId: true,
        createdAt: true,
        aspect: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
        performanceIndicators: {
          select: {
            id: true,
            statement: true,
            competenceType: true,
            competenceScope: true,
            subject: true,
            weight: true,
            createdAt: true,
            activities: {
              select: {
                id: true,
                name: true,
                weight: true,
                maxScore: true,
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { competenceType: 'asc' },
        },
      },
    });

    if (!achievement || achievement.courseId !== courseId) {
      throw new NotFoundException('Logro no encontrado en este curso');
    }

    return achievement;
  }

  async update(courseId: string, achievementId: string, dto: UpdateAchievementDto, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, role, 'gradebook');

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, courseId: true, code: true },
    });
    if (!achievement || achievement.courseId !== courseId) {
      throw new NotFoundException('Logro no encontrado en este curso');
    }

    if (dto.code && dto.code !== achievement.code) {
      const existing = await this.prisma.achievement.findUnique({
        where: { code_courseId: { code: dto.code, courseId } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un logro con el código "${dto.code}" en este curso`);
      }
    }

    return this.prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.statement !== undefined && { statement: dto.statement }),
        ...(dto.scope !== undefined && { scope: dto.scope }),
      },
      select: {
        id: true,
        code: true,
        statement: true,
        scope: true,
        courseId: true,
        aspectId: true,
        periodId: true,
        createdAt: true,
      },
    });
  }

  async remove(courseId: string, achievementId: string, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, role, 'gradebook');

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, courseId: true },
    });
    if (!achievement || achievement.courseId !== courseId) {
      throw new NotFoundException('Logro no encontrado en este curso');
    }

    // Check if any GradeEntry is associated via PIs and Activities
    const gradeCount = await this.prisma.gradeEntry.count({
      where: {
        activity: {
          performanceIndicator: { achievementId },
        },
      },
    });
    if (gradeCount > 0) {
      throw new ConflictException(
        'No se puede eliminar el logro: tiene calificaciones registradas',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete activities under PIs
      const pis = await tx.performanceIndicator.findMany({
        where: { achievementId },
        select: { id: true },
      });
      for (const pi of pis) {
        await tx.activity.deleteMany({ where: { performanceIndicatorId: pi.id } });
      }
      await tx.performanceIndicator.deleteMany({ where: { achievementId } });
      await tx.achievement.delete({ where: { id: achievementId } });
    });

    return { message: 'Logro eliminado correctamente' };
  }

  private async generatePIStatements(achievementStatement: string): Promise<string[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return ['', '', '', ''];
    }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente pedagógico especializado en el sistema educativo colombiano. Genera indicadores de logro concisos (máximo 150 caracteres cada uno) basados en un enunciado de logro.',
            },
            {
              role: 'user',
              content: `Para el siguiente logro: "${achievementStatement}"\n\nGenera exactamente 4 indicadores de logro, uno para cada tipo de competencia. Responde SOLO con un JSON array de 4 strings en este orden: [cognitivo, metodológico, interpersonal, instrumental]. Sin explicaciones adicionales.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      if (!response.ok) return ['', '', '', ''];
      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content ?? '[]';
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed.map((s) => (typeof s === 'string' ? s.slice(0, 150) : ''));
      }
      return ['', '', '', ''];
    } catch {
      return ['', '', '', ''];
    }
  }
}
