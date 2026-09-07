/**
 * E6.2 — paridad del espejo `./activity-scoring` (mantenido a mano) contra
 * `@lumina/scoring` (fuente única, consumida por CJS desde `dist/cjs`).
 *
 * Corre los mismos fixtures que `activity-scoring.spec.ts` a través de AMBAS
 * implementaciones y exige salida idéntica caso por caso. Red de seguridad
 * (Regla 7) previa a E6.3, que borra el espejo y reapunta a `@lumina/scoring`.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import * as espejo from './activity-scoring';
import * as pkg from '@lumina/scoring';

interface FixturesFile {
  requiredActivityTypes: string[];
  notaCases: {
    case: string;
    correctas: number;
    total: number;
    respondio: boolean;
  }[];
  promedioCases: {
    case: string;
    slides: {
      activityType: string;
      correctas?: number;
      total?: number;
      respondio?: boolean;
      score?: number;
    }[];
  }[];
  evaluationCases: {
    case: string;
    activityType: string;
    definicion: unknown;
    respuesta: unknown;
  }[];
  contractCases: {
    case: string;
    activityType: string;
    definicion: unknown;
    respuesta: unknown;
  }[];
  expectedKinds: Record<string, string>;
}

const fixtures = JSON.parse(
  readFileSync(
    join(__dirname, 'class-results-gradebook.fixtures.json'),
    'utf8',
  ),
) as FixturesFile;

describe('E6.2 — activity-scoring: espejo == @lumina/scoring', () => {
  it('exporta la misma superficie pública', () => {
    const claves = (m: Record<string, unknown>) =>
      Object.keys(m)
        .filter((k) => typeof m[k] !== 'undefined')
        .sort();
    expect(claves(pkg as unknown as Record<string, unknown>)).toEqual(
      claves(espejo as unknown as Record<string, unknown>),
    );
  });

  it('ACTIVITY_SCORING es la misma tabla', () => {
    expect(pkg.ACTIVITY_SCORING).toEqual(espejo.ACTIVITY_SCORING);
  });

  it('ACTIVITY_DRAFT_KEY coincide', () => {
    expect(pkg.ACTIVITY_DRAFT_KEY).toBe(espejo.ACTIVITY_DRAFT_KEY);
  });

  it.each(fixtures.requiredActivityTypes.map((t) => [t]))(
    'getActivityScoringKind / esEvaluable / isGradebookScoringDeferred — %s',
    (tipo: string) => {
      expect(pkg.getActivityScoringKind(tipo)).toBe(
        espejo.getActivityScoringKind(tipo),
      );
      expect(pkg.esEvaluable(tipo)).toBe(espejo.esEvaluable(tipo));
      expect(pkg.isGradebookScoringDeferred(tipo)).toBe(
        espejo.isGradebookScoringDeferred(tipo),
      );
    },
  );

  it.each(Object.keys(fixtures.expectedKinds).map((t) => [t]))(
    'expectedKinds — getActivityScoringKind(%s)',
    (tipo: string) => {
      expect(pkg.getActivityScoringKind(tipo)).toBe(
        espejo.getActivityScoringKind(tipo),
      );
    },
  );

  it.each(fixtures.notaCases.map((c) => [c.case, c]))(
    'notaColombiana — %s',
    (_n, c: FixturesFile['notaCases'][number]) => {
      expect(pkg.notaColombiana(c.correctas, c.total, c.respondio)).toBe(
        espejo.notaColombiana(c.correctas, c.total, c.respondio),
      );
    },
  );

  it.each(fixtures.promedioCases.map((c) => [c.case, c]))(
    'promedioFromFixtureSlides — %s',
    (_n, c: FixturesFile['promedioCases'][number]) => {
      expect(pkg.promedioFromFixtureSlides(c.slides)).toBe(
        espejo.promedioFromFixtureSlides(c.slides),
      );
    },
  );

  it.each(
    [...fixtures.evaluationCases, ...fixtures.contractCases].map((c) => [
      c.case,
      c,
    ]),
  )(
    'evaluateActivityResponse + xpFromEvaluation + detailsForLivePanel — %s',
    (_n, c: FixturesFile['evaluationCases'][number]) => {
      const a = pkg.evaluateActivityResponse(
        c.activityType,
        c.definicion,
        c.respuesta,
      );
      const b = espejo.evaluateActivityResponse(
        c.activityType,
        c.definicion,
        c.respuesta,
      );
      expect(a).toEqual(b);
      expect(pkg.xpFromEvaluation(a)).toBe(espejo.xpFromEvaluation(b));
      expect(pkg.detailsForLivePanel(a.details)).toEqual(
        espejo.detailsForLivePanel(b.details),
      );
    },
  );

  it('extractActivityDefinition coincide sobre los fixtures', () => {
    for (const c of fixtures.contractCases) {
      const wrapped = {
        actividad: { tipo: c.activityType, ...(c.definicion as object) },
      };
      expect(pkg.extractActivityDefinition(wrapped)).toEqual(
        espejo.extractActivityDefinition(wrapped),
      );
    }
  });

  it('draft helpers coinciden', () => {
    const payload = { foo: 1, bar: [2, 3] };
    const wrapped = pkg.wrapActivityDraftResponse(payload);
    expect(wrapped).toEqual(espejo.wrapActivityDraftResponse(payload));
    expect(pkg.isActivityDraftResponse(wrapped)).toBe(
      espejo.isActivityDraftResponse(wrapped),
    );
    expect(pkg.unwrapActivityDraftResponse(wrapped)).toEqual(
      espejo.unwrapActivityDraftResponse(wrapped),
    );
  });

  it('normalizeVideoAnswers coincide', () => {
    const raw = [
      { questionIndex: 0, answer: 'a' },
      { questionIndex: 1, answer: 'b' },
    ];
    expect(pkg.normalizeVideoAnswers(raw)).toEqual(
      espejo.normalizeVideoAnswers(raw),
    );
    expect(pkg.normalizeVideoAnswers('basura' as unknown)).toEqual(
      espejo.normalizeVideoAnswers('basura' as unknown),
    );
  });

  it('gradebook Edu: countsTowardClassGradebookAverage / computeClassGradebookPromedio', () => {
    const entries = [
      { activityType: 'quiz_multiple', score: 4.2, hasResult: true },
      {
        activityType: 'short_answer',
        score: 3.0,
        hasResult: true,
        isManual: true,
      },
      {
        activityType: 'short_answer',
        score: 1.0,
        hasResult: true,
        isManual: false,
      },
      { activityType: 'ruleta', score: 5.0, hasResult: true },
      { activityType: 'encuesta_viva', score: 5.0, hasResult: true },
      { activityType: 'clasificar', score: 2.5, hasResult: true },
      { activityType: 'quiz_multiple', score: null, hasResult: false },
    ];
    for (const e of entries) {
      expect(pkg.countsTowardClassGradebookAverage(e)).toBe(
        espejo.countsTowardClassGradebookAverage(e),
      );
    }
    expect(pkg.computeClassGradebookPromedio(entries)).toBe(
      espejo.computeClassGradebookPromedio(entries),
    );
    expect(pkg.computeClassGradebookPromedio([])).toBe(
      espejo.computeClassGradebookPromedio([]),
    );
  });
});
