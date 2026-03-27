import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { GradeCalculationService } from '../grade-calculation/grade-calculation.service';

// ─── Constantes y helpers puros ───────────────────────────

const SELF_EVAL_WEIGHT = 0.05;
const PEER_EVAL_WEIGHT = 0.05;

function round2(n: number | null): number | null {
  if (n === null) return null;
  return Math.round(n * 100) / 100;
}

// ─── Tipos internos ───────────────────────────────────────

type AspectNode = {
  id: string;
  name: string;
  weight: number;
  achievements: {
    id: string;
    code: string;
    performanceIndicators: {
      id: string;
      weight: number;
      activities: { id: string; name: string; weight: number; maxScore: number }[];
    }[];
  }[];
};

type LoadedData = {
  structure: { aspects: AspectNode[] } | null;
  periods: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }[];
  enrollments: {
    userId: string;
    user: { id: string; name: string; lastName: string; email: string };
  }[];
  // entryMap[userId][periodId][activityId] = score
  entryMap: Map<string, Map<string, Map<string, number>>>;
  // selfEvalMap[userId][periodId] = score
  selfEvalMap: Map<string, Map<string, number>>;
  // peerEvalMap[evaluatedId][periodId] = scores[]
  peerEvalMap: Map<string, Map<string, number[]>>;
};

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class PerformanceTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly gradeCalc: GradeCalculationService,
  ) {}

  // ── Auth helpers ──────────────────────────────────────────

  /** Staff o el propio estudiante puede ver datos de un estudiante en un curso. */
  private async _assertCanViewStudent(
    courseId: string,
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, requesterId, requesterRole);
    const isStaff = ['ADMIN', 'SUPERADMIN', 'TEACHER'].includes(requesterRole);
    if (!isStaff && requesterId !== targetUserId) {
      throw new ForbiddenException('Solo puedes ver tus propios datos de desempeño');
    }
    // Teacher: debe ser el docente titular del curso
    if (requesterRole === 'TEACHER') {
      await this.courseAuth.assertStaffCanManageCourse(
        courseId,
        requesterId,
        requesterRole,
        'reports',
      );
    }
  }

  // ── Core data loader (~6 queries en paralelo) ──────────────

  private async _loadData(courseId: string): Promise<LoadedData> {
    const [structure, periods, enrollments] = await Promise.all([
      this.prisma.gradebookStructure.findUnique({
        where: { courseId },
        select: {
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
                      weight: true,
                      activities: {
                        select: { id: true, name: true, weight: true, maxScore: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.period.findMany({
        where: { courseId },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      }),
      this.prisma.enrollment.findMany({
        where: { courseId },
        select: {
          userId: true,
          user: {
            select: { id: true, name: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    if (!structure || !periods.length || !enrollments.length) {
      return {
        structure,
        periods,
        enrollments,
        entryMap: new Map(),
        selfEvalMap: new Map(),
        peerEvalMap: new Map(),
      };
    }

    const allActivityIds = structure.aspects.flatMap((a) =>
      a.achievements.flatMap((ach) =>
        ach.performanceIndicators.flatMap((pi) =>
          pi.activities.map((act) => act.id),
        ),
      ),
    );
    const allPeriodIds = periods.map((p) => p.id);
    const allUserIds = enrollments.map((e) => e.userId);

    const [allEntries, selfEvals, peerEvals] = await Promise.all([
      this.prisma.gradeEntry.findMany({
        where: {
          userId: { in: allUserIds },
          periodId: { in: allPeriodIds },
          activityId: { in: allActivityIds },
        },
        select: { userId: true, periodId: true, activityId: true, score: true },
      }),
      this.prisma.selfEvaluation.findMany({
        where: {
          userId: { in: allUserIds },
          courseId,
          periodId: { in: allPeriodIds },
        },
        select: { userId: true, periodId: true, score: true },
      }),
      this.prisma.peerEvaluation.findMany({
        where: {
          evaluatedId: { in: allUserIds },
          courseId,
          periodId: { in: allPeriodIds },
        },
        select: { evaluatedId: true, periodId: true, score: true },
      }),
    ]);

    // Construir mapas en memoria
    const entryMap = new Map<string, Map<string, Map<string, number>>>();
    for (const e of allEntries) {
      if (!entryMap.has(e.userId)) entryMap.set(e.userId, new Map());
      const byPeriod = entryMap.get(e.userId)!;
      if (!byPeriod.has(e.periodId)) byPeriod.set(e.periodId, new Map());
      byPeriod.get(e.periodId)!.set(e.activityId, e.score);
    }

    const selfEvalMap = new Map<string, Map<string, number>>();
    for (const s of selfEvals) {
      if (!selfEvalMap.has(s.userId)) selfEvalMap.set(s.userId, new Map());
      selfEvalMap.get(s.userId)!.set(s.periodId, s.score);
    }

    const peerEvalMap = new Map<string, Map<string, number[]>>();
    for (const p of peerEvals) {
      if (!peerEvalMap.has(p.evaluatedId)) peerEvalMap.set(p.evaluatedId, new Map());
      const byPeriod = peerEvalMap.get(p.evaluatedId)!;
      if (!byPeriod.has(p.periodId)) byPeriod.set(p.periodId, []);
      byPeriod.get(p.periodId)!.push(p.score);
    }

    return { structure, periods, enrollments, entryMap, selfEvalMap, peerEvalMap };
  }

  // ── Cálculo en memoria ────────────────────────────────────

  private _computeGrade(
    studentId: string,
    periodId: string,
    structure: { aspects: AspectNode[] },
    entryMap: Map<string, Map<string, Map<string, number>>>,
    selfEvalMap: Map<string, Map<string, number>>,
    peerEvalMap: Map<string, Map<string, number[]>>,
  ) {
    const aspectWeightSum = structure.aspects.reduce((s, a) => s + a.weight, 0);
    const validStructure = Math.abs(aspectWeightSum - 0.9) <= 1e-5;

    const periodEntries = entryMap.get(studentId)?.get(periodId) ?? new Map<string, number>();

    let processScore = 0;
    let hasAny = false;
    let totalActivities = 0;
    let completedActivities = 0;

    if (validStructure) {
      for (const asp of structure.aspects) {
        let aspScore = 0;
        for (const ach of asp.achievements) {
          for (const pi of ach.performanceIndicators) {
            let piScore = 0;
            for (const act of pi.activities) {
              totalActivities++;
              const score = periodEntries.get(act.id);
              if (score !== undefined) {
                completedActivities++;
                hasAny = true;
                piScore += (score / act.maxScore) * 5.0 * act.weight;
              }
            }
            aspScore += piScore * pi.weight;
          }
        }
        processScore += aspScore * asp.weight;
      }
    }

    const selfScore = selfEvalMap.get(studentId)?.get(periodId) ?? null;
    const peerScores = peerEvalMap.get(studentId)?.get(periodId) ?? [];
    const peerScore =
      peerScores.length > 0
        ? peerScores.reduce((s, x) => s + x, 0) / peerScores.length
        : null;

    let finalGrade: number | null = null;
    if (hasAny) {
      finalGrade = processScore;
      if (selfScore !== null) finalGrade += selfScore * SELF_EVAL_WEIGHT;
      if (peerScore !== null) finalGrade += peerScore * PEER_EVAL_WEIGHT;
    }

    const completionRate =
      totalActivities > 0 ? completedActivities / totalActivities : 0;
    const isComplete =
      completedActivities === totalActivities &&
      totalActivities > 0 &&
      selfScore !== null &&
      peerScore !== null;

    return {
      finalGrade: round2(finalGrade),
      processScore: round2(hasAny ? processScore : null),
      selfEvaluationScore: round2(selfScore),
      peerEvaluationScore: round2(peerScore),
      isComplete,
      completionRate: +completionRate.toFixed(4),
      completedActivities,
      totalActivities,
    };
  }

  // ── 1. Evolución de nota por períodos ─────────────────────

  async getEvolution(
    courseId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
  ) {
    await this._assertCanViewStudent(courseId, targetUserId, userId, userRole);
    const { structure, periods, entryMap, selfEvalMap, peerEvalMap } =
      await this._loadData(courseId);

    if (!structure) {
      throw new BadRequestException(
        'El curso no tiene estructura de calificación definida',
      );
    }

    const evolution = periods.map((period) => ({
      period,
      ...this._computeGrade(
        targetUserId,
        period.id,
        structure,
        entryMap,
        selfEvalMap,
        peerEvalMap,
      ),
    }));

    const gradedPeriods = evolution
      .filter((e) => e.finalGrade !== null)
      .map((e) => e.finalGrade as number);

    let trend: 'up' | 'down' | 'stable' | null = null;
    if (gradedPeriods.length >= 2) {
      const diff = gradedPeriods[gradedPeriods.length - 1] - gradedPeriods[0];
      trend = diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'stable';
    }

    const avg =
      gradedPeriods.length > 0
        ? round2(gradedPeriods.reduce((s, g) => s + g, 0) / gradedPeriods.length)
        : null;

    return { targetUserId, trend, overallAvg: avg, evolution };
  }

  // ── 2. Comparativa vs promedio del curso ──────────────────

  async getComparison(
    courseId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
  ) {
    await this._assertCanViewStudent(courseId, targetUserId, userId, userRole);
    const { structure, periods, enrollments, entryMap, selfEvalMap, peerEvalMap } =
      await this._loadData(courseId);

    if (!structure) {
      throw new BadRequestException(
        'El curso no tiene estructura de calificación definida',
      );
    }

    const comparison = periods.map((period) => {
      const studentGrade = this._computeGrade(
        targetUserId,
        period.id,
        structure,
        entryMap,
        selfEvalMap,
        peerEvalMap,
      );

      const allGrades = enrollments
        .map(
          (e) =>
            this._computeGrade(
              e.userId,
              period.id,
              structure,
              entryMap,
              selfEvalMap,
              peerEvalMap,
            ).finalGrade,
        )
        .filter((g): g is number => g !== null);

      const courseAverage =
        allGrades.length > 0
          ? round2(allGrades.reduce((s, g) => s + g, 0) / allGrades.length)
          : null;

      const delta =
        studentGrade.finalGrade !== null && courseAverage !== null
          ? round2(studentGrade.finalGrade - courseAverage)
          : null;

      const studentRank =
        studentGrade.finalGrade !== null
          ? allGrades.filter((g) => g > studentGrade.finalGrade!).length + 1
          : null;

      return {
        period,
        studentGrade: studentGrade.finalGrade,
        courseAverage,
        delta,
        studentRank,
        totalStudentsWithGrade: allGrades.length,
      };
    });

    return { targetUserId, comparison };
  }

  // ── 3. Ranking histórico (todos los períodos) ─────────────

  async getRanking(courseId: string, userId: string, userRole: string) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'reports',
    );
    const { structure, periods, enrollments, entryMap, selfEvalMap, peerEvalMap } =
      await this._loadData(courseId);

    if (!structure) {
      throw new BadRequestException(
        'El curso no tiene estructura de calificación definida',
      );
    }

    const students = enrollments.map((enrollment) => {
      const periodGrades = periods.map((period) => {
        const grade = this._computeGrade(
          enrollment.userId,
          period.id,
          structure,
          entryMap,
          selfEvalMap,
          peerEvalMap,
        );
        return { periodId: period.id, periodName: period.name, ...grade };
      });

      const withGrade = periodGrades
        .filter((p) => p.finalGrade !== null)
        .map((p) => p.finalGrade as number);

      const overallAvg =
        withGrade.length > 0
          ? round2(withGrade.reduce((s, g) => s + g, 0) / withGrade.length)
          : null;

      return {
        user: enrollment.user,
        periodGrades,
        overallAvg,
        periodsWithGrade: withGrade.length,
      };
    });

    students.sort((a, b) => {
      if (a.overallAvg === null && b.overallAvg === null) return 0;
      if (a.overallAvg === null) return 1;
      if (b.overallAvg === null) return -1;
      return b.overallAvg - a.overallAvg;
    });

    // Asignar posición
    const ranked = students.map((s, idx) => ({ rank: idx + 1, ...s }));

    return {
      periods: periods.map((p) => ({ id: p.id, name: p.name })),
      students: ranked,
    };
  }

  // ── 4. Alertas de estudiantes en riesgo ───────────────────

  async getAtRisk(courseId: string, userId: string, userRole: string) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'reports',
    );
    const { structure, periods, enrollments, entryMap, selfEvalMap, peerEvalMap } =
      await this._loadData(courseId);

    const activePeriods = periods.filter((p) => p.isActive);

    if (!activePeriods.length) {
      return {
        activePeriods: [],
        thresholds: { gradeMin: 3.0, completionMin: 0.5 },
        atRisk: [],
        total: 0,
        message: 'No hay períodos activos en este curso',
      };
    }

    if (!structure) {
      throw new BadRequestException(
        'El curso no tiene estructura de calificación definida',
      );
    }

    const atRisk: {
      user: { id: string; name: string; lastName: string; email: string };
      period: { id: string; name: string };
      finalGrade: number | null;
      completionRate: number;
      completionPct: number;
      completedActivities: number;
      totalActivities: number;
      reasons: string[];
    }[] = [];

    for (const period of activePeriods) {
      for (const enrollment of enrollments) {
        const grade = this._computeGrade(
          enrollment.userId,
          period.id,
          structure,
          entryMap,
          selfEvalMap,
          peerEvalMap,
        );

        const reasons: string[] = [];
        if (grade.finalGrade !== null && grade.finalGrade < 3.0) {
          reasons.push('grade_below_3');
        }
        if (grade.completionRate < 0.5) {
          reasons.push('completion_below_50pct');
        }

        if (reasons.length > 0) {
          atRisk.push({
            user: enrollment.user,
            period: { id: period.id, name: period.name },
            finalGrade: grade.finalGrade,
            completionRate: grade.completionRate,
            completionPct: +(grade.completionRate * 100).toFixed(1),
            completedActivities: grade.completedActivities,
            totalActivities: grade.totalActivities,
            reasons,
          });
        }
      }
    }

    // Más en riesgo primero: sin nota > nota baja; luego por nota asc
    atRisk.sort((a, b) => {
      if (a.finalGrade === null && b.finalGrade === null) return 0;
      if (a.finalGrade === null) return -1;
      if (b.finalGrade === null) return 1;
      return a.finalGrade - b.finalGrade;
    });

    return {
      activePeriods: activePeriods.map((p) => ({ id: p.id, name: p.name })),
      thresholds: { gradeMin: 3.0, completionMin: 0.5 },
      atRisk,
      total: atRisk.length,
    };
  }

  // ── 5. Desglose por aspecto/indicador ─────────────────────

  async getBreakdown(
    courseId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
    periodId?: string,
  ) {
    await this._assertCanViewStudent(courseId, targetUserId, userId, userRole);

    if (!periodId?.trim()) {
      throw new BadRequestException(
        'El parámetro periodId es obligatorio para el desglose por aspecto/indicador',
      );
    }

    // Delegar a GradeCalculationService — ya tiene el árbol completo
    return this.gradeCalc.calculateForStudent(
      courseId,
      periodId,
      targetUserId,
      userId,
      userRole,
    );
  }

  // ── 6. Historial en todos los cursos del estudiante ───────

  async getCrossCourseHistory(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    // Solo ADMIN/SUPERADMIN o el propio estudiante
    const isAdmin =
      requesterRole === 'ADMIN' || requesterRole === 'SUPERADMIN';
    if (!isAdmin && requesterId !== targetUserId) {
      throw new ForbiddenException('Solo puedes ver tu propio historial académico');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        courseId: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            teacher: {
              select: { id: true, name: true, lastName: true },
            },
          },
        },
      },
    });

    // Cargar datos de cada curso en paralelo
    const courseHistories = await Promise.all(
      enrollments.map(async ({ course, createdAt }) => {
        const [structure, periods, selfEvals, peerEvals, gradeEntries] =
          await Promise.all([
            this.prisma.gradebookStructure.findUnique({
              where: { courseId: course.id },
              select: {
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
                            weight: true,
                            activities: {
                              select: {
                                id: true,
                                name: true,
                                weight: true,
                                maxScore: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),
            this.prisma.period.findMany({
              where: { courseId: course.id },
              orderBy: { startDate: 'asc' },
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                isActive: true,
              },
            }),
            this.prisma.selfEvaluation.findMany({
              where: { userId: targetUserId, courseId: course.id },
              select: { periodId: true, score: true },
            }),
            this.prisma.peerEvaluation.findMany({
              where: { evaluatedId: targetUserId, courseId: course.id },
              select: { periodId: true, score: true },
            }),
            this.prisma.gradeEntry.findMany({
              where: {
                userId: targetUserId,
                activity: {
                  performanceIndicator: {
                    achievement: {
                      aspect: { structure: { courseId: course.id } },
                    },
                  },
                },
              },
              select: { periodId: true, activityId: true, score: true },
            }),
          ]);

        if (!structure) {
          return {
            course,
            enrolledAt: createdAt,
            hasGradebook: false,
            periods: [],
          };
        }

        const aspectWeightSum = structure.aspects.reduce(
          (s, a) => s + a.weight,
          0,
        );
        const validStructure = Math.abs(aspectWeightSum - 0.9) <= 1e-5;

        const selfMap = new Map(selfEvals.map((s) => [s.periodId, s.score]));
        const peerMap = new Map<string, number[]>();
        for (const p of peerEvals) {
          if (!peerMap.has(p.periodId)) peerMap.set(p.periodId, []);
          peerMap.get(p.periodId)!.push(p.score);
        }
        const entryMap = new Map<string, Map<string, number>>();
        for (const e of gradeEntries) {
          if (!entryMap.has(e.periodId)) entryMap.set(e.periodId, new Map());
          entryMap.get(e.periodId)!.set(e.activityId, e.score);
        }

        const periodGrades = periods.map((period) => {
          if (!validStructure) {
            return { period, finalGrade: null, isComplete: false, completionRate: 0 };
          }

          const pEntries = entryMap.get(period.id) ?? new Map<string, number>();
          let processScore = 0;
          let hasAny = false;
          let totalAct = 0;
          let completedAct = 0;

          for (const asp of structure.aspects) {
            let aspScore = 0;
            for (const ach of asp.achievements) {
              for (const pi of ach.performanceIndicators) {
                let piScore = 0;
                for (const act of pi.activities) {
                  totalAct++;
                  const score = pEntries.get(act.id);
                  if (score !== undefined) {
                    completedAct++;
                    hasAny = true;
                    piScore += (score / act.maxScore) * 5.0 * act.weight;
                  }
                }
                aspScore += piScore * pi.weight;
              }
            }
            processScore += aspScore * asp.weight;
          }

          const selfScore = selfMap.get(period.id) ?? null;
          const peerScores = peerMap.get(period.id) ?? [];
          const peerScore =
            peerScores.length > 0
              ? peerScores.reduce((s, x) => s + x, 0) / peerScores.length
              : null;

          let finalGrade: number | null = null;
          if (hasAny) {
            finalGrade = processScore;
            if (selfScore !== null) finalGrade += selfScore * SELF_EVAL_WEIGHT;
            if (peerScore !== null) finalGrade += peerScore * PEER_EVAL_WEIGHT;
          }

          return {
            period,
            finalGrade: round2(finalGrade),
            completionRate: +(completedAct / Math.max(totalAct, 1)).toFixed(4),
            isComplete:
              completedAct === totalAct &&
              totalAct > 0 &&
              selfScore !== null &&
              peerScore !== null,
          };
        });

        return {
          course,
          enrolledAt: createdAt,
          hasGradebook: true,
          periods: periodGrades,
        };
      }),
    );

    return {
      targetUserId,
      totalCourses: enrollments.length,
      courses: courseHistories,
    };
  }
}
