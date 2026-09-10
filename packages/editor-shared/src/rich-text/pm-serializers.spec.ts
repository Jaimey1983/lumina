import { describe, expect, it } from 'vitest';
import type { RichDoc } from '@lumina/types/rich-text';
import { richToPmDoc, pmDocToRich } from './pm-serializers.js';
import { sanitizeRichDoc } from './sanitize.js';
import { plainToRich } from './plain.js';

/** Round-trip: RichDoc → TipTap JSON → RichDoc == saneado. */
function roundTrip(doc: RichDoc) {
  return pmDocToRich(richToPmDoc(doc));
}

describe('richToPmDoc / pmDocToRich', () => {
  it('doc vacío → un párrafo', () => {
    expect(richToPmDoc({ version: 1, nodes: [] })).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
    expect(pmDocToRich({ type: 'doc', content: [] })).toEqual({
      version: 1,
      nodes: [{ type: 'paragraph' }],
    });
  });

  it('round-trip de un párrafo con marcas simples y de estilo', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          align: 'centro',
          runs: [
            { text: 'a ' },
            {
              text: 'b',
              marks: [
                { t: 'bold' },
                { t: 'italic' },
                { t: 'color', value: '#112233' },
                { t: 'size', px: 22 },
                { t: 'font', family: 'Lora' },
              ],
            },
            { text: ' c', marks: [{ t: 'strike' }] },
          ],
        },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('varios textStyle en un run se funden en un solo mark de TipTap', () => {
    const pm = richToPmDoc({
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          runs: [{ text: 'x', marks: [{ t: 'color', value: '#000' }, { t: 'size', px: 14 }] }],
        },
      ],
    });
    const marks = pm.content![0]!.content![0]!.marks!;
    const textStyle = marks.filter((m) => m.type === 'textStyle');
    expect(textStyle).toHaveLength(1);
    expect(textStyle[0]!.attrs).toEqual({ color: '#000', fontSize: '14px' });
  });

  it('round-trip de encabezado, cita, código y regla', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'heading', level: 3, runs: [{ text: 'Título' }] },
        { type: 'blockquote', runs: [{ text: 'cita' }] },
        { type: 'codeBlock', lang: 'ts', runs: [{ text: 'const x = 1' }] },
        { type: 'hr' },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('round-trip de listas y checklist', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'bulletList',
          children: [
            { type: 'listItem', runs: [{ text: 'uno' }] },
            { type: 'listItem', runs: [{ text: 'dos', marks: [{ t: 'bold' }] }] },
          ],
        },
        {
          type: 'taskList',
          children: [
            { type: 'listItem', checked: true, runs: [{ text: 'hecho' }] },
            { type: 'listItem', checked: false, runs: [{ text: 'pendiente' }] },
          ],
        },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('script y link sobreviven el viaje', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          runs: [
            { text: 'x', marks: [{ t: 'script', value: 'sup' }] },
            { text: 'y', marks: [{ t: 'link', href: 'https://ok.dev' }] },
            { text: 'z', marks: [{ t: 'link', slideRef: 4 }] },
          ],
        },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('fórmula (math/latex) sobrevive el viaje', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'Ecuación:' }] },
        { type: 'math', latex: 'E = mc^2' },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('tabla (con fila de cabecera) sobrevive el viaje', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [
                { type: 'tableCell', header: true, runs: [{ text: 'A' }] },
                { type: 'tableCell', header: true, runs: [{ text: 'B' }] },
              ],
            },
            {
              type: 'tableRow',
              children: [
                { type: 'tableCell', runs: [{ text: '1', marks: [{ t: 'bold' }] }] },
                { type: 'tableCell', runs: [{ text: '2' }] },
              ],
            },
          ],
        },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('callout (nota/aviso/tip) sobrevive el viaje', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'callout', variant: 'aviso', runs: [{ text: 'cuidado', marks: [{ t: 'bold' }] }] },
        { type: 'callout', variant: 'tip', runs: [{ text: 'truco' }] },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('sangría y espaciado de párrafo/encabezado sobreviven el viaje', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'heading', level: 2, spaceBefore: 24, runs: [{ text: 'Sección' }] },
        { type: 'paragraph', indent: 3, spaceAfter: 12, runs: [{ text: 'sangrado' }] },
        { type: 'paragraph', textIndent: 1.5, runs: [{ text: 'primera línea' }] },
        { type: 'paragraph', textIndent: -1.5, runs: [{ text: 'francesa' }] },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('textIndent como string numérico (getJSON de TipTap) no se tira', () => {
    const rich = pmDocToRich({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textIndent: '1.5' },
          content: [{ type: 'text', text: 'x' }],
        },
        {
          type: 'paragraph',
          attrs: { textIndent: '-1.5' },
          content: [{ type: 'text', text: 'y' }],
        },
      ],
    });
    expect(rich.nodes[0]?.textIndent).toBe(1.5);
    expect(rich.nodes[1]?.textIndent).toBe(-1.5);
  });

  it('term con definición sobrevive el viaje', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          runs: [
            { text: 'fotosíntesis', marks: [{ t: 'term', glosaId: 't-1', definicion: 'proceso de las plantas' }] },
          ],
        },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
  });

  it('link con href peligroso se descarta al volver a RichDoc', () => {
    const rich = pmDocToRich({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] },
          ],
        },
      ],
    });
    expect(JSON.stringify(rich)).not.toContain('javascript:');
  });

  it('texto plano: plainToRich → pm → rich es estable', () => {
    for (const s of ['hola', 'a\nb', 'Encabezado']) {
      const rich = plainToRich(s);
      expect(roundTrip(rich)).toEqual(sanitizeRichDoc(rich));
    }
  });

  it('round-trip de la tipografía del bloque en el nodo raíz (Fase 1)', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'heading',
          level: 1,
          fontFamily: 'Poppins',
          fontSize: 40,
          color: '#123456',
          bold: true,
          italic: false,
          lineHeight: 1.2,
          letterSpacing: -0.5,
          runs: [{ text: 'Título' }],
        },
      ],
    };
    expect(roundTrip(doc)).toEqual(sanitizeRichDoc(doc));
    const n = roundTrip(doc).nodes[0]!;
    expect(n.fontSize).toBe(40);
    expect(n.color).toBe('#123456');
    expect(n.fontFamily).toBe('Poppins');
    expect(n.bold).toBe(true);
    expect(n.italic).toBe(false);
    expect(n.lineHeight).toBe(1.2);
    expect(n.letterSpacing).toBe(-0.5);
  });

  it('los `\\n` de un run se serializan como hardBreak y vuelven a `\\n`', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'heading', level: 1, runs: [{ text: 'Línea 1\nLínea 2' }] }],
    };
    const pm = richToPmDoc(doc);
    const types = (pm.content?.[0]?.content ?? []).map((c) => c.type);
    expect(types).toContain('hardBreak');
    expect(roundTrip(doc).nodes[0]!.runs).toEqual([{ text: 'Línea 1\nLínea 2' }]);
  });

  it('heading sin nivel → H2 al sanear (no queda sin nivel)', () => {
    const rich = pmDocToRich({
      type: 'doc',
      content: [{ type: 'heading', attrs: {}, content: [{ type: 'text', text: 'x' }] }],
    });
    expect(rich.nodes[0]!.type).toBe('heading');
    expect(rich.nodes[0]!.level).toBe(2);
  });

  it('nodos vacíos / tipos desconocidos se omiten sin romper', () => {
    const pm = richToPmDoc({
      version: 1,
      nodes: [
        { type: 'math', latex: '' } as never, // math sin fórmula → se descarta
        { type: 'table', children: [] } as never, // tabla vacía → se descarta
        { type: 'quantum' } as never, // tipo desconocido
        { type: 'paragraph', runs: [{ text: 'ok' }] },
      ],
    });
    expect(pm.content).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'ok' }] }]);
  });
});
