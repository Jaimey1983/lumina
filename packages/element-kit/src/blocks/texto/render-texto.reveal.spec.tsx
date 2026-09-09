import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { RenderText } from './render-texto.js';

const block = (extra: Partial<TextBlock>): TextBlock => ({
  tipo: 'texto',
  contenido: 'uno dos tres',
  ...extra,
});

describe('RenderText — revelado por palabra/línea (Fase 5A)', () => {
  it('por palabra: cada palabra en <span data-reveal-unit> con delay escalonado', () => {
    const { container } = render(
      <RenderText
        block={block({ revelado: { por: 'palabra', efecto: 'subir' } })}
        modo="viewer"
      />,
    );
    const units = [...container.querySelectorAll('[data-reveal-unit]')] as HTMLElement[];
    expect(units.map((u) => u.textContent)).toEqual(['uno', 'dos', 'tres']);
    expect(units.map((u) => u.style.animationDelay)).toEqual(['0ms', '60ms', '120ms']);
    expect(units[0]!.style.animationName).toBe('lumina-reveal-subir');
  });

  it('por línea con multi-nodo: una unidad por párrafo, delay por índice', () => {
    const doc: TextBlock['contenidoRich'] = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'línea A' }] },
        { type: 'paragraph', runs: [{ text: 'línea B' }] },
      ],
    };
    const { container } = render(
      <RenderText
        block={block({ contenidoRich: doc, revelado: { por: 'linea', efecto: 'aparecer', retraso: 200 } })}
        modo="viewer"
      />,
    );
    const units = [...container.querySelectorAll('[data-reveal-unit]')] as HTMLElement[];
    expect(units).toHaveLength(2);
    expect(units.map((u) => u.style.animationDelay)).toEqual(['0ms', '200ms']);
    expect(units[0]!.style.display).toBe('block');
  });

  it('en el editor no se anima', () => {
    const { container } = render(
      <RenderText block={block({ revelado: { por: 'palabra', efecto: 'zoom' } })} modo="editor" />,
    );
    expect(container.querySelector('[data-reveal-unit]')).toBeNull();
  });

  it('sin revelado: DOM idéntico', () => {
    const out = render(<RenderText block={block({ contenido: 'Hola' })} modo="viewer" />).container.innerHTML;
    expect(out).toBe(
      '<p style="margin: 0px; white-space: pre-wrap; word-break: break-word;">Hola</p>',
    );
  });
});
