import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateAspectDto } from './dto/create-aspect.dto';
import { UpdateAspectDto } from './dto/update-aspect.dto';
import { CreatePerformanceIndicatorDto } from './dto/create-performance-indicator.dto';
import { UpdatePerformanceIndicatorDto } from './dto/update-performance-indicator.dto';

const WEIGHT_EPS = 1e-5;

@Injectable()
export class PerformanceIndicatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  async createStructure(courseId: string, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );

    const existing = await this.prisma.gradebookStructure.findUnique({
      where: { courseId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Este curso ya tiene una estructura de calificación',
      );
    }

    return this.prisma.gradebookStructure.create({
      data: { courseId },
      select: {
        id: true,
        courseId: true,
        aspects: {
          select: {
            id: true,
            name: true,
            weight: true,
            achievements: {
              select: { id: true, code: true, statement: true, scope: true },
              orderBy: { code: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async getStructure(courseId: string, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const structure = await this.prisma.gradebookStructure.findUnique({
      where: { courseId },
      select: {
        id: true,
        courseId: true,
        aspects: {
          select: {
            id: true,
            name: true,
            weight: true,
            achievements: {
              select: {
                id: true,
                code: true,
                statement: true,
                scope: true,
                periodId: true,
                _count: { select: { performanceIndicators: true } },
              },
              orderBy: { code: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!structure) {
      throw new NotFoundException(
        'No existe estructura de calificación para este curso',
      );
    }

    const aspectSum = this.sumWeights(structure.aspects.map((a) => a.weight));
    const aspectsWeightsValid =
      structure.aspects.length === 0 || Math.abs(aspectSum - 0.9) <= WEIGHT_EPS;

    return {
      ...structure,
      meta: {
        aspectsWeightSum: aspectSum,
        aspectsWeightsValid,
      },
    };
  }

  async createAspect(
    courseId: string,
    dto: CreateAspectDto,
    userId: string,
    role: string,
  ) {
    const structure = await this.requireStructure(courseId, userId, role);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );

    const currentSum = await this.sumAspectWeightsForStructure(structure.id);
    const nextSum = currentSum + dto.weight;
    if (nextSum > 0.9 + WEIGHT_EPS) {
      throw new BadRequestException(
        'La suma de pesos de los aspectos no puede superar 0.90 (el 0.10 restante está reservado para autoevaluación y coevaluación)',
      );
    }

    return this.prisma.aspect.create({
      data: {
        name: dto.name,
        weight: dto.weight,
        structureId: structure.id,
      },
      select: {
        id: true,
        name: true,
        weight: true,
        structureId: true,
      },
    });
  }

  async updateAspect(
    courseId: string,
    aspectId: string,
    dto: UpdateAspectDto,
    userId: string,
    role: string,
  ) {
    const structure = await this.requireStructure(courseId, userId, role);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );
    await this.assertAspectBelongsToStructure(aspectId, structure.id);

    const aspect = await this.prisma.aspect.findUnique({
      where: { id: aspectId },
      select: { id: true, weight: true, name: true },
    });
    if (!aspect) throw new NotFoundException('Aspecto no encontrado');

    const newWeight = dto.weight ?? aspect.weight;
    const othersSum = await this.prisma.aspect.aggregate({
      where: { structureId: structure.id, id: { not: aspectId } },
      _sum: { weight: true },
    });
    const nextSum = (othersSum._sum.weight ?? 0) + newWeight;
    if (nextSum > 0.9 + WEIGHT_EPS) {
      throw new BadRequestException(
        'La suma de pesos de los aspectos no puede superar 0.90 (el 0.10 restante está reservado para autoevaluación y coevaluación)',
      );
    }

    return this.prisma.aspect.update({
      where: { id: aspectId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
      },
      select: { id: true, name: true, weight: true, structureId: true },
    });
  }

  async deleteAspect(
    courseId: string,
    aspectId: string,
    userId: string,
    role: string,
  ) {
    const structure = await this.requireStructure(courseId, userId, role);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );
    await this.assertAspectBelongsToStructure(aspectId, structure.id);

    await this.prisma.$transaction(async (tx) => {
      const achievements = await tx.achievement.findMany({
        where: { aspectId },
        select: { id: true },
      });
      for (const ach of achievements) {
        const pis = await tx.performanceIndicator.findMany({
          where: { achievementId: ach.id },
          select: { id: true },
        });
        for (const pi of pis) {
          const actCount = await tx.activity.count({
            where: { performanceIndicatorId: pi.id },
          });
          if (actCount > 0) {
            throw new ConflictException(
              'No se puede eliminar el aspecto: hay actividades calificables asociadas',
            );
          }
        }
        await tx.performanceIndicator.deleteMany({
          where: { achievementId: ach.id },
        });
      }
      await tx.achievement.deleteMany({ where: { aspectId } });
      await tx.aspect.delete({ where: { id: aspectId } });
    });

    return { message: 'Aspecto eliminado correctamente' };
  }

  // ── PerformanceIndicator CRUD ────────────────────────────────

  async createPerformanceIndicator(
    achievementId: string,
    dto: CreatePerformanceIndicatorDto,
    userId: string,
    role: string,
  ) {
    const achievement = await this.requireAchievement(
      achievementId,
      userId,
      role,
    );
    await this.courseAuth.assertStaffCanManageCourse(
      achievement.courseId,
      userId,
      role,
      'gradebook',
    );

    // Validate weight: sum of all PIs in the ASPECT must not exceed 1.0
    const currentSum = await this.sumPIWeightsForAspect(achievement.aspectId);
    const nextSum = currentSum + dto.weight;
    if (nextSum > 1 + WEIGHT_EPS) {
      throw new BadRequestException(
        `La suma de pesos de indicadores en este aspecto no puede superar 1.0 (quedaría: ${nextSum.toFixed(4)})`,
      );
    }

    return this.prisma.performanceIndicator.create({
      data: {
        statement: dto.statement,
        competenceType: dto.competenceType,
        competenceScope: dto.competenceScope ?? 'GENERAL',
        subject: dto.subject,
        weight: dto.weight,
        achievementId,
      },
      select: {
        id: true,
        statement: true,
        competenceType: true,
        competenceScope: true,
        subject: true,
        weight: true,
        achievementId: true,
        createdAt: true,
      },
    });
  }

  async updatePerformanceIndicator(
    achievementId: string,
    piId: string,
    dto: UpdatePerformanceIndicatorDto,
    userId: string,
    role: string,
  ) {
    const achievement = await this.requireAchievement(
      achievementId,
      userId,
      role,
    );
    await this.courseAuth.assertStaffCanManageCourse(
      achievement.courseId,
      userId,
      role,
      'gradebook',
    );

    const pi = await this.prisma.performanceIndicator.findUnique({
      where: { id: piId },
      select: { id: true, weight: true, achievementId: true },
    });
    if (!pi || pi.achievementId !== achievementId) {
      throw new NotFoundException('Indicador de logro no encontrado');
    }

    if (dto.weight !== undefined) {
      const newWeight = dto.weight;
      const othersSum = await this.prisma.performanceIndicator.aggregate({
        where: {
          achievement: { aspectId: achievement.aspectId },
          id: { not: piId },
        },
        _sum: { weight: true },
      });
      const nextSum = (othersSum._sum.weight ?? 0) + newWeight;
      if (nextSum > 1 + WEIGHT_EPS) {
        throw new BadRequestException(
          `La suma de pesos de indicadores en este aspecto no puede superar 1.0 (quedaría: ${nextSum.toFixed(4)})`,
        );
      }
    }

    return this.prisma.performanceIndicator.update({
      where: { id: piId },
      data: {
        ...(dto.statement !== undefined && { statement: dto.statement }),
        ...(dto.competenceScope !== undefined && {
          competenceScope: dto.competenceScope,
        }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
      },
      select: {
        id: true,
        statement: true,
        competenceType: true,
        competenceScope: true,
        subject: true,
        weight: true,
        achievementId: true,
        createdAt: true,
      },
    });
  }

  async deletePerformanceIndicator(
    achievementId: string,
    piId: string,
    userId: string,
    role: string,
  ) {
    const achievement = await this.requireAchievement(
      achievementId,
      userId,
      role,
    );
    await this.courseAuth.assertStaffCanManageCourse(
      achievement.courseId,
      userId,
      role,
      'gradebook',
    );

    const pi = await this.prisma.performanceIndicator.findUnique({
      where: { id: piId },
      select: { id: true, achievementId: true },
    });
    if (!pi || pi.achievementId !== achievementId) {
      throw new NotFoundException('Indicador de logro no encontrado');
    }

    const actCount = await this.prisma.activity.count({
      where: { performanceIndicatorId: piId },
    });
    if (actCount > 0) {
      throw new ConflictException(
        'No se puede eliminar el indicador: tiene actividades calificables',
      );
    }

    await this.prisma.performanceIndicator.delete({ where: { id: piId } });
    return { message: 'Indicador de logro eliminado correctamente' };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private sumWeights(weights: number[]): number {
    return weights.reduce((a, b) => a + b, 0);
  }

  private async sumAspectWeightsForStructure(structureId: string) {
    const agg = await this.prisma.aspect.aggregate({
      where: { structureId },
      _sum: { weight: true },
    });
    return agg._sum.weight ?? 0;
  }

  private async sumPIWeightsForAspect(aspectId: string) {
    const agg = await this.prisma.performanceIndicator.aggregate({
      where: { achievement: { aspectId } },
      _sum: { weight: true },
    });
    return agg._sum.weight ?? 0;
  }

  private async requireStructure(
    courseId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const structure = await this.prisma.gradebookStructure.findUnique({
      where: { courseId },
      select: { id: true, courseId: true },
    });
    if (!structure) {
      throw new NotFoundException(
        'No existe estructura de calificación para este curso',
      );
    }
    return structure;
  }

  private async requireAchievement(
    achievementId: string,
    userId: string,
    role: string,
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, courseId: true, aspectId: true },
    });
    if (!achievement) throw new NotFoundException('Logro no encontrado');
    await this.courseAuth.verifyCourseReadAccess(
      achievement.courseId,
      userId,
      role,
    );
    return achievement;
  }

  private async assertAspectBelongsToStructure(
    aspectId: string,
    structureId: string,
  ) {
    const aspect = await this.prisma.aspect.findUnique({
      where: { id: aspectId },
      select: { structureId: true },
    });
    if (!aspect || aspect.structureId !== structureId) {
      throw new NotFoundException('Aspecto no encontrado en este curso');
    }
  }
}
