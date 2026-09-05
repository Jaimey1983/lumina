/** Superficie pública de scoring. Implementación pendiente de E2; sin consumidores. */

function noImplementado(): never {
  throw new Error("no implementado — ver E2");
}

export type ActivityScoringKind =
  | "binary"
  | "partial"
  | "manual"
  | "participation"
  | "exclude";

export const notaColombiana: (
  correctas: number,
  total: number,
  respondio: boolean,
) => number = noImplementado;

export const getActivityScoringKind: (
  activityType: string,
) => ActivityScoringKind | undefined = noImplementado;

export const esEvaluable: (activityType: string) => boolean = noImplementado;

export const isGradebookScoringDeferred: (activityType: string) => boolean =
  noImplementado;

export interface GradebookAverageEntry {
  activityType: string;
  score: number | null;
  hasResult: boolean;
  isManual?: boolean;
  maxScore?: number;
}

export const countsTowardClassGradebookAverage: (
  entry: GradebookAverageEntry,
) => boolean = noImplementado;

export const computeClassGradebookPromedio: (
  entries: readonly GradebookAverageEntry[],
) => number | null = noImplementado;

export interface ScoringFixtureSlide {
  activityType: string;
  correctas?: number;
  total?: number;
  respondio?: boolean;
  score?: number;
}

export const promedioFromFixtureSlides: (
  slides: readonly ScoringFixtureSlide[],
) => number | null = noImplementado;

export interface ActivityEvaluationDetail {
  index: number;
  correct: boolean;
  /** Etiqueta para el panel en vivo; no entra al score. */
  label?: string;
}

export interface ActivityEvaluationResult {
  /** true solo si TODO fue correcto. null si no aplica (manual / participation / exclude / no evaluable). */
  correct: boolean | null;
  details: ActivityEvaluationDetail[];
  /** notaColombiana, o null si es manual / participation / exclude / no se puede puntuar. */
  score: number | null;
}

export const xpFromEvaluation: (result: ActivityEvaluationResult) => number =
  noImplementado;

export const isActivityDraftResponse: (response: unknown) => boolean =
  noImplementado;

export const unwrapActivityDraftResponse: (response: unknown) => unknown =
  noImplementado;

export const wrapActivityDraftResponse: (payload: unknown) => unknown =
  noImplementado;

export const normalizeVideoAnswers: (
  respuesta: unknown,
) => { questionIndex: number; answer: string }[] = noImplementado;

export const evaluateActivityResponse: (
  activityType: string,
  definicion: unknown,
  respuesta: unknown,
) => ActivityEvaluationResult = noImplementado;

export const extractActivityDefinition: (
  content: unknown,
) => Record<string, unknown> | null = noImplementado;

export const detailsForLivePanel: (
  details: ActivityEvaluationDetail[],
) => { label: string; correct: boolean | null }[] = noImplementado;

/** Tabla pendiente de E2: consultarla falla explícitamente, no devuelve datos ficticios. */

export const ACTIVITY_SCORING: Record<string, ActivityScoringKind> = new Proxy(
  {},
  {
    get: noImplementado,
    has: noImplementado,
    ownKeys: noImplementado,

    getOwnPropertyDescriptor: noImplementado,
    set: noImplementado,
  },
);

export const ACTIVITY_DRAFT_KEY = "__luminaDraft";
