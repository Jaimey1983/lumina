import { describe, expect, it } from 'vitest';

import { normalizarQuizMultiple } from './class-slide-normalize';

describe('normalizarQuizMultiple', () => {
  it('migra legacy pregunta/opciones a preguntas[0]', () => {
    const out = normalizarQuizMultiple({
      tipo: 'quiz_multiple',
      pregunta: '¿Capital?',
      opciones: [{ id: 'a', texto: 'Bogotá', esCorrecta: true }],
      shuffleOptions: true,
    });
    expect(out.preguntas).toHaveLength(1);
    expect(out.preguntas[0]?.texto).toBe('¿Capital?');
    expect(out.preguntas[0]?.opciones).toHaveLength(1);
    expect(out.preguntas[0]?.id).toBe('q-legacy-0');
    expect(out.deliveryMode).toBe('AUTONOMOUS');
    expect(out.layoutVariant).toBe('classic-list');
    expect(out.shuffleOptions).toBe(true);
  });

  it('es idempotente si ya trae preguntas[]', () => {
    const input = {
      tipo: 'quiz_multiple' as const,
      preguntas: [{ id: 'q-1', texto: 'Uno', opciones: [] }],
      deliveryMode: 'SYNCED' as const,
      layoutVariant: 'color-grid' as const,
    };
    const out = normalizarQuizMultiple(input);
    expect(out).toMatchObject(input);
  });
});
