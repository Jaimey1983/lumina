import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAspectDto } from './dto/create-aspect.dto';
import { UpdateAspectDto } from './dto/update-aspect.dto';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';

const WEIGHT_EPS = 1e-5;

@Injectable()
export class PerformanceIndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createStructure(courseId: string, userId: string, role: string) {
    await this.assertCourseExists(courseId);
    await this.assertCanManageGradebook(courseId, userId, role);

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
            indicators: {
              select: { id: true, name: true, weight: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async getStructure(courseId: string, userId: string, role: string) {
    await this.assertCourseExists(courseId);
    await this.verifyCourseAccess(courseId, userId, role);

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
            indicators: {
              select: { id: true, name: true, weight: true },
              orderBy: { name: 'asc' },
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
      structure.aspects.length === 0 ||
      Math.abs(aspectSum - 1) <= WEIGHT_EPS;

    const indicatorsByAspect = structure.aspects.map((a) => {
      const indSum = this.sumWeights(a.indicators.map((i) => i.weight));
      return {
        aspectId: a.id,
        sum: indSum,
        valid:
          a.indicators.length === 0 || Math.abs(indSum - 1) <= WEIGHT_EPS,
      };
    });

    return {
      ...structure,
      meta: {
        aspectsWeightSum: aspectSum,
        aspectsWeightsValid,
        indicatorsByAspect,
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
    await this.assertCanManageGradebook(courseId, userId, role);

    const currentSum = await this.sumAspectWeightsForStructure(structure.id);
    const nextSum = currentSum + dto.weight;
    if (nextSum > 0.90 + WEIGHT_EPS) {
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
    await this.assertCanManageGradebook(courseId, userId, role);
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
    if (nextSum > 0.90 + WEIGHT_EPS) {
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
    await this.assertCanManageGradebook(courseId, userId, role);
    await this.assertAspectBelongsToStructure(aspectId, structure.id);

    await this.prisma.$transaction(async (tx) => {
      const indicators = await tx.indicator.findMany({
        where: { aspectId },
        select: { id: true },
      });
      for (const ind of indicators) {
        const actCount = await tx.activity.count({
          where: { indicatorId: ind.id },
        });
        if (actCount > 0) {
          throw new ConflictException(
            'No se puede eliminar el aspecto: hay actividades calificables asociadas',
          );
        }
      }
      await tx.indicator.deleteMany({ where: { aspectId } });
      await tx.aspect.delete({ where: { id: aspectId } });
    });

    return { message: 'Aspecto eliminado correctamente' };
  }

  async createIndicator(
    courseId: string,
    aspectId: string,
    dto: CreateIndicatorDto,
    userId: string,
    role: string,
  ) {
    const structure = await this.requireStructure(courseId, userId, role);
    await this.assertCanManageGradebook(courseId, userId, role);
    await this.assertAspectBelongsToStructure(aspectId, structure.id);

    const currentSum = await this.sumIndicatorWeightsForAspect(aspectId);
    const nextSum = currentSum + dto.weight;
    if (nextSum > 1 + WEIGHT_EPS) {
      throw new BadRequestException(
        `La suma de pesos de indicadores en este aspecto no puede superar 1.0 (quedaría: ${nextSum.toFixed(4)})`,
      );
    }

    return this.prisma.indicator.create({
      data: {
        name: dto.name,
        weight: dto.weight,
        aspectId,
      },
      select: {
        id: true,
        name: true,
        weight: true,
        aspectId: true,
      },
    });
  }

  async updateIndicator(
    courseId: string,
    indicatorId: string,
    dto: UpdateIndicatorDto,
    userId: string,
    role: string,
  ) {
    const structure = await this.requireStructure(courseId, userId, role);
    await this.assertCanManageGradebook(courseId, userId, role);

    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      select: {
        id: true,
        aspectId: true,
        weight: true,
        name: true,
        aspect: {
          select: { structureId: true, structure: { select: { courseId: true } } },
        },
      },
    });
    if (!indicator || indicator.aspect.structure.courseId !== courseId) {
      throw new NotFoundException('Indicador no encontrado en este curso');
    }
    if (indicator.aspect.structureId !== structure.id) {
      throw new NotFoundException('Indicador no encontrado en este curso');
    }

    const newWeight = dto.weight ?? indicator.weight;
    const othersSum = await this.prisma.indicator.aggregate({
      where: { aspectId: indicator.aspectId, id: { not: indicatorId } },
      _sum: { weight: true },
    });
    const nextSum = (othersSum._sum.weight ?? 0) + newWeight;
    if (nextSum > 1 + WEIGHT_EPS) {
      throw new BadRequestException(
        `La suma de pesos de indicadores no puede superar 1.0 (quedaría: ${nextSum.toFixed(4)})`,
      );
    }

    return this.prisma.indicator.update({
      where: { id: indicatorId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
      },
      select: { id: true, name: true, weight: true, aspectId: true },
    });
  }

  async deleteIndicator(
    courseId: string,
    indicatorId: string,
    userId: string,
    role: string,
  ) {
    await this.requireStructure(courseId, userId, role);
    await this.assertCanManageGradebook(courseId, userId, role);

    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      select: {
        id: true,
        aspect: {
          select: { structure: { select: { courseId: true, id: true } } },
        },
      },
    });
    if (!indicator || indicator.aspect.structure.courseId !== courseId) {
      throw new NotFoundException('Indicador no encontrado en este curso');
    }

    const actCount = await this.prisma.activity.count({
      where: { indicatorId },
    });
    if (actCount > 0) {
      throw new ConflictException(
        'No se puede eliminar el indicador: tiene actividades calificables',
      );
    }

    await this.prisma.indicator.delete({ where: { id: indicatorId } });
    return { message: 'Indicador eliminado correctamente' };
  }

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

  private async sumIndicatorWeightsForAspect(aspectId: string) {
    const agg = await this.prisma.indicator.aggregate({
      where: { aspectId },
      _sum: { weight: true },
    });
    return agg._sum.weight ?? 0;
  }

  private async assertCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
  }

  private async verifyCourseAccess(
    courseId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') return;

    if (userRole === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      if (!course || course.teacherId !== userId) {
        throw new ForbiddenException('No tienes acceso a este curso');
      }
      return;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('No estás matriculado en este curso');
    }
  }

  private async assertCanManageGradebook(
    courseId: string,
    userId: string,
    role: string,
  ) {
    if (role === 'ADMIN' || role === 'SUPERADMIN') return;

    if (role === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      if (!course || course.teacherId !== userId) {
        throw new ForbiddenException(
          'No tienes permiso para editar la estructura de calificación de este curso',
        );
      }
      return;
    }

    throw new ForbiddenException(
      'No tienes permiso para editar la estructura de calificación',
    );
  }

  private async requireStructure(
    courseId: string,
    userId: string,
    role: string,
  ) {
    await this.assertCourseExists(courseId);
    await this.verifyCourseAccess(courseId, userId, role);

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
