import { describe, expect, it } from 'vitest';
import type { RichDoc } from '@lumina/types/rich-text';
import { applyHeadingLevelToRichDoc, applyTypographyPatchToRichDoc } from './rich-doc-style.js';
import { hydrateMissingNodeStyle } from './plain.js';

const mk = (nodes: RichDoc['nodes']): RichDoc => ({ version: 1, nodes });

describe('hydrateMissingNodeStyle', () => {
  it('rellena color/tamaño ausentes del nodo con las pistas del bloque', () => {
    const doc = hydrateMissingNodeStyle(
      mk([{ type: 'paragraph', runs: [{ text: 'a' }] }]),
      { color: '#112233', tamanoFuente: '18px', alineacion: 'centro' },
    );
    expect(doc.nodes[0]!.color).toBe('#112233');
    expect(doc.nodes[0]!.fontSize).toBe(18);
    expect(doc.nodes[0]!.align).toBe('centro');
  });

  it('el valor del nodo gana sobre la pista del bloque', () => {
    const doc = hydrateMissingNodeStyle(
      mk([{ type: 'paragraph', color: '#abcdef', runs: [{ text: 'a' }] }]),
      { color: '#000000' },
    );
    expect(doc.nodes[0]!.color).toBe('#abcdef');
  });
});

describe('applyTypographyPatchToRichDoc', () => {
  it('escribe alineación y color en el nodo, no solo en el bloque', () => {
    const doc = applyTypographyPatchToRichDoc(
      mk([{ type: 'paragraph', runs: [{ text: 'a' }] }]),
      { align: 'right', color: '#ff0000' },
    );
    expect(doc.nodes[0]!.align).toBe('derecha');
    expect(doc.nodes[0]!.color).toBe('#ff0000');
  });

  it('también alinea listas y callouts', () => {
    const doc = applyTypographyPatchToRichDoc(
      mk([
        { type: 'bulletList', children: [{ type: 'listItem', runs: [{ text: 'x' }] }] },
        { type: 'callout', variant: 'nota', runs: [{ text: 'y' }] },
      ]),
      { align: 'center' },
    );
    expect(doc.nodes[0]!.align).toBe('centro');
    expect(doc.nodes[1]!.align).toBe('centro');
  });
});

describe('applyHeadingLevelToRichDoc', () => {
  it('cuerpo → H1 escribe 40 / bold / tracking, no borra el estilo', () => {
    const doc = applyHeadingLevelToRichDoc(
      mk([{ type: 'paragraph', fontSize: 18, runs: [{ text: 'Título' }] }]),
      1,
      true,
    );
    const n = doc.nodes[0]!;
    expect(n.type).toBe('heading');
    expect(n.level).toBe(1);
    expect(n.fontSize).toBe(40);
    expect(n.bold).toBe(true);
    expect(n.lineHeight).toBe(1.1);
    expect(n.letterSpacing).toBe(-0.5);
  });

  it('sin writeScale solo cambia el tipo', () => {
    const doc = applyHeadingLevelToRichDoc(
      mk([{ type: 'paragraph', fontSize: 55, runs: [{ text: 'T' }] }]),
      2,
      false,
    );
    expect(doc.nodes[0]!.type).toBe('heading');
    expect(doc.nodes[0]!.level).toBe(2);
    expect(doc.nodes[0]!.fontSize).toBe(55);
  });
});
