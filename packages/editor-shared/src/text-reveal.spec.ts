import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { textBlockRevealPlan, revealUnitCss } from './text-reveal.js';

const base: TextBlock = { tipo: 'texto', contenido: 'x' };

describe('textBlockRevealPlan', () => {
  it('sin revelado → null', () => {
    expect(textBlockRevealPlan(base)).toBeNull();
  });
  it('palabra: stagger 60 por defecto', () => {
    const p = textBlockRevealPlan({ ...base, revelado: { por: 'palabra', efecto: 'subir' } })!;
    expect(p).toMatchObject({ unit: 'palabra', animName: 'lumina-reveal-subir', stagger: 60 });
  });
  it('linea: stagger 140 por defecto, retraso lo pisa', () => {
    expect(
      textBlockRevealPlan({ ...base, revelado: { por: 'linea', efecto: 'aparecer' } })!.stagger,
    ).toBe(140);
    expect(
      textBlockRevealPlan({ ...base, revelado: { por: 'linea', efecto: 'aparecer', retraso: 200 } })!
        .stagger,
    ).toBe(200);
  });
});

describe('revealUnitCss', () => {
  it('palabra → inline-block, delay escalonado', () => {
    const p = textBlockRevealPlan({ ...base, revelado: { por: 'palabra', efecto: 'zoom' } })!;
    expect(revealUnitCss(p, 3)).toMatchObject({
      display: 'inline-block',
      animationName: 'lumina-reveal-zoom',
      animationDelay: '180ms',
    });
  });
  it('linea → block', () => {
    const p = textBlockRevealPlan({ ...base, revelado: { por: 'linea', efecto: 'aparecer' } })!;
    expect(revealUnitCss(p, 0).display).toBe('block');
  });
});
