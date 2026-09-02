import { describe, expect, it } from 'vitest';

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
import fixtures from './activity-scoring.fixtures.json';

interface NotaCase {
  case: string;
  activityType: string;
  correctas: number;
  total: number;
  respondio: boolean;
  notaEsperada: number;
}

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

  it.each(fixtures.notaCases as NotaCase[])(
    '$case → $notaEsperada',
    ({ correctas, total, respondio, notaEsperada }) => {
      expect(notaColombiana(correctas, total, respondio)).toBe(notaEsperada);
    },
  );
});

describe('ACTIVITY_SCORING', () => {
  it('cubre todos los activityType requeridos (incl. Grupo 4)', () => {
    for (const tipo of fixtures.requiredActivityTypes) {
      expect(ACTIVITY_SCORING[tipo], `falta kind para ${tipo}`).toBeDefined();
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
    expect(getActivityScoringKind('memoria')).toBe('partial');
    expect(getActivityScoringKind('globos')).toBe('partial');
    expect(getActivityScoringKind('abrir_caja')).toBe('partial');
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

describe('promedio Edu (Fase 1)', () => {
  it.each((fixtures as { promedioCases: PromedioCase[] }).promedioCases)(
    '$case → $promedioEsperado',
    ({ slides, promedioEsperado }) => {
      expect(promedioFromFixtureSlides(slides)).toBe(promedioEsperado);
    },
  );
});

interface EvaluationCase {
  case: string;
  activityType: string;
  definicion: unknown;
  respuesta: unknown;
  correctEsperado?: boolean;
  detailsEsperados?: number;
  scoreEsperado?: number | null;
}

describe('evaluateActivityResponse (Fase 2)', () => {
  it.each((fixtures as { evaluationCases: EvaluationCase[] }).evaluationCases)(
    '$case',
    ({ activityType, definicion, respuesta, correctEsperado, detailsEsperados, scoreEsperado }) => {
      const result = evaluateActivityResponse(activityType, definicion, respuesta);
      if (correctEsperado !== undefined) {
        expect(result.correct).toBe(correctEsperado);
      }
      if (detailsEsperados !== undefined) {
        expect(result.details).toHaveLength(detailsEsperados);
        const indices = result.details.map((d) => d.index);
        expect(new Set(indices).size).toBe(indices.length);
      }
      if (scoreEsperado !== undefined) {
        expect(result.score).toBe(scoreEsperado);
      }
    },
  );

  it('encuesta_viva y nube_palabras no se puntúan', () => {
    expect(evaluateActivityResponse('encuesta_viva', {}, 'sí').score).toBeNull();
    expect(evaluateActivityResponse('nube_palabras', {}, 'palabra').score).toBeNull();
    expect(evaluateActivityResponse('encuesta_viva', {}, 'sí').details).toEqual([]);
    expect(evaluateActivityResponse('nube_palabras', {}, 'palabra').correct).toBeNull();
  });

  it('completar_blancos respeta ignorarMayusculas === false', () => {
    const definicion = {
      blancos: [{ id: 'b1', respuesta: 'Bogotá', ignorarMayusculas: false }],
    };
    expect(
      evaluateActivityResponse('completar_blancos', definicion, { b1: 'bogotá' }).correct,
    ).toBe(false);
    expect(
      evaluateActivityResponse('completar_blancos', definicion, { b1: '  Bogotá  ' }).correct,
    ).toBe(true);
  });
});

interface ContractCase {
  case: string;
  activityType: string;
  definicion: unknown;
  respuesta: unknown;
}

const expectedKinds = (
  fixtures as { expectedKinds: Record<string, ActivityScoringKind> }
).expectedKinds;
const contractCases = (fixtures as { contractCases: ContractCase[] }).contractCases;
const unscoredKinds = new Set<ActivityScoringKind>(['exclude', 'manual', 'participation']);

describe('contrato único (Fase 6)', () => {
  it('expectedKinds cubre exactamente las claves de ACTIVITY_SCORING', () => {
    expect(Object.keys(expectedKinds).sort()).toEqual(Object.keys(ACTIVITY_SCORING).sort());
  });

  it.each(Object.entries(expectedKinds))('%s → %s', (tipo, kind) => {
    expect(getActivityScoringKind(tipo)).toBe(kind);
  });

  it('hay un contractCase por cada activityType requerido', () => {
    const covered = new Set(contractCases.map((c) => c.activityType));
    for (const tipo of fixtures.requiredActivityTypes) {
      expect(covered.has(tipo), `falta contractCase para ${tipo}`).toBe(true);
    }
  });

  it.each(contractCases)('$case', ({ activityType, definicion, respuesta }) => {
    const kind = ACTIVITY_SCORING[activityType];
    expect(kind, `ACTIVITY_SCORING no define ${activityType}`).toBeDefined();
    const result = evaluateActivityResponse(activityType, definicion, respuesta);
    if (unscoredKinds.has(kind)) {
      expect(result.score).toBeNull();
      return;
    }
    expect(result.score).toBe(5.0);
    expect(result.score).toBe(notaColombiana(1, 1, true));
    expect(result.correct).toBe(true);
  });
});

describe('xpFromEvaluation (Fase 6)', () => {
  it('score 5.0 → 100 XP; score 1.0 → 0 XP; score 3.0 → 50 XP', () => {
    expect(xpFromEvaluation({ score: 5, correct: true, details: [] })).toBe(100);
    expect(xpFromEvaluation({ score: 1, correct: false, details: [] })).toBe(0);
    expect(xpFromEvaluation({ score: 3, correct: false, details: [] })).toBe(50);
  });

  it('score null (exclude / manual / participation) → 0 XP', () => {
    expect(xpFromEvaluation({ score: null, correct: null, details: [] })).toBe(0);
  });

  it('XP se deriva del score de evaluateActivityResponse, no de un recálculo crudo', () => {
    const result = evaluateActivityResponse(
      'completar_blancos',
      { blancos: [{ id: 'b1', respuesta: 'x' }, { id: 'b2', respuesta: 'y' }] },
      { b1: 'x', b2: 'no' },
    );
    expect(result.score).toBe(2.5);
    expect(xpFromEvaluation(result)).toBe(38);
  });
});
