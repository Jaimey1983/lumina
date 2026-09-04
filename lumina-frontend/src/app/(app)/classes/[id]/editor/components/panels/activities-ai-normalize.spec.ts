import { describe, expect, it } from 'vitest';

import {
  activityTitleFromContent,
  aiActivityHasUsableContent,
  normalizeAiActivity,
} from './activities-ai-normalize';

describe('normalizeAiActivity', () => {
  it('convierte FillInTheBlanks con ____ al formato completar_blancos', () => {
    const activity = normalizeAiActivity('completar_blancos', {
      question: 'La capital de Francia es ____.',
      options: ['París'],
    });
    expect(activity.tipo).toBe('completar_blancos');
    expect(activity.texto).toBe('La capital de Francia es {{blank:b1}}.');
    expect(activity.blancos).toEqual([
      { id: 'b1', respuesta: 'París', ignorarMayusculas: true },
    ]);
  });

  it('mapea TrueFalse desde questions[] del endpoint legado', () => {
    const activity = normalizeAiActivity('verdadero_falso', {
      questions: [
        {
          question: 'El agua hierve a 100 °C.',
          options: ['Verdadero', 'Falso'],
          correctIndex: 0,
          explanation: 'A presión normal.',
        },
      ],
    });
    expect(activity).toMatchObject({
      tipo: 'verdadero_falso',
      afirmacion: 'El agua hierve a 100 °C.',
      respuestaCorrecta: true,
    });
  });

  it('arma quiz_multiple desde questions[] si no hay preguntas', () => {
    const activity = normalizeAiActivity('quiz_multiple', {
      questions: [
        {
          question: '¿2+2?',
          options: ['3', '4', '5', '6'],
          correctIndex: 1,
        },
      ],
    });
    expect(activity.tipo).toBe('quiz_multiple');
    const preguntas = activity.preguntas as { texto: string; opciones: { texto: string; esCorrecta: boolean }[] }[];
    expect(preguntas[0].texto).toBe('¿2+2?');
    expect(preguntas[0].opciones[1].esCorrecta).toBe(true);
  });

  it('completa ids faltantes en emparejar y arrastrar', () => {
    const match = normalizeAiActivity('emparejar', {
      pares: [{ izquierda: { texto: 'Gato' }, derecha: { texto: 'Felino' } }],
    });
    expect((match.pares as { id: string }[])[0].id).toBe('par-1');

    const drag = normalizeAiActivity('arrastrar_soltar', {
      items: [{ texto: 'Manzana' }],
      zonas: [{ etiqueta: 'Frutas', itemsCorrectos: ['i1'] }],
    });
    expect((drag.items as { id: string }[])[0].id).toBe('i1');
    expect((drag.zonas as { itemsCorrectos: string[] }[])[0].itemsCorrectos).toEqual(['i1']);
  });
});

describe('aiActivityHasUsableContent', () => {
  it('rechaza un quiz sin texto en las preguntas', () => {
    expect(
      aiActivityHasUsableContent({
        tipo: 'quiz_multiple',
        preguntas: [{ id: 'q-0', texto: '', opciones: [] }],
      }),
    ).toBe(false);
  });
});

describe('activityTitleFromContent', () => {
  it('usa afirmacion, question o instruccion según el tipo', () => {
    expect(activityTitleFromContent({ afirmacion: 'El sol es una estrella' })).toBe(
      'El sol es una estrella',
    );
    expect(activityTitleFromContent({ question: '¿Qué es un átomo?' })).toBe(
      '¿Qué es un átomo?',
    );
    expect(activityTitleFromContent({ instruccion: 'Ordena los pasos' })).toBe(
      'Ordena los pasos',
    );
  });
});
