import { expect, expectTypeOf, it } from "vitest";
import * as scoring from "./index.js";
import type {
  GradebookAverageEntry,
  ScoringFixtureSlide,
  ActivityEvaluationDetail,
  ActivityEvaluationResult,
  ActivityScoringKind,
} from "./index.js";

it("fija los parámetros y retornos públicos sin compilar los consumidores", () => {
  expectTypeOf(scoring.notaColombiana).toEqualTypeOf<
    (correctas: number, total: number, respondio: boolean) => number
  >();
  expectTypeOf(scoring.getActivityScoringKind).toEqualTypeOf<
    (activityType: string) => ActivityScoringKind | undefined
  >();
  expectTypeOf(scoring.esEvaluable).toEqualTypeOf<
    (activityType: string) => boolean
  >();
  expectTypeOf(scoring.isGradebookScoringDeferred).toEqualTypeOf<
    (activityType: string) => boolean
  >();
  expectTypeOf(scoring.countsTowardClassGradebookAverage).toEqualTypeOf<
    (entry: GradebookAverageEntry) => boolean
  >();
  expectTypeOf(scoring.computeClassGradebookPromedio).toEqualTypeOf<
    (entries: readonly GradebookAverageEntry[]) => number | null
  >();
  expectTypeOf(scoring.promedioFromFixtureSlides).toEqualTypeOf<
    (slides: readonly ScoringFixtureSlide[]) => number | null
  >();
  expectTypeOf(scoring.xpFromEvaluation).toEqualTypeOf<
    (result: ActivityEvaluationResult) => number
  >();
  expectTypeOf(scoring.isActivityDraftResponse).toEqualTypeOf<
    (response: unknown) => boolean
  >();
  expectTypeOf(scoring.unwrapActivityDraftResponse).toEqualTypeOf<
    (response: unknown) => unknown
  >();
  expectTypeOf(scoring.wrapActivityDraftResponse).toEqualTypeOf<
    (payload: unknown) => unknown
  >();
  expectTypeOf(scoring.normalizeVideoAnswers).toEqualTypeOf<
    (respuesta: unknown) => { questionIndex: number; answer: string }[]
  >();
  expectTypeOf(scoring.evaluateActivityResponse).toEqualTypeOf<
    (
      activityType: string,
      definicion: unknown,
      respuesta: unknown,
    ) => ActivityEvaluationResult
  >();
  expectTypeOf(scoring.extractActivityDefinition).toEqualTypeOf<
    (content: unknown) => Record<string, unknown> | null
  >();
  expectTypeOf(scoring.detailsForLivePanel).toEqualTypeOf<
    (
      details: ActivityEvaluationDetail[],
    ) => { label: string; correct: boolean | null }[]
  >();
});

// E6.3: el espejo `lumina-backend/src/classes/activity-scoring.ts` fue borrado
// y el backend consume `@lumina/scoring` directo. Ya no hay una segunda
// superficie pública que comparar por AST — `@lumina/scoring` es la única. La
// forma pública se ancla arriba con `expectTypeOf` y el comportamiento con
// `scoring.spec.ts` (fixtures) + los `*.parity.spec.tsx` del kit.

// E2.1: la implementación ya está portada — el comportamiento se valida en
// `scoring.spec.ts` (fixtures de paridad). Aquí solo un par de anclas rápidas.
it("ACTIVITY_SCORING es una tabla real (no un placeholder que lanza)", () => {
  expect(scoring.ACTIVITY_SCORING.quiz_multiple).toBe("partial");
  expect(Object.keys(scoring.ACTIVITY_SCORING).length).toBeGreaterThan(20);
});

it("evaluateActivityResponse puntúa sin lanzar", () => {
  const r = scoring.evaluateActivityResponse(
    "verdadero_falso",
    { respuestaCorrecta: true },
    true,
  );
  expect(r.score).toBe(5);
  expect(r.correct).toBe(true);
});
