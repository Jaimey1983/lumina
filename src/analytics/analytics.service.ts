import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';

// ─── Helpers ──────────────────────────────────────────────

const CT_ABBREV: Record<string, string> = {
  COGNITIVE: 'COG',
  METHODOLOGICAL: 'MET',
  INTERPERSONAL: 'INT',
  INSTRUMENTAL: 'INS',
  SUBJECT_SPECIFIC: 'SUB',
};

const COURSE_ACTIVITY_WHERE = (courseId: string) => ({
  performanceIndicator: {
    achievement: {
      aspect: {
        structure: { courseId },
      },
    },
  },
});

const GRADE_ENTRY_WHERE = (courseId: string, periodId?: string) => ({
  ...(periodId ? { periodId } : {}),
  activity: COURSE_ACTIVITY_WHERE(courseId),
});

const isStaff = (role: string) =>
  role === 'ADMIN' || role === 'SUPERADMIN' || role === 'TEACHER';

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ── 1. Resumen del curso ──────────────────────────────────

  async getCourseSummary(
    courseId: string,
    userId: string,
    userRole: string,
    periodId?: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const [
      totalStudents,
      totalActivities,
      gradeEntries,
      classCounts,
    ] = await Promise.all([
      this.prisma.enrollment.count({ where: { courseId } }),
      this.prisma.activity.count({
        where: COURSE_ACTIVITY_WHERE(courseId),
      }),
      this.prisma.gradeEntry.findMany({
        where: GRADE_ENTRY_WHERE(courseId, periodId),
        select: {
          score: true,
          activity: { select: { maxScore: true } },
        },
      }),
      this.prisma.class.groupBy({
        by: ['status'],
        where: { courseId },
        _count: { id: true },
      }),
    ]);

    const classCountMap = Object.fromEntries(
      classCounts.map((c) => [c.status, c._count.id]),
    );

    const normalizedScores = gradeEntries.map(
      (e) => (e.score / e.activity.maxScore) * 5,
    );
    const avgGrade =
      normalizedScores.length > 0
        ? +(
            normalizedScores.reduce((a, b) => a + b, 0) /
            normalizedScores.length
          ).toFixed(2)
        : null;

    const expectedEntries = totalStudents * totalActivities;
    const completionRate =
      expectedEntries > 0
        ? +(gradeEntries.length / expectedEntries).toFixed(4)
        : 0;

    return {
      courseId,
      periodId: periodId ?? null,
      totalStudents,
      totalActivities,
      totalGradeEntries: gradeEntries.length,
      avgGrade,
      completionRate,
      completionRatePct: +(completionRate * 100).toFixed(2),
      classes: {
        draft: classCountMap['DRAFT'] ?? 0,
        published: classCountMap['PUBLISHED'] ?? 0,
        live: classCountMap['LIVE'] ?? 0,
        archived: classCountMap['ARCHIVED'] ?? 0,
        total: Object.values(classCountMap).reduce((a, b) => a + b, 0),
      },
    };
  }

  // ── 2. Progreso de todos los estudiantes ──────────────────

  async getAllStudentsProgress(
    courseId: string,
    userId: string,
    userRole: string,
    periodId?: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    if (!isStaff(userRole)) {
      // STUDENT: redirigir a sus propias métricas
      return {
        data: [await this._buildStudentProgress(courseId, userId, periodId)],
      };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true, user: { select: { id: true, name: true, lastName: true, email: true } } },
    });

    const data = await Promise.all(
      enrollments.map((e) =>
        this._buildStudentProgress(courseId, e.userId, periodId),
      ),
    );

    return { data };
  }

  // ── 3. Progreso individual de un estudiante ───────────────

  async getStudentProgress(
    courseId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
    periodId?: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    if (!isStaff(userRole) && userId !== targetUserId) {
      throw new ForbiddenException('Solo puedes ver tu propio progreso');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: targetUserId, courseId } },
      select: { userId: true },
    });
    if (!enrollment) throw new NotFoundException('Estudiante no matriculado en este curso');

    return this._buildStudentProgress(courseId, targetUserId, periodId);
  }

  private async _buildStudentProgress(
    courseId: string,
    targetUserId: string,
    periodId?: string,
  ) {
    const [user, entries, totalActivities] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, lastName: true, email: true },
      }),
      this.prisma.gradeEntry.findMany({
        where: { userId: targetUserId, ...GRADE_ENTRY_WHERE(courseId, periodId) },
        select: {
          score: true,
          createdAt: true,
          activity: { select: { maxScore: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.activity.count({ where: COURSE_ACTIVITY_WHERE(courseId) }),
    ]);

    const normalizedScores = entries.map(
      (e) => (e.score / e.activity.maxScore) * 5,
    );
    const avgGrade =
      normalizedScores.length > 0
        ? +(
            normalizedScores.reduce((a, b) => a + b, 0) /
            normalizedScores.length
          ).toFixed(2)
        : null;

    // Tendencia: comparar primera mitad vs segunda mitad de las notas
    let trend: 'up' | 'down' | 'stable' | null = null;
    if (normalizedScores.length >= 4) {
      const mid = Math.floor(normalizedScores.length / 2);
      const firstHalfAvg =
        normalizedScores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondHalfAvg =
        normalizedScores.slice(mid).reduce((a, b) => a + b, 0) /
        (normalizedScores.length - mid);
      const diff = secondHalfAvg - firstHalfAvg;
      trend = diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'stable';
    }

    const completionRate =
      totalActivities > 0
        ? +(entries.length / totalActivities).toFixed(4)
        : 0;

    return {
      user,
      periodId: periodId ?? null,
      activitiesCompleted: entries.length,
      totalActivities,
      completionRate,
      completionRatePct: +(completionRate * 100).toFixed(2),
      avgGrade,
      trend,
    };
  }

  // ── 4. Ranking de actividades por rendimiento ─────────────

  async getActivitiesRanking(
    courseId: string,
    userId: string,
    userRole: string,
    periodId?: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const activities = await this.prisma.activity.findMany({
      where: COURSE_ACTIVITY_WHERE(courseId),
      select: {
        id: true,
        name: true,
        weight: true,
        maxScore: true,
        performanceIndicator: {
          select: {
            competenceType: true,
            achievement: { select: { code: true, aspect: { select: { name: true } } } },
          },
        },
        gradeEntries: {
          where: periodId ? { periodId } : {},
          select: { score: true },
        },
      },
    });

    const ranked = activities
      .map((a) => {
        const scores = a.gradeEntries.map((e) => (e.score / a.maxScore) * 5);
        const avgScore =
          scores.length > 0
            ? +(scores.reduce((s, x) => s + x, 0) / scores.length).toFixed(2)
            : null;
        const piLabel = `${a.performanceIndicator.achievement.code}-${CT_ABBREV[a.performanceIndicator.competenceType] ?? a.performanceIndicator.competenceType}`;
        return {
          id: a.id,
          name: a.name,
          piLabel,
          aspectName: a.performanceIndicator.achievement.aspect.name,
          weight: a.weight,
          maxScore: a.maxScore,
          totalSubmissions: scores.length,
          avgScore,
        };
      })
      .sort((a, b) => {
        if (a.avgScore === null && b.avgScore === null) return 0;
        if (a.avgScore === null) return 1;
        if (b.avgScore === null) return -1;
        return b.avgScore - a.avgScore;
      });

    return {
      periodId: periodId ?? null,
      data: ranked,
      best: ranked[0] ?? null,
      worst: ranked[ranked.length - 1] ?? null,
    };
  }

  // ── 5. Participación en sesiones en vivo ──────────────────

  async getLiveSessionsStats(
    courseId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const classes = await this.prisma.class.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { slides: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const sessionsSummary = {
      total: classes.length,
      draft: classes.filter((c) => c.status === 'DRAFT').length,
      published: classes.filter((c) => c.status === 'PUBLISHED').length,
      live: classes.filter((c) => c.status === 'LIVE').length,
      archived: classes.filter((c) => c.status === 'ARCHIVED').length,
    };

    // Nota: el tracking por estudiante requeriría un modelo de asistencia en DB.
    // Se expone el estado de cada clase como proxy de "sesiones realizadas".
    return {
      summary: sessionsSummary,
      note: 'Per-student attendance tracking requires a dedicated attendance model. Showing class-level data.',
      classes,
    };
  }

  // ── 6. Engagement ─────────────────────────────────────────

  async getEngagement(
    courseId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    if (!isStaff(userRole)) {
      // STUDENT: solo ve el suyo
      return {
        data: [await this._buildEngagement(courseId, userId)],
      };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    const data = await Promise.all(
      enrollments.map((e) => this._buildEngagement(courseId, e.userId)),
    );

    return { data };
  }

  private async _buildEngagement(courseId: string, targetUserId: string) {
    const [user, messageCount, points, badges] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, lastName: true, email: true },
      }),
      this.prisma.message.count({
        where: { courseId, senderId: targetUserId, isDeleted: false },
      }),
      this.prisma.studentPoints.findUnique({
        where: { userId_courseId: { userId: targetUserId, courseId } },
        select: { points: true },
      }),
      this.prisma.studentBadge.count({
        where: {
          userId: targetUserId,
          badge: { courseId, isActive: true },
        },
      }),
    ]);

    return {
      user,
      messagesSent: messageCount,
      points: points?.points ?? 0,
      badgesEarned: badges,
    };
  }

  // ── 7. Export JSON estructurado ───────────────────────────

  async exportCourse(
    courseId: string,
    userId: string,
    userRole: string,
    periodId?: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    if (!isStaff(userRole)) {
      throw new ForbiddenException('Solo docentes y administradores pueden exportar el curso');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        createdAt: true,
        teacher: { select: { id: true, name: true, lastName: true, email: true } },
      },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const [summary, studentsProgress, activitiesRanking, engagement] =
      await Promise.all([
        this.getCourseSummary(courseId, userId, userRole, periodId),
        this.getAllStudentsProgress(courseId, userId, userRole, periodId),
        this.getActivitiesRanking(courseId, userId, userRole, periodId),
        this.getEngagement(courseId, userId, userRole),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      periodId: periodId ?? null,
      course,
      summary,
      studentsProgress: studentsProgress.data,
      activitiesRanking: activitiesRanking.data,
      engagement: engagement.data,
    };
  }
}
