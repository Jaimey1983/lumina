import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import { plainToRich } from '@lumina/editor-shared/rich-text';
import { RenderText } from './render-texto.js';
import { getRichDoc } from './rich-text.js';

const html = (b: TextBlock) => render(<RenderText block={b} modo="viewer" />).container.innerHTML;

describe('RenderText — RichDoc (Fase 1)', () => {
  it('paridad: contenido plano vs contenidoRich equivalente → mismo DOM', () => {
    const casos: Partial<TextBlock>[] = [
      { contenido: 'Hola mundo' },
      { contenido: 'línea 1\nlínea 2\n\nlínea 4' },
      { contenido: 'Encabezado', nivel: 2 },
      { contenido: 'uno\ndos\ntres', lista: 'vinetas' },
      { contenido: 'a\nb', lista: 'numeros' },
      { contenido: 'centrado', alineacion: 'centro' },
      { contenido: '', nivel: 1 },
    ];
    for (const patch of casos) {
      const plano: TextBlock = { tipo: 'texto', contenido: '', ...patch };
      const rich: TextBlock = { ...plano, contenidoRich: getRichDoc(plano) };
      expect(html(rich)).toBe(html(plano));
    }
  });

  it('marcas por rango se pintan como <span> con estilo, el resto del párrafo intacto', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          runs: [
            { text: 'Hola ' },
            { text: 'mundo', marks: [{ t: 'bold' }, { t: 'color', value: '#e11d48' }] },
            { text: '!' },
          ],
        },
      ],
    };
    const out = html({ tipo: 'texto', contenido: 'Hola mundo!', contenidoRich: doc });
    expect(out).toContain('font-weight: bold');
    expect(out).toContain('color: rgb(225, 29, 72)');
    expect(out).toContain('Hola ');
    expect(out).toContain('!');
  });

  it('enlace seguro → <a target rel>; inseguro → sin <a>', () => {
    const mk = (href: string): TextBlock => ({
      tipo: 'texto',
      contenido: 'x',
      contenidoRich: {
        version: 1,
        nodes: [{ type: 'paragraph', runs: [{ text: 'x', marks: [{ t: 'link', href }] }] }],
      },
    });
    expect(html(mk('https://ok.dev'))).toContain('rel="noopener noreferrer"');
    expect(html(mk('javascript:alert(1)'))).not.toContain('<a ');
  });

  it('un RichDoc multi-nodo se envuelve en <div>', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'p1' }] },
        { type: 'paragraph', runs: [{ text: 'p2' }] },
      ],
    };
    const out = html({ tipo: 'texto', contenido: 'p1\np2', contenidoRich: doc });
    expect(out.startsWith('<div')).toBe(true);
    expect((out.match(/<p/g) ?? []).length).toBe(2);
  });

  it('getRichDoc sanea contenidoRich malicioso', () => {
    const dirty = {
      version: 1,
      nodes: [
        { type: 'evil', runs: [{ text: 'x' }] },
        { type: 'paragraph', runs: [{ text: 'ok', marks: [{ t: 'blink' }] }] },
      ],
    } as unknown as RichDoc;
    const clean = getRichDoc({ tipo: 'texto', contenido: 'ok', contenidoRich: dirty });
    expect(clean.nodes).toHaveLength(1);
    expect(clean.nodes[0]!.runs).toEqual([{ text: 'ok' }]);
  });

  it('con el flag apagado ignora contenidoRich', () => {
    const prev = process.env.NEXT_PUBLIC_RICH_TEXT;
    process.env.NEXT_PUBLIC_RICH_TEXT = 'off';
    try {
      const doc = plainToRich('otro');
      const out = getRichDoc({ tipo: 'texto', contenido: 'plano', contenidoRich: doc });
      expect(out.nodes[0]!.runs?.[0]?.text).toBe('plano');
    } finally {
      process.env.NEXT_PUBLIC_RICH_TEXT = prev;
    }
  });
});
