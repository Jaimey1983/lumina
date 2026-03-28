import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { CreateGradeEntryDto } from './dto/create-grade-entry.dto';
import { UpdateGradeEntryDto } from './dto/update-grade-entry.dto';

const SCORE_EPS = 1e-6;

const CT_ABBREV: Record<string, string> = {
  COGNITIVE: 'COG',
  METHODOLOGICAL: 'MET',
  INTERPERSONAL: 'INT',
  INSTRUMENTAL: 'INS',
  SUBJECT_SPECIFIC: 'SUB',
};

@Injectable()
export class GradebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  async createPeriod(
    courseId: string,
    dto: CreatePeriodDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'grades',
    );

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException('startDate debe ser anterior a endDate');
    }

    return this.prisma.period.create({
      data: {
        name: dto.name,
        startDate: start,
        endDate: end,
        isActive: dto.isActive ?? true,
        courseId,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        courseId: true,
        createdAt: true,
      },
    });
  }

  async findPeriods(courseId: string, userId: string, role: string) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    return this.prisma.period.findMany({
      where: { courseId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        courseId: true,
        createdAt: true,
        _count: { select: { gradeEntries: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async updatePeriod(
    courseId: string,
    periodId: string,
    dto: UpdatePeriodDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'grades',
    );

    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
      select: { id: true, courseId: true, startDate: true, endDate: true },
    });
    if (!period || period.courseId !== courseId) {
      throw new NotFoundException('Período no encontrado en este curso');
    }

    const start = dto.startDate ? new Date(dto.startDate) : period.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : period.endDate;
    if (start >= end) {
      throw new BadRequestException('startDate debe ser anterior a endDate');
    }

    return this.prisma.period.update({
      where: { id: periodId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.startDate !== undefined && { startDate: start }),
        ...(dto.endDate !== undefined && { endDate: end }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        courseId: true,
        createdAt: true,
      },
    });
  }

  async removePeriod(
    courseId: string,
    periodId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'grades',
    );

    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
      select: { id: true, courseId: true },
    });
    if (!period || period.courseId !== courseId) {
      throw new NotFoundException('Período no encontrado en este curso');
    }

    await this.prisma.period.update({
      where: { id: periodId },
      data: { isActive: false },
    });
    return { message: 'Período desactivado correctamente' };
  }

  async upsertGradeEntry(
    courseId: string,
    dto: CreateGradeEntryDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'grades',
    );

    await this.assertEnrollment(dto.userId, courseId);
    await this.assertPeriodInCourse(dto.periodId, courseId);
    const maxScore = await this.assertActivityInCourse(
      dto.activityId,
      courseId,
    );

    if (dto.score > maxScore + SCORE_EPS) {
      throw new BadRequestException(
        `La nota no puede superar la nota máxima de la actividad (${maxScore})`,
      );
    }

    return this.prisma.gradeEntry.upsert({
      where: {
        userId_activityId_periodId: {
          userId: dto.userId,
          activityId: dto.activityId,
          periodId: dto.periodId,
        },
      },
      create: {
        userId: dto.userId,
        activityId: dto.activityId,
        periodId: dto.periodId,
        score: dto.score,
        feedback: dto.feedback,
      },
      update: {
        score: dto.score,
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
      },
      select: {
        id: true,
        score: true,
        feedback: true,
        userId: true,
        activityId: true,
        periodId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateGradeEntry(
    courseId: string,
    entryId: string,
    dto: UpdateGradeEntryDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'grades',
    );

    const entry = await this.prisma.gradeEntry.findUnique({
      where: { id: entryId },
      select: {
        id: true,
        score: true,
        activity: {
          select: {
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
        },
      },
    });

    if (
      !entry ||
      entry.activity.performanceIndicator.achievement.aspect.structure
        .courseId !== courseId
    ) {
      throw new NotFoundException('Calificación no encontrada en este curso');
    }

    const maxScore = entry.activity.maxScore;
    const newScore = dto.score ?? entry.score;
    if (newScore > maxScore + SCORE_EPS) {
      throw new BadRequestException(
        `La nota no puede superar la nota máxima de la actividad (${maxScore})`,
      );
    }

    return this.prisma.gradeEntry.update({
      where: { id: entryId },
      data: {
        ...(dto.score !== undefined && { score: dto.score }),
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
      },
      select: {
        id: true,
        score: true,
        feedback: true,
        userId: true,
        activityId: true,
        periodId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getGradesView(
    courseId: string,
    periodId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        courseId: true,
      },
    });
    if (!period || period.courseId !== courseId) {
      throw new NotFoundException('Período no encontrado en este curso');
    }

    const structure = await this.prisma.gradebookStructure.findUnique({
      where: { courseId },
      select: {
        id: true,
        aspects: {
          select: {
            id: true,
            name: true,
            weight: true,
            achievements: {
              select: {
                id: true,
                code: true,
                performanceIndicators: {
                  select: {
                    id: true,
                    statement: true,
                    competenceType: true,
                    weight: true,
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
              orderBy: { code: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!structure) {
      throw new NotFoundException(
        'El curso no tiene estructura de calificación; crea una en /gradebook',
      );
    }

    const activitiesFlat = this.flattenActivities(structure);
    const activityIds = activitiesFlat.map((a) => a.id);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { user: { lastName: 'asc' } },
    });

    let studentUserIds = enrollments.map((e) => e.user.id);
    if (role === 'STUDENT') {
      if (!studentUserIds.includes(userId)) {
        throw new ForbiddenException('No estás matriculado en este curso');
      }
      studentUserIds = [userId];
    }

    const entries = await this.prisma.gradeEntry.findMany({
      where: {
        periodId,
        activityId: { in: activityIds },
        userId: { in: studentUserIds },
      },
      select: {
        id: true,
        userId: true,
        activityId: true,
        score: true,
        feedback: true,
        updatedAt: true,
      },
    });

    const entryByUserAndActivity = new Map<string, (typeof entries)[0]>();
    for (const e of entries) {
      entryByUserAndActivity.set(`${e.userId}:${e.activityId}`, e);
    }

    const rows = enrollments
      .filter((e) => studentUserIds.includes(e.user.id))
      .map((enrollment) => {
        const cells = activitiesFlat.map((act) => {
          const key = `${enrollment.user.id}:${act.id}`;
          return {
            activityId: act.id,
            activityName: act.name,
            maxScore: act.maxScore,
            aspectName: act.aspectName,
            indicatorName: act.indicatorName,
            entry: entryByUserAndActivity.get(key) ?? null,
          };
        });
        return { user: enrollment.user, cells };
      });

    return {
      period,
      activities: activitiesFlat,
      rows,
      meta: {
        studentCount: rows.length,
        activityCount: activitiesFlat.length,
      },
    };
  }

  private flattenActivities(structure: {
    aspects: Array<{
      name: string;
      achievements: Array<{
        code: string;
        performanceIndicators: Array<{
          statement: string;
          competenceType: string;
          activities: Array<{
            id: string;
            name: string;
            maxScore: number;
            weight: number;
          }>;
        }>;
      }>;
    }>;
  }) {
    const out: Array<{
      id: string;
      name: string;
      maxScore: number;
      weight: number;
      aspectName: string;
      indicatorName: string;
    }> = [];
    for (const aspect of structure.aspects) {
      for (const ach of aspect.achievements) {
        for (const pi of ach.performanceIndicators) {
          const piLabel = `${ach.code}-${CT_ABBREV[pi.competenceType] ?? pi.competenceType}`;
          for (const act of pi.activities) {
            out.push({
              id: act.id,
              name: act.name,
              maxScore: act.maxScore,
              weight: act.weight,
              aspectName: aspect.name,
              indicatorName: piLabel,
            });
          }
        }
      }
    }
    return out;
  }

  private async assertEnrollment(userId: string, courseId: string) {
    const enr = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });
    if (!enr) {
      throw new BadRequestException(
        'El estudiante no está matriculado en este curso',
      );
    }
  }

  private async assertPeriodInCourse(periodId: string, courseId: string) {
    const p = await this.prisma.period.findUnique({
      where: { id: periodId },
      select: { courseId: true },
    });
    if (!p || p.courseId !== courseId) {
      throw new BadRequestException('El período no pertenece a este curso');
    }
  }

  /** Devuelve maxScore si la actividad pertenece al curso */
  private async assertActivityInCourse(
    activityId: string,
    courseId: string,
  ): Promise<number> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
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
      throw new BadRequestException(
        'La actividad no pertenece a la estructura de calificación de este curso',
      );
    }
    return activity.maxScore;
  }
}
