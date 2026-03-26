import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';

// ─── Tipos internos ────────────────────────────────────────────────────────────

interface ActivityResult {
  activityId: string;
  activityName: string;
  weight: number;
  maxScore: number;
  rawScore: number | null;
  normalizedScore: number | null; // sobre 5.0
  weightedScore: number | null;
}

interface IndicatorResult {
  indicatorId: string;
  indicatorName: string;
  weight: number;
  score: number | null; // nota_indicador (sobre 5.0)
  weightedScore: number | null;
  activities: ActivityResult[];
  hasAllActivities: boolean;
}

interface AspectResult {
  aspectId: string;
  aspectName: string;
  weight: number;
  score: number | null; // nota_aspecto (sobre 5.0)
  weightedScore: number | null;
  indicators: IndicatorResult[];
  hasAllActivities: boolean;
}

export interface GradeBreakdown {
  courseId: string;
  periodId: string;
  userId: string;
  studentName: string;
  aspects: AspectResult[];
  selfEvaluationScore: number | null;
  peerEvaluationScore: number | null;
  processScore: number | null; // suma ponderada de aspectos (sin self/peer)
  finalGrade: number | null; // nota final sobre 5.0
  isComplete: boolean; // true si no faltan entradas
  meta: {
    selfEvalWeight: number;
    peerEvalWeight: number;
    aspectsWeight: number;
  };
}

/** Curso con estructura lista para cálculo (validada: suma aspectos = 0.90) */
type GradeCalcCourseLoaded = {
  id: string;
  gradebookStructure: {
    aspects: Array<{
      id: string;
      name: string;
      weight: number;
      indicators: Array<{
        id: string;
        name: string;
        weight: number;
        activities: Array<{
          id: string;
          name: string;
          weight: number;
          maxScore: number;
        }>;
      }>;
    }>;
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class GradeCalculationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ── Calcular nota de un estudiante en un período ───────────────────────────
  async calculateForStudent(
    courseId: string,
    periodId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<GradeBreakdown> {
    await this.courseAuth.verifyCourseReadAccess(
      courseId,
      requesterId,
      requesterRole,
    );
    const course = await this.loadCourseValidatedForGradeCalc(courseId);
    await this.assertPeriodInCourse(periodId, courseId);
    return this.breakdownForUser(course, courseId, periodId, userId);
  }

  // ── Calcular notas de todos los estudiantes del curso en un período ─────────
  async calculateForCourse(
    courseId: string,
    periodId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{
    data: GradeBreakdown[];
    meta: { total: number; complete: number; incomplete: number };
  }> {
    await this.courseAuth.verifyCourseReadAccess(
      courseId,
      requesterId,
      requesterRole,
    );
    const course = await this.loadCourseValidatedForGradeCalc(courseId);
    await this.assertPeriodInCourse(periodId, courseId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    if (enrollments.length === 0) {
      return {
        data: [],
        meta: { total: 0, complete: 0, incomplete: 0 },
      };
    }

    const results = await Promise.all(
      enrollments.map((e) =>
        this.breakdownForUser(course, courseId, periodId, e.userId),
      ),
    );

    const complete = results.filter((r) => r.isComplete).length;

    return {
      data: results,
      meta: {
        total: results.length,
        complete,
        incomplete: results.length - complete,
      },
    };
  }

  // ── Resumen de notas finales por período (vista compacta) ──────────────────
  async getSummary(
    courseId: string,
    periodId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{
    data: {
      userId: string;
      studentName: string;
      finalGrade: number | null;
      isComplete: boolean;
    }[];
    meta: { total: number; average: number | null };
  }> {
    const full = await this.calculateForCourse(
      courseId,
      periodId,
      requesterId,
      requesterRole,
    );

    const data = full.data.map((r) => ({
      userId: r.userId,
      studentName: r.studentName,
      finalGrade: r.finalGrade,
      isComplete: r.isComplete,
    }));

    const gradesWithValue = data
      .filter((d) => d.finalGrade !== null)
      .map((d) => d.finalGrade as number);

    const average =
      gradesWithValue.length > 0
        ? this.round(
            gradesWithValue.reduce((s, g) => s + g, 0) / gradesWithValue.length,
          )
        : null;

    return {
      data,
      meta: { total: data.length, average },
    };
  }

  // ── Helper: redondear a 2 decimales ───────────────────────────────────────
  private round(value: number | null): number | null {
    if (value === null) return null;
    return Math.round(value * 100) / 100;
  }

  private async loadCourseValidatedForGradeCalc(
    courseId: string,
  ): Promise<GradeCalcCourseLoaded> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        gradebookStructure: {
          select: {
            id: true,
            aspects: {
              select: {
                id: true,
                name: true,
                weight: true,
                indicators: {
                  select: {
                    id: true,
                    name: true,
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
    });

    if (!course) {
      throw new NotFoundException(`Curso ${courseId} no encontrado`);
    }
    if (!course.gradebookStructure) {
      throw new BadRequestException(
        `El curso ${courseId} no tiene estructura de calificación definida`,
      );
    }

    const aspectWeightSum = course.gradebookStructure.aspects.reduce(
      (sum, a) => sum + a.weight,
      0,
    );
    if (Math.abs(aspectWeightSum - 0.9) > 1e-5) {
      throw new BadRequestException(
        `Suma de aspectos: ${aspectWeightSum.toFixed(4)}. Debe ser exactamente 0.90.`,
      );
    }

    return course as GradeCalcCourseLoaded;
  }

  private async assertPeriodInCourse(periodId: string, courseId: string) {
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, courseId },
      select: { id: true },
    });
    if (!period) {
      throw new NotFoundException(
        `Período ${periodId} no encontrado en el curso ${courseId}`,
      );
    }
  }

  private async breakdownForUser(
    course: GradeCalcCourseLoaded,
    courseId: string,
    periodId: string,
    userId: string,
  ): Promise<GradeBreakdown> {
    const structure = course.gradebookStructure;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: {
        user: { select: { id: true, name: true, lastName: true } },
      },
    });
    if (!enrollment) {
      throw new NotFoundException(
        `El estudiante ${userId} no está matriculado en el curso ${courseId}`,
      );
    }

    const allActivityIds = structure.aspects.flatMap((a) =>
      a.indicators.flatMap((i) => i.activities.map((act) => act.id)),
    );

    const gradeEntries = await this.prisma.gradeEntry.findMany({
      where: {
        userId,
        periodId,
        activityId: { in: allActivityIds },
      },
      select: { activityId: true, score: true },
    });

    const entryMap = new Map<string, number>(
      gradeEntries.map((e) => [e.activityId, e.score]),
    );

    const aspectResults: AspectResult[] = structure.aspects.map((aspect) => {
      const indicatorResults: IndicatorResult[] = aspect.indicators.map(
        (indicator) => {
          const activityResults: ActivityResult[] = indicator.activities.map(
            (activity) => {
              const rawScore = entryMap.has(activity.id)
                ? entryMap.get(activity.id)!
                : null;

              const normalizedScore =
                rawScore !== null
                  ? (rawScore / activity.maxScore) * 5.0
                  : null;

              const weightedScore =
                normalizedScore !== null
                  ? normalizedScore * activity.weight
                  : null;

              return {
                activityId: activity.id,
                activityName: activity.name,
                weight: activity.weight,
                maxScore: activity.maxScore,
                rawScore,
                normalizedScore: this.round(normalizedScore),
                weightedScore: this.round(weightedScore),
              };
            },
          );

          const hasAllActivities = activityResults.every(
            (a) => a.rawScore !== null,
          );

          const indicatorScore = activityResults.every(
            (a) => a.weightedScore !== null,
          )
            ? activityResults.reduce(
                (sum, a) => sum + (a.weightedScore ?? 0),
                0,
              )
            : activityResults.some((a) => a.weightedScore !== null)
              ? activityResults.reduce(
                  (sum, a) => sum + (a.weightedScore ?? 0),
                  0,
                )
              : null;

          const indicatorWeightedScore =
            indicatorScore !== null
              ? indicatorScore * indicator.weight
              : null;

          return {
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            weight: indicator.weight,
            score: this.round(indicatorScore),
            weightedScore: this.round(indicatorWeightedScore),
            activities: activityResults,
            hasAllActivities,
          };
        },
      );

      const hasAllActivities = indicatorResults.every(
        (i) => i.hasAllActivities,
      );

      const aspectScore = indicatorResults.some(
        (i) => i.weightedScore !== null,
      )
        ? indicatorResults.reduce(
            (sum, i) => sum + (i.weightedScore ?? 0),
            0,
          )
        : null;

      const aspectWeightedScore =
        aspectScore !== null ? aspectScore * aspect.weight : null;

      return {
        aspectId: aspect.id,
        aspectName: aspect.name,
        weight: aspect.weight,
        score: this.round(aspectScore),
        weightedScore: this.round(aspectWeightedScore),
        indicators: indicatorResults,
        hasAllActivities,
      };
    });

    const selfEval = await this.prisma.selfEvaluation.findUnique({
      where: { userId_courseId_periodId: { userId, courseId, periodId } },
      select: { score: true },
    });

    const peerEvals = await this.prisma.peerEvaluation.findMany({
      where: { evaluatedId: userId, courseId, periodId },
      select: { score: true },
    });

    const selfEvaluationScore = selfEval?.score ?? null;
    const peerEvaluationScore =
      peerEvals.length > 0
        ? peerEvals.reduce((sum, p) => sum + p.score, 0) / peerEvals.length
        : null;

    const processScore = aspectResults.some((a) => a.weightedScore !== null)
      ? aspectResults.reduce((sum, a) => sum + (a.weightedScore ?? 0), 0)
      : null;

    const ASPECTS_WEIGHT = 0.9;
    const SELF_EVAL_WEIGHT = 0.05;
    const PEER_EVAL_WEIGHT = 0.05;

    let finalGrade: number | null = null;
    if (processScore !== null) {
      finalGrade = processScore;
      if (selfEvaluationScore !== null) {
        finalGrade += selfEvaluationScore * SELF_EVAL_WEIGHT;
      }
      if (peerEvaluationScore !== null) {
        finalGrade += peerEvaluationScore * PEER_EVAL_WEIGHT;
      }
    }

    const isComplete =
      aspectResults.every((a) => a.hasAllActivities) &&
      selfEvaluationScore !== null &&
      peerEvaluationScore !== null;

    return {
      courseId,
      periodId,
      userId,
      studentName: `${enrollment.user.name} ${enrollment.user.lastName}`,
      aspects: aspectResults,
      selfEvaluationScore: this.round(selfEvaluationScore),
      peerEvaluationScore: this.round(peerEvaluationScore),
      processScore: this.round(processScore),
      finalGrade: this.round(finalGrade),
      isComplete,
      meta: {
        selfEvalWeight: SELF_EVAL_WEIGHT,
        peerEvalWeight: PEER_EVAL_WEIGHT,
        aspectsWeight: ASPECTS_WEIGHT,
      },
    };
  }

}
