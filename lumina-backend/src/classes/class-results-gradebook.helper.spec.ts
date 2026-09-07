import {
  activityTipoFromSlideContent,
  esEvaluable,
  scoreActivityResponse,
  sumAndDenominatorForClassGradebook,
} from './class-results-gradebook.helper';
import { promedioFromFixtureSlides } from '@lumina/scoring';
import fixturesJson from '@lumina/scoring/fixtures';

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

const fixtures = fixturesJson as unknown as { promedioCases: PromedioCase[] };

describe('sumAndDenominatorForClassGradebook', () => {
  it('quiz 5.0 + torneo sin nota → promedio 5.0 (no 2.5)', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'torneo', activityType: 'torneo' },
    ];
    const results = new Map([
      ['quiz', { activityType: 'quiz_multiple', score: 5, maxScore: 5 }],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(1);
    expect(sum / denominator).toBe(5);
  });

  it('ausencia en slide evaluable = ignore, no 0', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'vf', activityType: 'verdadero_falso' },
    ];
    const results = new Map([
      ['vf', { activityType: 'verdadero_falso', score: 5, maxScore: 5 }],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(1);
    expect(sum / denominator).toBe(5);
  });

  it('encuesta y nube no entran al denominador', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'enc', activityType: 'encuesta_viva' },
      { slideId: 'nube', activityType: 'nube_palabras' },
    ];
    const results = new Map([
      ['quiz', { activityType: 'quiz_multiple', score: 5, maxScore: 5 }],
      ['enc', { activityType: 'encuesta_viva', score: 1, maxScore: 5 }],
      ['nube', { activityType: 'nube_palabras', score: 1, maxScore: 5 }],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(1);
    expect(sum / denominator).toBe(5);
  });

  it('Grupo 4 connected entra al denominador; ruleta no', () => {
    const slides = [
      { slideId: 'clasificar', activityType: 'clasificar' },
      { slideId: 'ruleta', activityType: 'ruleta' },
    ];
    const results = new Map([
      ['clasificar', { activityType: 'clasificar', score: 5, maxScore: 5 }],
      ['ruleta', { activityType: 'ruleta', score: 1, maxScore: 5 }],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(1);
    expect(sum / denominator).toBe(5);
  });

  it('sopa_letras con nota real entra al promedio', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'sopa', activityType: 'sopa_letras' },
    ];
    const results = new Map([
      ['quiz', { activityType: 'quiz_multiple', score: 5, maxScore: 5 }],
      ['sopa', { activityType: 'sopa_letras', score: 4, maxScore: 5 }],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(2);
    expect(sum / denominator).toBe(4.5);
  });

  it('short_answer sin nota se ignora', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'sa', activityType: 'short_answer' },
    ];
    const results = new Map([
      ['quiz', { activityType: 'quiz_multiple', score: 5, maxScore: 5 }],
      ['sa', { activityType: 'short_answer', score: null, maxScore: 5 }],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(1);
    expect(sum / denominator).toBe(5);
  });

  it('short_answer con 1.0 de participación (isManual false) no entra al promedio', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'sa', activityType: 'short_answer' },
    ];
    const results = new Map([
      [
        'quiz',
        {
          activityType: 'quiz_multiple',
          score: 5,
          maxScore: 5,
          isManual: false,
        },
      ],
      [
        'sa',
        {
          activityType: 'short_answer',
          score: 1,
          maxScore: 5,
          isManual: false,
        },
      ],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(1);
    expect(sum / denominator).toBe(5);
  });

  it('short_answer calificado por el docente (isManual true) sí entra', () => {
    const slides = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'sa', activityType: 'short_answer' },
    ];
    const results = new Map([
      ['quiz', { activityType: 'quiz_multiple', score: 5, maxScore: 5 }],
      [
        'sa',
        { activityType: 'short_answer', score: 3, maxScore: 5, isManual: true },
      ],
    ]);
    const { sum, denominator } = sumAndDenominatorForClassGradebook(
      slides,
      results,
    );
    expect(denominator).toBe(2);
    expect(sum / denominator).toBe(4);
  });
});

describe('esEvaluable / columnas', () => {
  it('exclude y participation no son evaluables', () => {
    expect(esEvaluable('torneo')).toBe(false);
    expect(esEvaluable('ruleta')).toBe(false);
    expect(esEvaluable('escape_room')).toBe(false);
    expect(esEvaluable('encuesta_viva')).toBe(false);
    expect(esEvaluable('nube_palabras')).toBe(false);
    expect(esEvaluable('quiz_multiple')).toBe(true);
    expect(esEvaluable('sopa_letras')).toBe(true);
    expect(esEvaluable('short_answer')).toBe(true);
  });
});

describe('activityTipoFromSlideContent', () => {
  it('lee actividad.tipo del bloque', () => {
    expect(
      activityTipoFromSlideContent({
        bloques: [{ tipo: 'actividad', actividad: { tipo: 'quiz_multiple' } }],
      }),
    ).toBe('quiz_multiple');
  });

  it('lee actividad anidada en columnas', () => {
    expect(
      activityTipoFromSlideContent({
        bloques: [
          {
            tipo: 'columnas',
            columnas: [
              [{ tipo: 'texto', contenido: 'hola' }],
              [{ tipo: 'actividad', actividad: { tipo: 'completar_blancos' } }],
            ],
          },
        ],
      }),
    ).toBe('completar_blancos');
  });
});

describe('fixture promedio', () => {
  it.each(fixtures.promedioCases.map((c) => [c.case, c]))(
    '%s',
    (_name, c: PromedioCase) => {
      expect(promedioFromFixtureSlides(c.slides)).toBe(c.promedioEsperado);
    },
  );
});

describe('scoreActivityResponse (Fase 2 — delega en evaluateActivityResponse)', () => {
  it('short_answer nunca fabrica nota', () => {
    expect(
      scoreActivityResponse('short_answer', 'cualquier texto', {}),
    ).toBeNull();
  });

  it('blancos trim + mayúsculas → 5.0', () => {
    expect(
      scoreActivityResponse(
        'completar_blancos',
        { b1: '  bogotá  ' },
        {
          blancos: [{ id: 'b1', respuesta: 'Bogotá', ignorarMayusculas: true }],
        },
      ),
    ).toBe(5);
  });

  it('video deduplica por questionIndex', () => {
    const definicion = {
      preguntas: [
        {
          id: 'q0',
          opciones: [
            { id: 'a', esCorrecta: true },
            { id: 'b', esCorrecta: false },
          ],
        },
        {
          id: 'q1',
          opciones: [
            { id: 'a', esCorrecta: false },
            { id: 'b', esCorrecta: true },
          ],
        },
        { id: 'q2', opciones: [{ id: 'a', esCorrecta: true }] },
        { id: 'q3', opciones: [{ id: 'a', esCorrecta: true }] },
      ],
    };
    const respuesta = [
      { questionIndex: 0, answer: 'a' },
      { questionIndex: 1, answer: 'b' },
      { questionIndex: 0, answer: 'a' },
    ];
    expect(
      scoreActivityResponse('video_interactivo', respuesta, definicion),
    ).toBe(2.5);
  });
});
