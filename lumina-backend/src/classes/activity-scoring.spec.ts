import { readFileSync } from 'fs';
import { join } from 'path';

import {
  ACTIVITY_SCORING,
  evaluateActivityResponse,
  getActivityScoringKind,
  isGradebookScoringDeferred,
  notaColombiana,
  promedioFromFixtureSlides,
  xpFromEvaluation,
  type ActivityScoringKind,
} from './activity-scoring';

interface NotaCase {
  case: string;
  activityType: string;
  correctas: number;
  total: number;
  respondio: boolean;
  notaEsperada: number;
}

interface PromedioCase {
  case: string;
  slides: {
    activityType: string;
    correctas?: number;
    total?: number;
    respondio?: boolean;
    score?: number;
  }[];
  promedioEsperado: number;
}

interface EvaluationCase {
  case: string;
  activityType: string;
  definicion: unknown;
  respuesta: unknown;
  correctEsperado?: boolean;
  detailsEsperados?: number;
  scoreEsperado?: number | null;
}

interface FixturesFile {
  requiredActivityTypes: string[];
  notaCases: NotaCase[];
  promedioCases: PromedioCase[];
  evaluationCases: EvaluationCase[];
  expectedKinds: Record<string, ActivityScoringKind>;
  contractCases: ContractCase[];
}

interface ContractCase {
  case: string;
  activityType: string;
  definicion: unknown;
  respuesta: unknown;
}

const fixtures = JSON.parse(
  readFileSync(
    join(__dirname, 'class-results-gradebook.fixtures.json'),
    'utf8',
  ),
) as FixturesFile;

describe('notaColombiana', () => {
  it('mínimo pedagógico si respondió y todo mal', () => {
    expect(notaColombiana(0, 5, true)).toBe(1.0);
  });

  it('todo correcto → 5.0', () => {
    expect(notaColombiana(5, 5, true)).toBe(5.0);
  });

  it('3 de 5 con × 5 → 3.0 (no 3.4; esa cifra era de × 4 + 1)', () => {
    expect(notaColombiana(3, 5, true)).toBe(3.0);
    expect(notaColombiana(3, 5, true)).not.toBe(3.4);
  });

  it('no respondió → 0', () => {
    expect(notaColombiana(0, 5, false)).toBe(0);
  });

  it('total 0 → 0 (guard división por cero)', () => {
    expect(notaColombiana(2, 0, true)).toBe(0);
  });

  it.each(fixtures.notaCases.map((c) => [c.case, c]))(
    '%s',
    (_name, c: NotaCase) => {
      expect(notaColombiana(c.correctas, c.total, c.respondio)).toBe(
        c.notaEsperada,
      );
    },
  );
});

describe('ACTIVITY_SCORING', () => {
  it('cubre todos los activityType requeridos (incl. Grupo 4)', () => {
    for (const tipo of fixtures.requiredActivityTypes) {
      expect(ACTIVITY_SCORING[tipo]).toBeDefined();
    }
  });

  it('kinds canónicos', () => {
    expect(getActivityScoringKind('quiz_multiple')).toBe('partial');
    expect(getActivityScoringKind('completar_blancos')).toBe('partial');
    expect(getActivityScoringKind('short_answer')).toBe('manual');
    expect(getActivityScoringKind('encuesta_viva')).toBe('participation');
    expect(getActivityScoringKind('ruleta')).toBe('exclude');
    expect(getActivityScoringKind('torneo')).toBe('exclude');
    expect(getActivityScoringKind('escape_room')).toBe('exclude');
    expect(getActivityScoringKind('clasificar')).toBe('partial');
    expect(getActivityScoringKind('orden_rango')).toBe('partial');
    expect(getActivityScoringKind('tipo_inventado')).toBeUndefined();
  });

  it('Grupo 4 connected no queda diferido; orden_rango sí', () => {
    expect(isGradebookScoringDeferred('clasificar')).toBe(false);
    expect(isGradebookScoringDeferred('quiz_multiple')).toBe(false);
    expect(isGradebookScoringDeferred('sopa_letras')).toBe(false);
    expect(isGradebookScoringDeferred('orden_rango')).toBe(true);
    expect(isGradebookScoringDeferred('ruleta')).toBe(false);
  });
});

describe('promedio Edu (Fase 1)', () => {
  it.each(fixtures.promedioCases.map((c) => [c.case, c]))(
    '%s',
    (_name, c: PromedioCase) => {
      expect(promedioFromFixtureSlides(c.slides)).toBe(c.promedioEsperado);
    },
  );
});

describe('evaluateActivityResponse (Fase 2)', () => {
  it.each(fixtures.evaluationCases.map((c) => [c.case, c]))(
    '%s',
    (_name, c: EvaluationCase) => {
      const result = evaluateActivityResponse(
        c.activityType,
        c.definicion,
        c.respuesta,
      );
      if (c.correctEsperado !== undefined) {
        expect(result.correct).toBe(c.correctEsperado);
      }
      if (c.detailsEsperados !== undefined) {
        expect(result.details).toHaveLength(c.detailsEsperados);
        const indices = result.details.map((d) => d.index);
        expect(new Set(indices).size).toBe(indices.length);
      }
      if (c.scoreEsperado !== undefined) {
        expect(result.score).toBe(c.scoreEsperado);
      }
    },
  );

  it('encuesta_viva y nube_palabras no se puntúan', () => {
    expect(
      evaluateActivityResponse('encuesta_viva', {}, 'sí').score,
    ).toBeNull();
    expect(
      evaluateActivityResponse('nube_palabras', {}, 'palabra').score,
    ).toBeNull();
  });
});

const unscoredKinds = new Set<ActivityScoringKind>([
  'exclude',
  'manual',
  'participation',
]);

describe('contrato único (Fase 6)', () => {
  it('expectedKinds cubre exactamente las claves de ACTIVITY_SCORING', () => {
    expect(Object.keys(fixtures.expectedKinds).sort()).toEqual(
      Object.keys(ACTIVITY_SCORING).sort(),
    );
  });

  it.each(
    Object.entries(fixtures.expectedKinds).map(([tipo, kind]) => [tipo, kind]),
  )('%s → %s', (tipo: string, kind: ActivityScoringKind) => {
    expect(getActivityScoringKind(tipo)).toBe(kind);
  });

  it('hay un contractCase por cada activityType requerido', () => {
    const covered = new Set(fixtures.contractCases.map((c) => c.activityType));
    for (const tipo of fixtures.requiredActivityTypes) {
      expect(covered.has(tipo)).toBe(true);
    }
  });

  it.each(fixtures.contractCases.map((c) => [c.case, c]))(
    '%s',
    (_name, c: ContractCase) => {
      const kind = ACTIVITY_SCORING[c.activityType];
      expect(kind).toBeDefined();
      const result = evaluateActivityResponse(
        c.activityType,
        c.definicion,
        c.respuesta,
      );
      if (unscoredKinds.has(kind)) {
        expect(result.score).toBeNull();
        return;
      }
      expect(result.score).toBe(5.0);
      expect(result.score).toBe(notaColombiana(1, 1, true));
      expect(result.correct).toBe(true);
    },
  );
});

describe('xpFromEvaluation (Fase 6)', () => {
  it('score 5.0 → 100 XP; score 1.0 → 0 XP; score 3.0 → 50 XP', () => {
    expect(xpFromEvaluation({ score: 5, correct: true, details: [] })).toBe(
      100,
    );
    expect(xpFromEvaluation({ score: 1, correct: false, details: [] })).toBe(0);
    expect(xpFromEvaluation({ score: 3, correct: false, details: [] })).toBe(
      50,
    );
  });

  it('score null (exclude / manual / participation) → 0 XP', () => {
    expect(xpFromEvaluation({ score: null, correct: null, details: [] })).toBe(
      0,
    );
  });

  it('XP se deriva del score de evaluateActivityResponse, no de un recálculo crudo', () => {
    const result = evaluateActivityResponse(
      'completar_blancos',
      {
        blancos: [
          { id: 'b1', respuesta: 'x' },
          { id: 'b2', respuesta: 'y' },
        ],
      },
      { b1: 'x', b2: 'no' },
    );
    expect(result.score).toBe(2.5);
    expect(xpFromEvaluation(result)).toBe(38);
  });
});
