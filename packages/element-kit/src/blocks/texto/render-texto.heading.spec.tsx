import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { RenderText } from './render-texto.js';

function styleOf(container: HTMLElement, tag: string): CSSStyleDeclaration {
  const el = container.querySelector(tag);
  if (!el) throw new Error(`no se encontró <${tag}>`);
  return (el as HTMLElement).style;
}

describe('RenderText — escala de encabezados (Fase 0.1)', () => {
  it('emite h1..h6 con el tamaño y peso de la escala cuando el bloque no los fija', () => {
    const esperado: Record<number, { size: string; weight: string }> = {
      1: { size: '40px', weight: '700' },
      2: { size: '32px', weight: '700' },
      3: { size: '26px', weight: '600' },
      4: { size: '22px', weight: '600' },
      5: { size: '18px', weight: '600' },
      6: { size: '16px', weight: '600' },
    };
    for (const n of [1, 2, 3, 4, 5, 6] as const) {
      const block: TextBlock = { tipo: 'texto', contenido: `H${n}`, nivel: n };
      const { container } = render(<RenderText block={block} modo="viewer" />);
      const s = styleOf(container, `h${n}`);
      expect(s.fontSize).toBe(esperado[n]!.size);
      expect(String(s.fontWeight)).toBe(esperado[n]!.weight);
    }
  });

  it('el tamaño explícito del bloque gana sobre la escala', () => {
    const block: TextBlock = {
      tipo: 'texto',
      contenido: 'H1 chico',
      nivel: 1,
      tamanoFuente: '12px',
    };
    const { container } = render(<RenderText block={block} modo="viewer" />);
    expect(styleOf(container, 'h1').fontSize).toBe('12px');
    expect(String(styleOf(container, 'h1').fontWeight)).toBe('700');
  });

  it('negrita:false desactiva el peso de la escala', () => {
    const block: TextBlock = {
      tipo: 'texto',
      contenido: 'H2 sin negrita',
      nivel: 2,
      negrita: false,
    };
    const { container } = render(<RenderText block={block} modo="viewer" />);
    const s = styleOf(container, 'h2');
    expect(s.fontSize).toBe('32px');
    expect(s.fontWeight).toBe('');
  });

  it('sin nivel el <p> no gana estilo de la escala', () => {
    const block: TextBlock = { tipo: 'texto', contenido: 'cuerpo' };
    const { container } = render(<RenderText block={block} modo="viewer" />);
    const s = styleOf(container, 'p');
    expect(s.fontSize).toBe('');
    expect(s.fontWeight).toBe('');
    expect(s.letterSpacing).toBe('');
  });
});
