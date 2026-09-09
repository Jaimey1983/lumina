import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import { RenderText } from './render-texto.js';
import { syncTextBlockFromRichDoc } from './rich-text.js';

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

  // Regresión: tras editar en el `<RichTextEditor>` el nivel vive en el nodo del
  // `contenidoRich`, no en `block.nivel` → la escala debe derivarse del NODO.
  it('un heading en contenidoRich (sin block.nivel) aplica la escala', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'heading', level: 1, runs: [{ text: 'Título editado' }] }],
    };
    const block: TextBlock = { tipo: 'texto', contenido: 'Título editado', contenidoRich: doc };
    const { container } = render(<RenderText block={block} modo="viewer" />);
    const s = styleOf(container, 'h1');
    expect(s.fontSize).toBe('40px');
    expect(String(s.fontWeight)).toBe('700');
  });

  it('heading dentro de un doc multi-nodo también recibe la escala', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'heading', level: 2, runs: [{ text: 'Sección' }] },
        { type: 'paragraph', runs: [{ text: 'cuerpo' }] },
      ],
    };
    const block: TextBlock = { tipo: 'texto', contenido: 'Sección\ncuerpo', contenidoRich: doc };
    const { container } = render(<RenderText block={block} modo="viewer" />);
    expect(styleOf(container, 'h2').fontSize).toBe('32px');
    expect(styleOf(container, 'p').fontSize).toBe('');
  });

  it('override explícito de tamaño en el bloque gana sobre la escala del nodo', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'heading', level: 1, runs: [{ text: 'H1 chico' }] }],
    };
    const block: TextBlock = {
      tipo: 'texto',
      contenido: 'H1 chico',
      contenidoRich: doc,
      tamanoFuente: '14px',
    };
    const { container } = render(<RenderText block={block} modo="viewer" />);
    expect(styleOf(container, 'h1').fontSize).toBe('14px');
  });
});

describe('syncTextBlockFromRichDoc', () => {
  const mk = (nodes: RichDoc['nodes']): RichDoc => ({ version: 1, nodes });

  it('doc de un heading → block.nivel se fija', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '' },
      mk([{ type: 'heading', level: 3, runs: [{ text: 'x' }] }]),
    );
    expect(out.nivel).toBe(3);
    expect(out.contenido).toBe('x');
  });

  it('doc de un párrafo → block.nivel se limpia', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '', nivel: 2 },
      mk([{ type: 'paragraph', runs: [{ text: 'y' }] }]),
    );
    expect(out.nivel).toBeUndefined();
  });

  it('doc de lista → block.lista se sincroniza', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '' },
      mk([{ type: 'orderedList', children: [{ type: 'listItem', runs: [{ text: 'a' }] }] }]),
    );
    expect(out.lista).toBe('numeros');
  });

  it('doc multi-nodo → no toca las pistas del bloque', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '', nivel: 1 },
      mk([
        { type: 'heading', level: 2, runs: [{ text: 'a' }] },
        { type: 'paragraph', runs: [{ text: 'b' }] },
      ]),
    );
    expect(out.nivel).toBe(1); // se deja como estaba (ambiguo)
  });
});
