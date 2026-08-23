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

    const [totalStudents, totalActivities, gradeEntries, classCounts] =
      await Promise.all([
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
      select: {
        userId: true,
        user: { select: { id: true, name: true, lastName: true, email: true } },
      },
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
    if (!enrollment)
      throw new NotFoundException('Estudiante no matriculado en este curso');

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
        where: {
          userId: targetUserId,
          ...GRADE_ENTRY_WHERE(courseId, periodId),
        },
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
      totalActivities > 0 ? +(entries.length / totalActivities).toFixed(4) : 0;

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
            achievement: {
              select: { code: true, aspect: { select: { name: true } } },
            },
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

  async getEngagement(courseId: string, userId: string, userRole: string) {
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
      throw new ForbiddenException(
        'Solo docentes y administradores pueden exportar el curso',
      );
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        createdAt: true,
        teacher: {
          select: { id: true, name: true, lastName: true, email: true },
        },
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

  // ── Telemetría sesión en vivo (escritura silenciosa) ────────────────

  async createSessionLog(params: {
    sessionId: string;
    classId: string;
    courseId: string;
    teacherId: string;
    totalSlides: number;
    startedAt: Date;
  }): Promise<void> {
    try {
      await this.prisma.sessionLog.upsert({
        where: { sessionId: params.sessionId },
        create: {
          sessionId: params.sessionId,
          classId: params.classId,
          courseId: params.courseId,
          teacherId: params.teacherId,
          totalSlides: params.totalSlides,
          startedAt: params.startedAt,
        },
        update: {},
      });
    } catch {
      /* analytics no rompe el flujo principal */
    }
  }

  async closeSessionLog(sessionId: string, endedAt: Date): Promise<void> {
    try {
      const log = await this.prisma.sessionLog.findUnique({
        where: { sessionId },
        select: { startedAt: true },
      });
      if (!log) return;
      const durationSeconds = Math.round(
        (endedAt.getTime() - log.startedAt.getTime()) / 1000,
      );
      await this.prisma.sessionLog.update({
        where: { sessionId },
        data: { endedAt, durationSeconds },
      });
    } catch {
      /* no-op */
    }
  }

  async recordConnection(params: {
    sessionId: string;
    classId: string;
    studentId: string;
    studentName: string;
  }): Promise<void> {
    try {
      await this.prisma.studentConnection.create({
        data: {
          sessionId: params.sessionId,
          classId: params.classId,
          studentId: params.studentId,
          studentName: params.studentName,
        },
      });
    } catch {
      /* no-op */
    }
  }

  async recordDisconnection(sessionId: string, studentId: string): Promise<void> {
    try {
      const open = await this.prisma.studentConnection.findFirst({
        where: { sessionId, studentId, disconnectedAt: null },
        orderBy: { connectedAt: 'desc' },
      });
      if (open) {
        await this.prisma.studentConnection.update({
          where: { id: open.id },
          data: { disconnectedAt: new Date() },
        });
        return;
      }
      const previous = await this.prisma.studentConnection.findFirst({
        where: { sessionId, studentId, disconnectedAt: { not: null } },
        orderBy: { connectedAt: 'desc' },
      });
      if (previous) {
        await this.prisma.studentConnection.update({
          where: { id: previous.id },
          data: { reconnections: { increment: 1 } },
        });
      }
    } catch {
      /* no-op */
    }
  }

  async updatePeakConnections(sessionId: string): Promise<void> {
    try {
      const openCount = await this.prisma.studentConnection.count({
        where: { sessionId, disconnectedAt: null },
      });
      const log = await this.prisma.sessionLog.findUnique({
        where: { sessionId },
        select: { peakConnections: true },
      });
      if (!log || openCount <= log.peakConnections) return;
      await this.prisma.sessionLog.update({
        where: { sessionId },
        data: { peakConnections: openCount },
      });
    } catch {
      /* no-op */
    }
  }

  async recordSlideEngagement(params: {
    sessionId: string;
    slideId: string;
    slideIndex: number;
    activityType: string | null;
    studentId: string;
    studentName: string;
    responded: boolean;
    source?: 'live' | 'autonomous';
  }): Promise<void> {
    try {
      const sessionLog = await this.prisma.sessionLog.findUnique({
        where: { sessionId: params.sessionId },
        select: { id: true },
      });
      if (!sessionLog) return;

      const source = params.source ?? 'live';
      const existing = await this.prisma.slideEngagement.findUnique({
        where: {
          sessionLogId_slideId_studentId: {
            sessionLogId: sessionLog.id,
            slideId: params.slideId,
            studentId: params.studentId,
          },
        },
      });

      if (!existing) {
        await this.prisma.slideEngagement.create({
          data: {
            sessionLogId: sessionLog.id,
            slideId: params.slideId,
            slideIndex: params.slideIndex,
            activityType: params.activityType,
            studentId: params.studentId,
            studentName: params.studentName,
            responded: params.responded,
            source,
          },
        });
        return;
      }

      await this.prisma.slideEngagement.update({
        where: {
          sessionLogId_slideId_studentId: {
            sessionLogId: sessionLog.id,
            slideId: params.slideId,
            studentId: params.studentId,
          },
        },
        data: {
          slideIndex: params.slideIndex,
          ...(params.activityType !== undefined && params.activityType !== null
            ? { activityType: params.activityType }
            : {}),
          ...(params.responded ? { responded: true } : {}),
          source,
        },
      });
    } catch {
      /* no-op */
    }
  }

  // ── Telemetría sesión en vivo (lectura — staff) ─────────────────────

  async getSessionsComparison(
    courseId: string,
    userId: string,
    userRole: string,
  ): Promise<
    Array<{
      classId: string;
      classTitle: string;
      sessionId: string;
      startedAt: Date;
      endedAt: Date | null;
      durationSeconds: number | null;
      peakConnections: number;
      totalSlides: number;
      participantCount: number;
      avgScore: number | null;
    }>
  > {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    if (!isStaff(userRole)) {
      throw new ForbiddenException(
        'Solo el personal docente puede ver la comparativa de sesiones',
      );
    }

    const logs = await this.prisma.sessionLog.findMany({
      where: { courseId },
      orderBy: { startedAt: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            classId: true,
            class: { select: { title: true } },
          },
        },
      },
    });

    const rows = await Promise.all(
      logs.map(async (log) => {
        const grouped = await this.prisma.classResult.groupBy({
          by: ['studentId'],
          where: { sessionId: log.sessionId },
          _count: { _all: true },
        });
        const participantCount = grouped.length;

        const agg = await this.prisma.classResult.aggregate({
          where: { sessionId: log.sessionId, score: { not: null } },
          _avg: { score: true },
        });
        const rawAvg = agg._avg.score;
        const avgScore =
          rawAvg !== null && rawAvg !== undefined
            ? Math.round(Number(rawAvg) * 10) / 10
            : null;

        return {
          classId: log.session.classId,
          classTitle: log.session.class.title,
          sessionId: log.sessionId,
          startedAt: log.startedAt,
          endedAt: log.endedAt,
          durationSeconds: log.durationSeconds,
          peakConnections: log.peakConnections,
          totalSlides: log.totalSlides,
          participantCount,
          avgScore,
        };
      }),
    );

    return rows;
  }

  async getSessionDetail(
    sessionId: string,
    courseId: string,
    userId: string,
    userRole: string,
  ) {
    const logRow = await this.prisma.sessionLog.findUnique({
      where: { sessionId },
      include: {
        session: {
          select: {
            classId: true,
            class: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });
    if (!logRow) {
      throw new NotFoundException('Sesión no encontrada o sin telemetría');
    }

    if (logRow.courseId !== courseId) {
      throw new NotFoundException('Sesión no encontrada en este curso');
    }

    await this.courseAuth.verifyCourseReadAccess(
      logRow.session.class.courseId,
      userId,
      userRole,
    );
    if (!isStaff(userRole)) {
      throw new ForbiddenException(
        'Solo el personal docente puede ver el detalle de sesión',
      );
    }

    const engagements = await this.prisma.slideEngagement.findMany({
      where: { sessionLogId: logRow.id },
    });

    const bySlide = new Map<number, typeof engagements>();
    for (const e of engagements) {
      const arr = bySlide.get(e.slideIndex) ?? [];
      arr.push(e);
      bySlide.set(e.slideIndex, arr);
    }

    const slideHeatmap = [...bySlide.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([slideIndex, list]) => {
        const uniqueStudents = new Set(list.map((x) => x.studentId));
        const respondedStudents = new Set(
          list.filter((x) => x.responded).map((x) => x.studentId),
        );
        const responseRate =
          uniqueStudents.size > 0
            ? Math.round((respondedStudents.size / uniqueStudents.size) * 100)
            : 0;
        const avgTimeOnSlide =
          list.length > 0
            ? Math.round(
                list.reduce((s, x) => s + x.timeOnSlide, 0) / list.length,
              )
            : 0;
        return {
          slideIndex,
          slideId: list[0].slideId,
          activityType: list[0].activityType ?? null,
          avgTimeOnSlide,
          responseRate,
          totalStudents: uniqueStudents.size,
        };
      });

    const funnelData = [...bySlide.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([slideIndex, list]) => ({
        slideIndex,
        studentsReached: new Set(list.map((x) => x.studentId)).size,
      }));

    const byStudent = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        slides: Set<number>;
        slidesAnswered: number;
        totalTimeSeconds: number;
      }
    >();

    for (const e of engagements) {
      let cur = byStudent.get(e.studentId);
      if (!cur) {
        cur = {
          studentId: e.studentId,
          studentName: e.studentName,
          slides: new Set<number>(),
          slidesAnswered: 0,
          totalTimeSeconds: 0,
        };
        byStudent.set(e.studentId, cur);
      }
      cur.slides.add(e.slideIndex);
      if (e.responded) cur.slidesAnswered += 1;
      cur.totalTimeSeconds += e.timeOnSlide;
    }

    const studentEngagement = [...byStudent.values()].map((v) => ({
      studentId: v.studentId,
      studentName: v.studentName,
      slidesViewed: v.slides.size,
      slidesAnswered: v.slidesAnswered,
      totalTimeSeconds: v.totalTimeSeconds,
    }));

    return {
      sessionLog: {
        startedAt: logRow.startedAt,
        endedAt: logRow.endedAt,
        durationSeconds: logRow.durationSeconds,
        peakConnections: logRow.peakConnections,
        totalSlides: logRow.totalSlides,
      },
      slideHeatmap,
      funnelData,
      studentEngagement,
    };
  }

  async getAutonomousTextResponses(
    courseId: string,
    userId: string,
    userRole: string,
  ): Promise<
    Array<{
      sessionId: string;
      classId: string;
      classTitle: string;
      studentId: string;
      studentName: string;
      slideId: string;
      activityType: string;
      response: unknown;
      answeredAt: Date;
      score: number | null;
    }>
  > {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    if (!isStaff(userRole)) {
      throw new ForbiddenException(
        'Solo el personal docente puede ver estas respuestas',
      );
    }

    const rows = await this.prisma.autonomousProgress.findMany({
      where: {
        activityType: {
          in: ['short_answer', 'nube_palabras', 'encuesta_viva'],
        },
        session: {
          class: { courseId },
        },
      },
      include: {
        session: {
          select: {
            id: true,
            class: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { answeredAt: 'desc' },
    });

    return rows
      .filter((r) => r.response !== null && r.response !== undefined)
      .map((r) => ({
        sessionId: r.sessionId,
        classId: r.session.class.id,
        classTitle: r.session.class.title,
        studentId: r.studentId,
        studentName: r.studentName,
        slideId: r.slideId,
        activityType: r.activityType ?? '',
        response: r.response as unknown,
        answeredAt: r.answeredAt,
        score: r.score ?? null,
      }));
  }
}
