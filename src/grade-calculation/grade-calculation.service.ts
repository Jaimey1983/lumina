import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  score: number | null;        // nota_indicador (sobre 5.0)
  weightedScore: number | null;
  activities: ActivityResult[];
  hasAllActivities: boolean;
}

interface AspectResult {
  aspectId: string;
  aspectName: string;
  weight: number;
  score: number | null;        // nota_aspecto (sobre 5.0)
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
  processScore: number | null;       // suma ponderada de aspectos (sin self/peer)
  finalGrade: number | null;         // nota final sobre 5.0
  isComplete: boolean;               // true si no faltan entradas
  meta: {
    selfEvalWeight: number;
    peerEvalWeight: number;
    aspectsWeight: number;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class GradeCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Calcular nota de un estudiante en un período ───────────────────────────
  async calculateForStudent(
    courseId: string,
    periodId: string,
    userId: string,
  ): Promise<GradeBreakdown> {
    // 1. Verificar que el curso existe y tiene estructura
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
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

    if (!course) throw new NotFoundException(`Curso ${courseId} no encontrado`);
    if (!course.gradebookStructure) {
      throw new BadRequestException(
        `El curso ${courseId} no tiene estructura de calificación definida`,
      );
    }

    const aspectWeightSum = course.gradebookStructure.aspects.reduce(
      (sum, a) => sum + a.weight,
      0,
    );
    if (Math.abs(aspectWeightSum - 0.90) > 1e-5) {
      throw new BadRequestException(
        `Suma de aspectos: ${aspectWeightSum.toFixed(4)}. Debe ser exactamente 0.90.`,
      );
    }

    // 2. Verificar período
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, courseId },
      select: { id: true, name: true },
    });
    if (!period) {
      throw new NotFoundException(
        `Período ${periodId} no encontrado en el curso ${courseId}`,
      );
    }

    // 3. Verificar estudiante matriculado
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

    // 4. Obtener todas las GradeEntries del estudiante en este período
    //    de una sola consulta (evitar N+1)
    const allActivityIds = course.gradebookStructure.aspects.flatMap((a) =>
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

    // 5. Calcular nota_actividad, nota_indicador, nota_aspecto
    const aspectResults: AspectResult[] = course.gradebookStructure.aspects.map(
      (aspect) => {
        const indicatorResults: IndicatorResult[] = aspect.indicators.map(
          (indicator) => {
            const activityResults: ActivityResult[] = indicator.activities.map(
              (activity) => {
                const rawScore = entryMap.has(activity.id)
                  ? entryMap.get(activity.id)!
                  : null;

                // nota_actividad = score / maxScore × 5.0
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

            // nota_indicador = Σ (nota_actividad × activity.weight)
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

        // nota_aspecto = Σ (nota_indicador × indicator.weight)
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
      },
    );

    // 6. Obtener autoevaluación y coevaluación
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

    // 7. Calcular nota final
    // processScore = Σ (nota_aspecto × aspect.weight)
    const processScore = aspectResults.some((a) => a.weightedScore !== null)
      ? aspectResults.reduce((sum, a) => sum + (a.weightedScore ?? 0), 0)
      : null;

    // Pesos fijos según la fórmula del dominio
    const ASPECTS_WEIGHT = 0.9;   // 70% proceso + 20% convivencia = 90% de aspectos
    const SELF_EVAL_WEIGHT = 0.05;
    const PEER_EVAL_WEIGHT = 0.05;

    // nota_final = processScore×0.9 + selfEval×0.05 + peerEval×0.05
    // Nota: el desglose Proceso(70%) y Convivencia(20%) ya está dentro de los Aspects
    // con sus pesos configurados. processScore ya lleva ese desglose.
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

  // ── Calcular notas de todos los estudiantes del curso en un período ─────────
  async calculateForCourse(
    courseId: string,
    periodId: string,
  ): Promise<{
    data: GradeBreakdown[];
    meta: { total: number; complete: number; incomplete: number };
  }> {
    // Obtener todos los estudiantes matriculados
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
        this.calculateForStudent(courseId, periodId, e.userId),
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
  ): Promise<{
    data: {
      userId: string;
      studentName: string;
      finalGrade: number | null;
      isComplete: boolean;
    }[];
    meta: { total: number; average: number | null };
  }> {
    const full = await this.calculateForCourse(courseId, periodId);

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
}
