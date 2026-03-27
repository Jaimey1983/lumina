import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AssignPointsDto } from './dto/assign-points.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { AssignBadgeDto } from './dto/assign-badge.dto';

// ── Selects reutilizables ─────────────────────────────────
const USER_SELECT = {
  id: true,
  name: true,
  lastName: true,
  avatar: true,
} as const;

const BADGE_SELECT = {
  id: true,
  name: true,
  description: true,
  icon: true,
  courseId: true,
  createdAt: true,
} as const;

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  PUNTOS
  // ══════════════════════════════════════════════════════════

  /**
   * Upsert de puntos para un estudiante en el curso.
   * `points` reemplaza el total actual (no es un incremento).
   * Solo docente titular / ADMIN / SUPERADMIN puede asignar.
   */
  async upsertPoints(
    courseId: string,
    dto: AssignPointsDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'gamification',
    );

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId } },
    });
    if (!enrollment) {
      throw new BadRequestException(
        `El estudiante ${dto.userId} no está matriculado en el curso`,
      );
    }

    return this.prisma.studentPoints.upsert({
      where: { userId_courseId: { userId: dto.userId, courseId } },
      create: { userId: dto.userId, courseId, points: dto.points, reason: dto.reason },
      update: { points: dto.points, reason: dto.reason },
      select: {
        id: true,
        points: true,
        updatedAt: true,
        user: { select: USER_SELECT },
      },
    });
  }

  /**
   * Leaderboard: ranking de estudiantes por puntos (desc).
   * Todos los matriculados pueden ver el ranking.
   */
  async getLeaderboard(
    courseId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, requesterId, requesterRole);

    const entries = await this.prisma.studentPoints.findMany({
      where: { courseId },
      select: {
        id: true,
        points: true,
        updatedAt: true,
        user: { select: USER_SELECT },
      },
      orderBy: { points: 'desc' },
    });

    return {
      data: entries.map((e, i) => ({ rank: i + 1, ...e })),
      meta: { total: entries.length, courseId },
    };
  }

  /**
   * Puntos de un estudiante.
   * STUDENT solo puede ver los suyos; TEACHER/ADMIN/SUPERADMIN ven todos.
   * Si el estudiante aún no tiene registro, devuelve 0 puntos.
   */
  async getStudentPoints(
    courseId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, requesterId, requesterRole);

    if (requesterRole === 'STUDENT' && userId !== requesterId) {
      throw new ForbiddenException('Solo puedes consultar tus propios puntos');
    }

    const entry = await this.prisma.studentPoints.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: {
        id: true,
        points: true,
        updatedAt: true,
        user: { select: USER_SELECT },
      },
    });

    return entry ?? { userId, courseId, points: 0 };
  }

  // ══════════════════════════════════════════════════════════
  //  BADGES (INSIGNIAS)
  // ══════════════════════════════════════════════════════════

  /** Crear insignia en el curso. */
  async createBadge(
    courseId: string,
    dto: CreateBadgeDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'gamification',
    );

    return this.prisma.badge.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        courseId,
      },
      select: BADGE_SELECT,
    });
  }

  /** Listar insignias activas del curso. Todos los matriculados pueden ver. */
  async listBadges(
    courseId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, requesterId, requesterRole);

    const badges = await this.prisma.badge.findMany({
      where: { courseId, isActive: true },
      select: {
        ...BADGE_SELECT,
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: badges,
      meta: { total: badges.length, courseId },
    };
  }

  /** Obtener insignia por id. */
  async getBadge(
    courseId: string,
    badgeId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, requesterId, requesterRole);

    return this.assertBadgeInCourse(badgeId, courseId);
  }

  /** Actualizar nombre, descripción o icono de una insignia. */
  async updateBadge(
    courseId: string,
    badgeId: string,
    dto: UpdateBadgeDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'gamification',
    );
    await this.assertBadgeInCourse(badgeId, courseId);

    return this.prisma.badge.update({
      where: { id: badgeId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
      select: BADGE_SELECT,
    });
  }

  /**
   * Soft-delete de insignia (isActive: false).
   * Las asignaciones existentes se conservan en DB pero dejan de ser visibles.
   */
  async removeBadge(
    courseId: string,
    badgeId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'gamification',
    );
    await this.assertBadgeInCourse(badgeId, courseId);

    await this.prisma.badge.update({
      where: { id: badgeId },
      data: { isActive: false },
    });

    return { message: 'Insignia desactivada correctamente' };
  }

  // ══════════════════════════════════════════════════════════
  //  ASIGNACIÓN DE BADGES
  // ══════════════════════════════════════════════════════════

  /** Asignar insignia a un estudiante. */
  async assignBadge(
    courseId: string,
    badgeId: string,
    dto: AssignBadgeDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'gamification',
    );
    await this.assertBadgeInCourse(badgeId, courseId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId } },
    });
    if (!enrollment) {
      throw new BadRequestException(
        `El estudiante ${dto.userId} no está matriculado en el curso`,
      );
    }

    try {
      return await this.prisma.studentBadge.create({
        data: { userId: dto.userId, badgeId },
        select: {
          id: true,
          awardedAt: true,
          user: { select: USER_SELECT },
          badge: { select: BADGE_SELECT },
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'El estudiante ya tiene esta insignia asignada',
        );
      }
      throw e;
    }
  }

  /**
   * Revocar insignia de un estudiante.
   * StudentBadge es una junction table → se elimina físicamente.
   */
  async revokeBadge(
    courseId: string,
    badgeId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'gamification',
    );
    await this.assertBadgeInCourse(badgeId, courseId);

    const assignment = await this.prisma.studentBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (!assignment) {
      throw new NotFoundException('El estudiante no tiene esta insignia asignada');
    }

    await this.prisma.studentBadge.delete({
      where: { userId_badgeId: { userId, badgeId } },
    });

    return { message: 'Insignia revocada correctamente' };
  }

  /** Badges ganados por un estudiante en el curso. STUDENT solo ve los suyos. */
  async getStudentBadges(
    courseId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, requesterId, requesterRole);

    if (requesterRole === 'STUDENT' && userId !== requesterId) {
      throw new ForbiddenException('Solo puedes consultar tus propios logros');
    }

    const badges = await this.prisma.studentBadge.findMany({
      where: { userId, badge: { courseId, isActive: true } },
      select: {
        id: true,
        awardedAt: true,
        badge: { select: BADGE_SELECT },
      },
      orderBy: { awardedAt: 'asc' },
    });

    return {
      data: badges,
      meta: { total: badges.length, userId, courseId },
    };
  }

  // ══════════════════════════════════════════════════════════
  //  HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════

  private async assertBadgeInCourse(badgeId: string, courseId: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      select: { ...BADGE_SELECT, isActive: true },
    });
    if (!badge || badge.courseId !== courseId || !badge.isActive) {
      throw new NotFoundException('Insignia no encontrada en este curso');
    }
    return badge;
  }
}
