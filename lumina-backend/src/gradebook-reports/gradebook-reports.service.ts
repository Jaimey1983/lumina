import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { GradeCalculationService } from '../grade-calculation/grade-calculation.service';

// ─── Tipos internos ────────────────────────────────────────

export interface FlatActivity {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  piId: string;
  piLabel: string;
  piWeight: number;
  aspectId: string;
  aspectName: string;
  aspectWeight: number;
}

const SELF_EVAL_WEIGHT = 0.05;
const PEER_EVAL_WEIGHT = 0.05;

const CT_ABBREV: Record<string, string> = {
  COGNITIVE: 'COG',
  METHODOLOGICAL: 'MET',
  INTERPERSONAL: 'INT',
  INSTRUMENTAL: 'INS',
  SUBJECT_SPECIFIC: 'SUB',
};

function round2(n: number | null): number | null {
  if (n === null) return null;
  return Math.round(n * 100) / 100;
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class GradebookReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly gradeCalc: GradeCalculationService,
  ) {}

  // ── Guardia de acceso staff + validaciones comunes ───────

  private async assertStaff(
    courseId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'reports',
    );
  }

  private async assertPeriod(periodId: string, courseId: string) {
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, courseId },
      select: { id: true, name: true, startDate: true, endDate: true },
    });
    if (!period) {
      throw new NotFoundException(
        `Período ${periodId} no encontrado en el curso`,
      );
    }
    return period;
  }

  private requirePeriod(periodId: string | undefined): string {
    if (!periodId?.trim()) {
      throw new BadRequestException(
        'El parámetro periodId es obligatorio para este reporte',
      );
    }
    return periodId;
  }

  // ── Helper: cargar estructura + datos del período en pocas queries ──

  private async loadReportData(courseId: string, periodId: string) {
    const [structure, enrollments, allEntries, selfEvals, peerEvals, course] =
      await Promise.all([
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
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.enrollment.findMany({
          where: { courseId },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        // Todas las notas del período para cualquier actividad del curso
        this.prisma.gradeEntry.findMany({
          where: {
            periodId,
            activity: {
              performanceIndicator: {
                achievement: { aspect: { structure: { courseId } } },
              },
            },
          },
          select: {
            userId: true,
            activityId: true,
            score: true,
            feedback: true,
          },
        }),
        this.prisma.selfEvaluation.findMany({
          where: { courseId, periodId },
          select: { userId: true, score: true, feedback: true },
        }),
        this.prisma.peerEvaluation.findMany({
          where: { courseId, periodId },
          select: { evaluatedId: true, score: true },
        }),
        this.prisma.course.findUnique({
          where: { id: courseId },
          select: { id: true, name: true, code: true },
        }),
      ]);

    if (!structure) {
      throw new BadRequestException(
        'El curso no tiene estructura de calificación definida',
      );
    }

    // Aplanar actividades con jerarquía
    const flatActivities: FlatActivity[] = structure.aspects.flatMap((asp) =>
      asp.achievements.flatMap((ach) =>
        ach.performanceIndicators.flatMap((pi) => {
          const piLabel = `${ach.code}-${CT_ABBREV[pi.competenceType] ?? pi.competenceType}`;
          return pi.activities.map((act) => ({
            id: act.id,
            name: act.name,
            weight: act.weight,
            maxScore: act.maxScore,
            piId: pi.id,
            piLabel,
            piWeight: pi.weight,
            aspectId: asp.id,
            aspectName: asp.name,
            aspectWeight: asp.weight,
          }));
        }),
      ),
    );

    // Mapas en memoria para acceso O(1)
    const activityIds = new Set(flatActivities.map((a) => a.id));

    // entryMap[userId][activityId] = { score, feedback }
    const entryMap = new Map<
      string,
      Map<string, { score: number; feedback: string | null }>
    >();
    for (const e of allEntries) {
      if (!activityIds.has(e.activityId)) continue;
      if (!entryMap.has(e.userId)) entryMap.set(e.userId, new Map());
      entryMap
        .get(e.userId)
        .set(e.activityId, { score: e.score, feedback: e.feedback ?? null });
    }

    // selfEvalMap[userId] = { score, feedback }
    const selfEvalMap = new Map(
      selfEvals.map((s) => [
        s.userId,
        { score: s.score, feedback: s.feedback ?? null },
      ]),
    );

    // peerEvalMap[evaluatedId] = { scores[] }
    const peerEvalMap = new Map<string, number[]>();
    for (const p of peerEvals) {
      if (!peerEvalMap.has(p.evaluatedId)) peerEvalMap.set(p.evaluatedId, []);
      peerEvalMap.get(p.evaluatedId).push(p.score);
    }

    return {
      course,
      structure,
      flatActivities,
      enrollments,
      entryMap,
      selfEvalMap,
      peerEvalMap,
    };
  }

  // Calcula nota final de un estudiante en memoria (sin queries adicionales)
  private computeStudentGrade(
    studentId: string,
    flatActivities: FlatActivity[],
    structure: NonNullable<
      Awaited<ReturnType<typeof this.loadReportData>>['structure']
    >,
    entryMap: Map<
      string,
      Map<string, { score: number; feedback: string | null }>
    >,
    selfEvalMap: Map<string, { score: number; feedback: string | null }>,
    peerEvalMap: Map<string, number[]>,
  ) {
    type EntryVal = { score: number; feedback: string | null };
    const studentEntries: Map<string, EntryVal> =
      entryMap.get(studentId) ?? new Map<string, EntryVal>();

    // Calcular processScore desde la jerarquía
    let processScore: number | null = null;
    let hasAnyActivity = false;
    let allComplete = true;

    const aspectWeightSum = structure.aspects.reduce((s, a) => s + a.weight, 0);
    const structureValid = Math.abs(aspectWeightSum - 0.9) <= 1e-5;

    if (structureValid) {
      let ps = 0;
      for (const asp of structure.aspects) {
        let aspScore = 0;
        for (const ach of asp.achievements) {
          for (const pi of ach.performanceIndicators) {
            let piScore = 0;
            for (const act of pi.activities) {
              const entry = studentEntries.get(act.id);
              if (!entry) {
                allComplete = false;
                continue;
              }
              hasAnyActivity = true;
              const norm = (entry.score / act.maxScore) * 5.0;
              piScore += norm * act.weight;
            }
            aspScore += piScore * pi.weight;
          }
        }
        ps += aspScore * asp.weight;
      }
      if (hasAnyActivity) processScore = ps;
    }

    const selfEval = selfEvalMap.get(studentId) ?? null;
    const peerScores = peerEvalMap.get(studentId) ?? [];
    const peerEvalAvg =
      peerScores.length > 0
        ? peerScores.reduce((s, x) => s + x, 0) / peerScores.length
        : null;

    let finalGrade: number | null = null;
    if (processScore !== null) {
      finalGrade = processScore;
      if (selfEval !== null) finalGrade += selfEval.score * SELF_EVAL_WEIGHT;
      if (peerEvalAvg !== null) finalGrade += peerEvalAvg * PEER_EVAL_WEIGHT;
    }

    const isComplete = allComplete && selfEval !== null && peerEvalAvg !== null;

    return {
      processScore: round2(processScore),
      selfEvaluationScore: round2(selfEval?.score ?? null),
      peerEvaluationScore: round2(peerEvalAvg),
      finalGrade: round2(finalGrade),
      isComplete,
    };
  }

  // ── 1. Reporte matriz estudiantes × actividades ───────────

  async getMatrix(
    courseId: string,
    userId: string,
    userRole: string,
    periodIdRaw?: string,
  ) {
    await this.assertStaff(courseId, userId, userRole);
    const periodId = this.requirePeriod(periodIdRaw);
    const period = await this.assertPeriod(periodId, courseId);

    const {
      course,
      structure,
      flatActivities,
      enrollments,
      entryMap,
      selfEvalMap,
      peerEvalMap,
    } = await this.loadReportData(courseId, periodId);

    type EntryVal = { score: number; feedback: string | null };
    const rows = enrollments.map((enrollment) => {
      const sid = enrollment.userId;
      const studentEntries: Map<string, EntryVal> =
        entryMap.get(sid) ?? new Map<string, EntryVal>();

      const cells = flatActivities.map((act) => {
        const entry = studentEntries.get(act.id);
        return entry
          ? {
              activityId: act.id,
              score: entry.score,
              normalizedScore: round2((entry.score / act.maxScore) * 5.0),
              feedback: entry.feedback,
            }
          : {
              activityId: act.id,
              score: null,
              normalizedScore: null,
              feedback: null,
            };
      });

      const selfEval = selfEvalMap.get(sid) ?? null;
      const peerScores = peerEvalMap.get(sid) ?? [];
      const peerAvg =
        peerScores.length > 0
          ? round2(peerScores.reduce((s, x) => s + x, 0) / peerScores.length)
          : null;

      const grade = this.computeStudentGrade(
        sid,
        flatActivities,
        structure,
        entryMap,
        selfEvalMap,
        peerEvalMap,
      );

      return {
        user: enrollment.user,
        cells,
        selfEvaluation: selfEval
          ? { score: selfEval.score, feedback: selfEval.feedback }
          : null,
        peerEvaluation: { avgScore: peerAvg, count: peerScores.length },
        processScore: grade.processScore,
        finalGrade: grade.finalGrade,
        isComplete: grade.isComplete,
      };
    });

    return {
      reportedAt: new Date().toISOString(),
      course,
      period,
      activities: flatActivities,
      rows,
      meta: {
        totalStudents: enrollments.length,
        totalActivities: flatActivities.length,
      },
    };
  }

  // ── 2. Desglose completo de un estudiante ─────────────────

  async getStudentBreakdown(
    courseId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
    periodIdRaw?: string,
  ) {
    await this.assertStaff(courseId, userId, userRole);
    const periodId = this.requirePeriod(periodIdRaw);

    return this.gradeCalc.calculateForStudent(
      courseId,
      periodId,
      targetUserId,
      userId,
      userRole,
    );
  }

  // ── 3. Notas finales del curso ────────────────────────────

  async getFinalGrades(
    courseId: string,
    userId: string,
    userRole: string,
    periodIdRaw?: string,
  ) {
    await this.assertStaff(courseId, userId, userRole);
    const periodId = this.requirePeriod(periodIdRaw);

    return this.gradeCalc.getSummary(courseId, periodId, userId, userRole);
  }

  // ── 4. Distribución de notas por rangos ───────────────────

  async getDistribution(
    courseId: string,
    userId: string,
    userRole: string,
    periodIdRaw?: string,
  ) {
    await this.assertStaff(courseId, userId, userRole);
    const periodId = this.requirePeriod(periodIdRaw);
    const period = await this.assertPeriod(periodId, courseId);

    const summary = await this.gradeCalc.getSummary(
      courseId,
      periodId,
      userId,
      userRole,
    );

    const ranges = [
      { label: '0–1', min: 0, max: 1 },
      { label: '1–2', min: 1, max: 2 },
      { label: '2–3', min: 2, max: 3 },
      { label: '3–4', min: 3, max: 4 },
      { label: '4–5', min: 4, max: 5 },
    ].map(({ label, min, max }) => {
      const students = summary.data.filter(
        (s) =>
          s.finalGrade !== null &&
          s.finalGrade >= min &&
          (max === 5 ? s.finalGrade <= max : s.finalGrade < max),
      );
      return { label, min, max, count: students.length, students };
    });

    const withoutGrade = summary.data.filter((s) => s.finalGrade === null);

    return {
      reportedAt: new Date().toISOString(),
      period,
      ranges,
      withoutGrade,
      average: summary.meta.average,
      total: summary.meta.total,
    };
  }

  // ── 5. Actividades sin calificar por estudiante ───────────

  async getPending(
    courseId: string,
    userId: string,
    userRole: string,
    periodIdRaw?: string,
  ) {
    await this.assertStaff(courseId, userId, userRole);
    const periodId = this.requirePeriod(periodIdRaw);
    const period = await this.assertPeriod(periodId, courseId);

    const { flatActivities, enrollments, entryMap } = await this.loadReportData(
      courseId,
      periodId,
    );

    const students = enrollments.map((enrollment) => {
      const sid = enrollment.userId;
      const studentEntries =
        entryMap.get(sid) ??
        new Map<string, { score: number; feedback: string | null }>();

      const pendingActivities = flatActivities.filter(
        (act) => !studentEntries.has(act.id),
      );
      const completedActivities = flatActivities.filter((act) =>
        studentEntries.has(act.id),
      );

      return {
        user: enrollment.user,
        completedCount: completedActivities.length,
        pendingCount: pendingActivities.length,
        totalCount: flatActivities.length,
        completionPct: +(
          (completedActivities.length / Math.max(flatActivities.length, 1)) *
          100
        ).toFixed(1),
        pendingActivities: pendingActivities.map((a) => ({
          id: a.id,
          name: a.name,
          indicatorName: a.piLabel,
          aspectName: a.aspectName,
        })),
      };
    });

    // Ordenar: más pendientes primero
    students.sort((a, b) => b.pendingCount - a.pendingCount);

    return {
      reportedAt: new Date().toISOString(),
      period,
      totalActivities: flatActivities.length,
      students,
    };
  }

  // ── 6. Export JSON completo del período ───────────────────

  async exportReport(
    courseId: string,
    userId: string,
    userRole: string,
    periodIdRaw?: string,
  ) {
    await this.assertStaff(courseId, userId, userRole);
    const periodId = this.requirePeriod(periodIdRaw);

    // Cargar una vez y derivar todo
    const period = await this.assertPeriod(periodId, courseId);
    const {
      course,
      structure,
      flatActivities,
      enrollments,
      entryMap,
      selfEvalMap,
      peerEvalMap,
    } = await this.loadReportData(courseId, periodId);

    // Calcular notas finales por estudiante en memoria
    const studentGrades = enrollments.map((e) => {
      const grade = this.computeStudentGrade(
        e.userId,
        flatActivities,
        structure,
        entryMap,
        selfEvalMap,
        peerEvalMap,
      );
      return {
        user: e.user,
        ...grade,
      };
    });

    // Distribución
    const ranges = [
      { label: '0–1', min: 0, max: 1 },
      { label: '1–2', min: 1, max: 2 },
      { label: '2–3', min: 2, max: 3 },
      { label: '3–4', min: 3, max: 4 },
      { label: '4–5', min: 4, max: 5 },
    ].map(({ label, min, max }) => ({
      label,
      count: studentGrades.filter(
        (s) =>
          s.finalGrade !== null &&
          s.finalGrade >= min &&
          (max === 5 ? s.finalGrade <= max : s.finalGrade < max),
      ).length,
    }));

    const gradesWithValue = studentGrades
      .filter((s) => s.finalGrade !== null)
      .map((s) => s.finalGrade);
    const average =
      gradesWithValue.length > 0
        ? round2(
            gradesWithValue.reduce((s, g) => s + g, 0) / gradesWithValue.length,
          )
        : null;

    // Pendientes
    const pending = enrollments.map((e) => {
      const studentEntries =
        entryMap.get(e.userId) ??
        new Map<string, { score: number; feedback: string | null }>();
      return {
        user: e.user,
        pendingCount: flatActivities.filter((a) => !studentEntries.has(a.id))
          .length,
      };
    });

    return {
      exportedAt: new Date().toISOString(),
      course,
      period,
      totalActivities: flatActivities.length,
      finalGrades: studentGrades,
      distribution: { ranges, average, total: enrollments.length },
      pending,
    };
  }
}
