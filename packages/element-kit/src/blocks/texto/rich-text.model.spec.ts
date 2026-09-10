import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import { applyHeadingLevelToRichDoc } from '@lumina/editor-shared/rich-text';
import { getRichDoc, syncTextBlockFromRichDoc } from './rich-text.js';

/**
 * Fase 1 — modelo único: la tipografía de bloque (`tamanoFuente`, `color`,
 * `fuente`, `negrita`, …) vive en el NODO raíz del `RichDoc`. `TextBlock.*` se
 * deriva de ahí; `getRichDoc` la traslada al nodo cuando no hay `contenidoRich`.
 */
describe('getRichDoc — traslada la tipografía de bloque al nodo raíz', () => {
  it('bloque plano con estilo → nodo raíz con fontSize/color/fontFamily/bold', () => {
    const block: TextBlock = {
      tipo: 'texto',
      contenido: 'Hola',
      nivel: 1,
      tamanoFuente: '40px',
      color: '#123456',
      fuente: 'Poppins',
      negrita: true,
      interlineado: 1.2,
      espaciadoLetras: -0.5,
    };
    const doc = getRichDoc(block);
    expect(doc.nodes).toHaveLength(1);
    const n = doc.nodes[0]!;
    expect(n.type).toBe('heading');
    expect(n.level).toBe(1);
    expect(n.fontSize).toBe(40);
    expect(n.color).toBe('#123456');
    expect(n.fontFamily).toBe('Poppins');
    expect(n.bold).toBe(true);
    expect(n.lineHeight).toBe(1.2);
    expect(n.letterSpacing).toBe(-0.5);
  });

  it('rem se convierte a px', () => {
    const doc = getRichDoc({ tipo: 'texto', contenido: 'x', tamanoFuente: '1.5rem' });
    expect(doc.nodes[0]!.fontSize).toBe(24);
  });

  it('negrita:false se conserva como bold:false en el nodo', () => {
    const doc = getRichDoc({ tipo: 'texto', contenido: 'x', nivel: 2, negrita: false });
    expect(doc.nodes[0]!.bold).toBe(false);
  });

  it('con contenidoRich presente, el color del nodo gana sobre el del bloque', () => {
    const rich: RichDoc = {
      version: 1,
      nodes: [{ type: 'paragraph', color: '#abcdef', runs: [{ text: 'y' }] }],
    };
    const doc = getRichDoc({
      tipo: 'texto',
      contenido: 'y',
      contenidoRich: rich,
      color: '#000000',
    });
    expect(doc.nodes[0]!.color).toBe('#abcdef');
  });

  it('contenidoRich sin color + block.color → hidrata el color ausente', () => {
    const rich: RichDoc = {
      version: 1,
      nodes: [{ type: 'paragraph', runs: [{ text: 'y' }] }],
    };
    const doc = getRichDoc({
      tipo: 'texto',
      contenido: 'y',
      contenidoRich: rich,
      color: '#112233',
      tamanoFuente: '18px',
      alineacion: 'centro',
    });
    expect(doc.nodes[0]!.color).toBe('#112233');
    expect(doc.nodes[0]!.fontSize).toBe(18);
    expect(doc.nodes[0]!.align).toBe('centro');
  });
});

describe('syncTextBlockFromRichDoc — deriva TextBlock.* del nodo raíz', () => {
  const mk = (nodes: RichDoc['nodes']): RichDoc => ({ version: 1, nodes });

  it('nodo con tipografía → block.tamanoFuente/color/fuente/negrita', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '' },
      mk([
        {
          type: 'heading',
          level: 1,
          fontSize: 40,
          color: '#111827',
          fontFamily: 'Inter',
          bold: true,
          runs: [{ text: 'T' }],
        },
      ]),
    );
    expect(out.tamanoFuente).toBe('40px');
    expect(out.color).toBe('#111827');
    expect(out.fuente).toBe('Inter');
    expect(out.negrita).toBe(true);
    expect(out.nivel).toBe(1);
  });

  it('nodo sin fontSize → block.tamanoFuente se conserva (legado)', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '', tamanoFuente: '14px' },
      mk([{ type: 'heading', level: 1, runs: [{ text: 'T' }] }]),
    );
    expect(out.tamanoFuente).toBe('14px');
  });

  it('multi-nodo con tipografía coincidente → se comparte al bloque', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '' },
      mk([
        { type: 'paragraph', color: '#0a0a0a', runs: [{ text: 'a' }] },
        { type: 'paragraph', color: '#0a0a0a', runs: [{ text: 'b' }] },
      ]),
    );
    expect(out.color).toBe('#0a0a0a');
  });

  it('multi-nodo con tipografía divergente → NO toca el bloque (estado mixto)', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '', color: '#previo' },
      mk([
        { type: 'paragraph', color: '#111', runs: [{ text: 'a' }] },
        { type: 'paragraph', color: '#222', runs: [{ text: 'b' }] },
      ]),
    );
    expect(out.color).toBe('#previo');
  });

  it('vaciar un heading (sin runs) NO degrada el nivel', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: 'Título', nivel: 2 },
      mk([{ type: 'heading', level: 2 }]),
    );
    expect(out.nivel).toBe(2);
  });

  it('alineación compartida por todos los nodos → block.alineacion', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '' },
      mk([
        { type: 'heading', level: 2, align: 'centro', runs: [{ text: 'a' }] },
        { type: 'paragraph', align: 'centro', runs: [{ text: 'b' }] },
      ]),
    );
    expect(out.alineacion).toBe('centro');
  });

  it('ningún nodo con align → block.alineacion se conserva (legado)', () => {
    const out = syncTextBlockFromRichDoc(
      { tipo: 'texto', contenido: '', alineacion: 'derecha' },
      mk([{ type: 'paragraph', runs: [{ text: 'a' }] }]),
    );
    expect(out.alineacion).toBe('derecha');
  });

  it('round-trip: getRichDoc → syncTextBlockFromRichDoc devuelve el mismo estilo', () => {
    const block: TextBlock = {
      tipo: 'texto',
      contenido: 'Hola',
      nivel: 3,
      tamanoFuente: '26px',
      color: '#334155',
      fuente: 'Lora',
      negrita: true,
      alineacion: 'centro',
    };
    const back = syncTextBlockFromRichDoc(block, getRichDoc(block));
    expect(back.tamanoFuente).toBe('26px');
    expect(back.color).toBe('#334155');
    expect(back.fuente).toBe('Lora');
    expect(back.negrita).toBe(true);
    expect(back.nivel).toBe(3);
    expect(back.alineacion).toBe('centro');
  });

  it('cuerpo 18px → H1 escribe 40px/bold en el nodo y el bloque', () => {
    const block: TextBlock = { tipo: 'texto', contenido: 'Título', tamanoFuente: '18px' };
    const doc = applyHeadingLevelToRichDoc(getRichDoc(block), 1, true);
    const back = syncTextBlockFromRichDoc(block, doc);
    expect(doc.nodes[0]!.type).toBe('heading');
    expect(doc.nodes[0]!.fontSize).toBe(40);
    expect(back.tamanoFuente).toBe('40px');
    expect(back.negrita).toBe(true);
    expect(back.nivel).toBe(1);
  });
});
