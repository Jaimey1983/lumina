import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

const WEIGHT_EPS = 1e-5;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  async create(
    courseId: string,
    performanceIndicatorId: string,
    dto: CreateActivityDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'activities',
    );
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);
    await this.assertPIBelongsToCourse(performanceIndicatorId, courseId);

    const currentSum = await this.sumActivityWeightsForPI(
      performanceIndicatorId,
    );
    const nextSum = currentSum + dto.weight;
    if (nextSum > 1 + WEIGHT_EPS) {
      throw new BadRequestException(
        `La suma de pesos de actividades en este indicador no puede superar 1.0 (quedaría: ${nextSum.toFixed(4)})`,
      );
    }

    return this.prisma.activity.create({
      data: {
        name: dto.name,
        weight: dto.weight,
        maxScore: dto.maxScore ?? 5.0,
        performanceIndicatorId,
      },
      select: {
        id: true,
        name: true,
        weight: true,
        maxScore: true,
        performanceIndicatorId: true,
      },
    });
  }

  async findAllByPI(
    courseId: string,
    performanceIndicatorId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);
    await this.assertPIBelongsToCourse(performanceIndicatorId, courseId);

    const activities = await this.prisma.activity.findMany({
      where: { performanceIndicatorId },
      select: {
        id: true,
        name: true,
        weight: true,
        maxScore: true,
        performanceIndicatorId: true,
        _count: { select: { gradeEntries: true } },
      },
      orderBy: { name: 'asc' },
    });

    const sum = this.sumWeights(activities.map((a) => a.weight));
    return {
      data: activities,
      meta: {
        weightSum: sum,
        weightsValid:
          activities.length === 0 || Math.abs(sum - 1) <= WEIGHT_EPS,
      },
    };
  }

  async findOne(
    courseId: string,
    activityId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        name: true,
        weight: true,
        maxScore: true,
        performanceIndicatorId: true,
        performanceIndicator: {
          select: {
            id: true,
            statement: true,
            competenceType: true,
            achievement: {
              select: {
                id: true,
                code: true,
                aspect: {
                  select: {
                    id: true,
                    name: true,
                    structure: { select: { courseId: true } },
                  },
                },
              },
            },
          },
        },
        _count: { select: { gradeEntries: true } },
      },
    });

    if (
      !activity ||
      activity.performanceIndicator.achievement.aspect.structure.courseId !==
        courseId
    ) {
      throw new NotFoundException('Actividad no encontrada en este curso');
    }

    return activity;
  }

  async update(
    courseId: string,
    activityId: string,
    dto: UpdateActivityDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'activities',
    );

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        performanceIndicatorId: true,
        weight: true,
        name: true,
        maxScore: true,
        performanceIndicator: {
          select: {
            achievement: {
              select: {
                aspect: {
                  select: { structure: { select: { courseId: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (
      !activity ||
      activity.performanceIndicator.achievement.aspect.structure.courseId !==
        courseId
    ) {
      throw new NotFoundException('Actividad no encontrada en este curso');
    }

    const newWeight = dto.weight ?? activity.weight;
    const othersSum = await this.prisma.activity.aggregate({
      where: {
        performanceIndicatorId: activity.performanceIndicatorId,
        id: { not: activityId },
      },
      _sum: { weight: true },
    });
    const nextSum = (othersSum._sum.weight ?? 0) + newWeight;
    if (nextSum > 1 + WEIGHT_EPS) {
      throw new BadRequestException(
        `La suma de pesos de actividades no puede superar 1.0 (quedaría: ${nextSum.toFixed(4)})`,
      );
    }

    return this.prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.maxScore !== undefined && { maxScore: dto.maxScore }),
      },
      select: {
        id: true,
        name: true,
        weight: true,
        maxScore: true,
        performanceIndicatorId: true,
      },
    });
  }

  async remove(
    courseId: string,
    activityId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'activities',
    );

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        performanceIndicator: {
          select: {
            achievement: {
              select: {
                aspect: {
                  select: { structure: { select: { courseId: true } } },
                },
              },
            },
          },
        },
        _count: { select: { gradeEntries: true } },
      },
    });

    if (
      !activity ||
      activity.performanceIndicator.achievement.aspect.structure.courseId !==
        courseId
    ) {
      throw new NotFoundException('Actividad no encontrada en este curso');
    }

    if (activity._count.gradeEntries > 0) {
      throw new ConflictException(
        'No se puede eliminar la actividad: ya tiene calificaciones registradas',
      );
    }

    await this.prisma.activity.delete({ where: { id: activityId } });
    return { message: 'Actividad eliminada correctamente' };
  }

  private sumWeights(weights: number[]): number {
    return weights.reduce((a, b) => a + b, 0);
  }

  private async sumActivityWeightsForPI(performanceIndicatorId: string) {
    const agg = await this.prisma.activity.aggregate({
      where: { performanceIndicatorId },
      _sum: { weight: true },
    });
    return agg._sum.weight ?? 0;
  }

  private async assertPIBelongsToCourse(
    performanceIndicatorId: string,
    courseId: string,
  ) {
    const pi = await this.prisma.performanceIndicator.findUnique({
      where: { id: performanceIndicatorId },
      select: {
        id: true,
        achievement: {
          select: {
            aspect: {
              select: { structure: { select: { courseId: true } } },
            },
          },
        },
      },
    });
    if (!pi || pi.achievement.aspect.structure.courseId !== courseId) {
      throw new NotFoundException(
        'Indicador de logro no encontrado en este curso',
      );
    }
  }
}
