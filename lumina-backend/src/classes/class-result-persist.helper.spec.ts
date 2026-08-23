import { readFileSync } from 'fs';
import { join } from 'path';

import { evaluateActivityResponse } from './activity-scoring';
import {
  CLASS_RESULT_MAX_SCORE_DEFAULT,
  resolvePersistedClassResultScore,
  resolvePersistedMaxScore,
  toPersistedResponseJson,
} from './class-result-persist.helper';

interface EvaluationCase {
  case: string;
  activityType: string;
  definicion: unknown;
  respuesta: unknown;
  correctEsperado?: boolean;
  detailsEsperados?: number;
  scoreEsperado?: number | null;
}

const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'class-results-gradebook.fixtures.json'), 'utf8'),
) as { evaluationCases: EvaluationCase[] };

describe('resolvePersistedMaxScore', () => {
  it('default 5 (no 1)', () => {
    expect(resolvePersistedMaxScore({ activityType: 'quiz_multiple' })).toBe(
      CLASS_RESULT_MAX_SCORE_DEFAULT,
    );
    expect(CLASS_RESULT_MAX_SCORE_DEFAULT).toBe(5);
  });
});

describe('resolvePersistedClassResultScore', () => {
  it('respeta score explícito del helper (incl. 1.0 pedagógico)', () => {
    expect(
      resolvePersistedClassResultScore({
        activityType: 'quiz_multiple',
        score: 1,
        correct: false,
      }),
    ).toBe(1);
    expect(
      resolvePersistedClassResultScore({
        activityType: 'completar_blancos',
        score: 3,
        correct: false,
      }),
    ).toBe(3);
  });

  it('correct false sin score → 1.0, nunca 0', () => {
    expect(
      resolvePersistedClassResultScore({
        activityType: 'quiz_multiple',
        correct: false,
      }),
    ).toBe(1);
  });

  it('short_answer / encuesta / torneo → null si no hay nota numérica', () => {
    expect(
      resolvePersistedClassResultScore({
        activityType: 'short_answer',
        score: null,
        correct: null,
      }),
    ).toBeNull();
    expect(
      resolvePersistedClassResultScore({
        activityType: 'encuesta_viva',
        correct: null,
      }),
    ).toBeNull();
    expect(
      resolvePersistedClassResultScore({
        activityType: 'nube_palabras',
        score: null,
      }),
    ).toBeNull();
    expect(
      resolvePersistedClassResultScore({ activityType: 'torneo' }),
    ).toBeNull();
  });

  it('no fabrica 0 cuando no hay score ni correct', () => {
    expect(
      resolvePersistedClassResultScore({ activityType: 'quiz_multiple' }),
    ).toBeNull();
  });
});

describe('toPersistedResponseJson', () => {
  it('guarda response tal cual, sin envolver ni transformar', () => {
    const raw = { b1: '  bogotá  ' };
    expect(toPersistedResponseJson({ activityType: 'completar_blancos', response: raw })).toBe(
      raw,
    );
    const video = [
      { questionIndex: 0, answer: 'a' },
      { questionIndex: 1, answer: 'b' },
    ];
    expect(
      toPersistedResponseJson({ activityType: 'video_interactivo', response: video }),
    ).toBe(video);
  });
});

describe('reconstrucción Fase 3 (response + definición → mismo score)', () => {
  it.each(
    fixtures.evaluationCases
      .filter((c) =>
        ['fase2_blancos_trim_y_mayusculas', 'fase2_video_sin_duplicados'].includes(
          c.case,
        ),
      )
      .map((c) => [c.case, c]),
  )('%s', (_name, c: EvaluationCase) => {
    const evaluated = evaluateActivityResponse(
      c.activityType,
      c.definicion,
      c.respuesta,
    );
    const persisted = toPersistedResponseJson({
      activityType: c.activityType,
      score: evaluated.score,
      correct: evaluated.correct,
      response: c.respuesta,
    });
    const storedScore = resolvePersistedClassResultScore({
      activityType: c.activityType,
      score: evaluated.score,
      correct: evaluated.correct,
    });
    const rebuilt = evaluateActivityResponse(
      c.activityType,
      c.definicion,
      persisted,
    );
    expect(storedScore).toBe(evaluated.score);
    expect(rebuilt.score).toBe(storedScore);
  });
});
