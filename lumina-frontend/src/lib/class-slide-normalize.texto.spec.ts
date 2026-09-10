import { describe, expect, it } from 'vitest';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { TextBlock } from '@lumina/types/slide';
import { classSlideToRendererSlide } from './class-slide-normalize';

function apiSlide(bloques: unknown[]): ApiSlide {
  return { id: 's', order: 0, type: 'CONTENT', title: 'T', content: { bloques } };
}

function firstBlock(bloques: unknown[]): TextBlock {
  return classSlideToRendererSlide(apiSlide(bloques)).bloques![0] as TextBlock;
}

describe('normalizeTextBlock (Fase 1)', () => {
  it('sin contenidoRich el bloque no cambia', () => {
    const b: TextBlock = { tipo: 'texto', contenido: 'hola', x: 1, y: 2 };
    expect(firstBlock([b])).toEqual(b);
  });

  it('con contenidoRich válido: sanea y recomputa contenido', () => {
    const b: TextBlock = {
      tipo: 'texto',
      contenido: 'desactualizado',
      contenidoRich: {
        version: 1,
        nodes: [
          {
            type: 'paragraph',
            runs: [
              { text: 'Hola ', marks: [{ t: 'bold' }] },
              { text: 'mundo', marks: [{ t: 'bold' }] },
            ],
          },
        ],
      },
    };
    const out = firstBlock([b]);
    expect(out.contenido).toBe('Hola mundo');
    expect(out.contenidoRich!.nodes[0]!.runs).toEqual([
      { text: 'Hola mundo', marks: [{ t: 'bold' }] },
    ]);
  });

  it('contenidoRich inválido se descarta y queda texto plano', () => {
    const b = {
      tipo: 'texto',
      contenido: 'plano',
      contenidoRich: { nope: true },
    } as unknown as TextBlock;
    const out = firstBlock([b]);
    expect(out.contenidoRich).toBeUndefined();
    expect(out.contenido).toBe('plano');
  });

  it('contenidoRich sin color + block.color se hidrata, no se borra', () => {
    const b: TextBlock = {
      tipo: 'texto',
      contenido: 'x',
      color: '#112233',
      tamanoFuente: '18px',
      alineacion: 'centro',
      contenidoRich: {
        version: 1,
        nodes: [{ type: 'paragraph', runs: [{ text: 'x' }] }],
      },
    };
    const out = firstBlock([b]);
    expect(out.color).toBe('#112233');
    expect(out.tamanoFuente).toBe('18px');
    expect(out.alineacion).toBe('centro');
    expect(out.contenidoRich!.nodes[0]!.color).toBe('#112233');
    expect(out.contenidoRich!.nodes[0]!.fontSize).toBe(18);
    expect(out.contenidoRich!.nodes[0]!.align).toBe('centro');
  });

  it('marca link con href peligroso se limpia al hidratar', () => {
    const b: TextBlock = {
      tipo: 'texto',
      contenido: 'x',
      contenidoRich: {
        version: 1,
        nodes: [
          {
            type: 'paragraph',
            runs: [{ text: 'x', marks: [{ t: 'link', href: 'javascript:alert(1)' }] }],
          },
        ],
      },
    };
    const out = firstBlock([b]);
    expect(JSON.stringify(out.contenidoRich)).not.toContain('javascript:');
  });
});
