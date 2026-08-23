import { describe, expect, it } from 'vitest';

import fixtures from '@/lib/activity-scoring.fixtures.json';
import { promedioFromFixtureSlides } from '@/lib/activity-scoring';

import {
  computeStudentPromedio,
  normalizeFromRows,
  type ApiGradebookRow,
} from './use-gradebook';

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

describe('computeStudentPromedio (recálculo tras PATCH)', () => {
  it('coincice con el fixture fase1_torneo_no_afecta_promedio', () => {
    const c = (fixtures.promedioCases as PromedioCase[]).find(
      (x) => x.case === 'fase1_torneo_no_afecta_promedio',
    );
    expect(c).toBeDefined();
    expect(promedioFromFixtureSlides(c!.slides)).toBe(5.0);

    const clasificar = (fixtures.promedioCases as PromedioCase[]).find(
      (x) => x.case === 'fase4_clasificar_perfecto_ruleta_no_cuenta',
    );
    expect(clasificar).toBeDefined();
    expect(promedioFromFixtureSlides(clasificar!.slides)).toBe(5.0);

    const actividades = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'torneo', activityType: 'torneo' },
    ];
    const notas = { quiz: 5.0 };
    expect(computeStudentPromedio(actividades, notas)).toBe(5.0);
  });

  it('tras calificar short_answer el promedio usa el mismo denominador que GET', () => {
    const actividades = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'sa', activityType: 'short_answer' },
    ];
    const before = { quiz: 5.0, sa: 1.0 };
    expect(computeStudentPromedio(actividades, before, {})).toBe(5.0);

    const afterPatch = { quiz: 5.0, sa: 3.0 };
    expect(
      computeStudentPromedio(actividades, afterPatch, { sa: true }),
    ).toBe(4.0);
  });
});

describe('normalizeFromRows', () => {
  it('no reintroduce exclude/participation como columnas', () => {
    const rows: ApiGradebookRow[] = [
      {
        studentId: 's1',
        nombre: 'Ana',
        promedio: 5,
        resultados: [
          {
            slideId: 'quiz',
            activityType: 'quiz_multiple',
            score: 5,
            maxScore: 5,
            isManual: false,
          },
          {
            slideId: 'torneo',
            activityType: 'torneo',
            score: 1,
            maxScore: 5,
            isManual: false,
          },
          {
            slideId: 'enc',
            activityType: 'encuesta_viva',
            score: 1,
            maxScore: 5,
            isManual: false,
          },
        ],
      },
    ];
    const data = normalizeFromRows(rows);
    expect(data.actividades.map((a) => a.activityType)).toEqual(['quiz_multiple']);
    expect(data.estudiantes[0].notas).toEqual({ quiz: 5 });
  });

  it('usa la lista canónica de columnas (slide evaluable sin respuestas)', () => {
    const canonical = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'blancos', activityType: 'completar_blancos' },
    ];
    const data = normalizeFromRows([], canonical);
    expect(data.actividades.map((a) => a.slideId)).toEqual(['quiz', 'blancos']);
  });

  it('columna de Grupo 4 muestra la nota real (ya no está diferida)', () => {
    const canonical = [
      { slideId: 'quiz', activityType: 'quiz_multiple' },
      { slideId: 'sopa', activityType: 'sopa_letras' },
      { slideId: 'ruleta', activityType: 'ruleta' },
    ];
    const rows: ApiGradebookRow[] = [
      {
        studentId: 's1',
        nombre: 'Ana',
        promedio: 5,
        resultados: [
          {
            slideId: 'quiz',
            activityType: 'quiz_multiple',
            score: 5,
            maxScore: 5,
            isManual: false,
          },
          {
            slideId: 'sopa',
            activityType: 'sopa_letras',
            score: 1,
            maxScore: 5,
            isManual: false,
          },
          {
            slideId: 'ruleta',
            activityType: 'ruleta',
            score: 1,
            maxScore: 5,
            isManual: false,
          },
        ],
      },
    ];
    const data = normalizeFromRows(rows, canonical);
    expect(data.actividades.map((a) => a.activityType)).toEqual([
      'quiz_multiple',
      'sopa_letras',
    ]);
    expect(data.estudiantes[0].notas).toEqual({ quiz: 5, sopa: 1 });
  });
});
