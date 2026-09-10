import { describe, expect, it } from 'vitest';
import type { RichDoc } from '@lumina/types/rich-text';
import { plainToRich, richToPlain } from './plain.js';
import { isSafeHref, sanitizeRichDoc, sanitizeRichMark } from './sanitize.js';
import { richToHtml } from './html.js';
import { richMarksToStyle, hexToRgba } from './marks.js';

describe('plainToRich / richToPlain', () => {
  it('round-trip identidad sobre texto plano multilínea', () => {
    for (const s of ['', 'una línea', 'línea 1\nlínea 2', 'a\n\nb\n', '  espacios  ']) {
      expect(richToPlain(plainToRich(s))).toBe(s);
    }
  });

  it('texto sin formato = un solo párrafo que conserva los \\n', () => {
    const doc = plainToRich('uno\n\ntres');
    expect(doc.nodes).toHaveLength(1);
    expect(doc.nodes[0]).toMatchObject({ type: 'paragraph', runs: [{ text: 'uno\n\ntres' }] });
  });

  it('cadena vacía → un párrafo sin runs', () => {
    expect(plainToRich('')).toEqual({ version: 1, nodes: [{ type: 'paragraph' }] });
  });

  it('pista de nivel → un nodo heading que conserva los \\n internos', () => {
    const doc = plainToRich('Título\ncon salto', { nivel: 2 });
    expect(doc.nodes).toHaveLength(1);
    expect(doc.nodes[0]).toMatchObject({ type: 'heading', level: 2 });
    expect(richToPlain(doc)).toBe('Título\ncon salto');
  });

  it('pista de lista → listItem por línea', () => {
    const doc = plainToRich('a\nb', { lista: 'numeros' });
    expect(doc.nodes[0]!.type).toBe('orderedList');
    expect(doc.nodes[0]!.children).toHaveLength(2);
    expect(richToPlain(doc)).toBe('a\nb');
  });

  it('propaga alineación al nodo', () => {
    expect(plainToRich('x', { alineacion: 'centro' }).nodes[0]!.align).toBe('centro');
  });
});

describe('isSafeHref', () => {
  it('permite http(s), mailto, tel, ancla y relativo', () => {
    for (const h of ['https://ok.dev', 'http://x', 'mailto:a@b.c', 'tel:+1', '#seccion', '/ruta', './x']) {
      expect(isSafeHref(h)).toBe(true);
    }
  });
  it('rechaza javascript/data/vbscript/file y esquemas raros', () => {
    for (const h of ['javascript:alert(1)', ' JavaScript:x', 'data:text/html,x', 'vbscript:x', 'file:///etc', 'ssh://h']) {
      expect(isSafeHref(h)).toBe(false);
    }
  });
  it('vacío / no-string → false', () => {
    expect(isSafeHref('')).toBe(false);
    expect(isSafeHref(undefined)).toBe(false);
  });
});

describe('sanitizeRichMark', () => {
  it('marcas booleanas se normalizan a { t }', () => {
    expect(sanitizeRichMark({ t: 'bold' } as never)).toEqual({ t: 'bold' });
  });
  it('link con href inseguro pero slideRef válido se conserva sin href', () => {
    expect(sanitizeRichMark({ t: 'link', href: 'javascript:x', slideRef: 3 })).toEqual({
      t: 'link',
      slideRef: 3,
    });
  });
  it('link sin href seguro ni slideRef → null', () => {
    expect(sanitizeRichMark({ t: 'link', href: 'javascript:x' })).toBeNull();
  });
  it('size no positivo → null; size decimal se redondea', () => {
    expect(sanitizeRichMark({ t: 'size', px: 0 })).toBeNull();
    expect(sanitizeRichMark({ t: 'size', px: 17.6 })).toEqual({ t: 'size', px: 18 });
  });
  it('marca desconocida → null', () => {
    expect(sanitizeRichMark({ t: 'blink' } as never)).toBeNull();
  });
});

describe('sanitizeRichDoc', () => {
  it('descarta nodos y marcas fuera del esquema y funde runs contiguos', () => {
    const dirty = {
      version: 1,
      nodes: [
        { type: 'evil', runs: [{ text: 'x' }] },
        {
          type: 'paragraph',
          runs: [
            { text: 'Hola ', marks: [{ t: 'bold' }] },
            { text: 'mundo', marks: [{ t: 'bold' }] },
            { text: '!', marks: [{ t: 'blink' }] },
          ],
        },
      ],
    } as unknown as RichDoc;
    const clean = sanitizeRichDoc(dirty);
    expect(clean.nodes).toHaveLength(1);
    expect(clean.nodes[0]!.runs).toEqual([
      { text: 'Hola mundo', marks: [{ t: 'bold' }] },
      { text: '!' },
    ]);
  });
  it('documento vacío → un párrafo', () => {
    expect(sanitizeRichDoc({ version: 1, nodes: [] })).toEqual({
      version: 1,
      nodes: [{ type: 'paragraph' }],
    });
  });

  it('un encabezado vacío es un bloque válido; una lista sin hijos no', () => {
    const doc = sanitizeRichDoc({
      version: 1,
      nodes: [
        { type: 'heading', level: 1 },
        { type: 'bulletList' },
      ],
    } as unknown as RichDoc);
    expect(doc.nodes).toEqual([{ type: 'heading', level: 1 }]);
  });
});

describe('richToHtml', () => {
  it('escapa el texto y aplica marcas como estilo inline', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          runs: [
            { text: '<b>' },
            { text: 'rojo', marks: [{ t: 'color', value: '#ff0000' }] },
          ],
        },
      ],
    };
    const html = richToHtml(doc);
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('color:#ff0000');
    expect(html.startsWith('<p>')).toBe(true);
  });

  it('link seguro → <a target rel>; inseguro → sin <a>', () => {
    const mk = (href: string): RichDoc => ({
      version: 1,
      nodes: [{ type: 'paragraph', runs: [{ text: 'x', marks: [{ t: 'link', href }] }] }],
    });
    expect(richToHtml(mk('https://ok.dev'))).toContain(
      '<a href="https://ok.dev" target="_blank" rel="noopener noreferrer">',
    );
    expect(richToHtml(mk('javascript:alert(1)'))).not.toContain('<a ');
  });

  it('heading, lista y cita usan la etiqueta correcta', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'heading', level: 3, runs: [{ text: 'T' }] },
        { type: 'bulletList', children: [{ type: 'listItem', runs: [{ text: 'a' }] }] },
        { type: 'blockquote', runs: [{ text: 'q' }] },
      ],
    };
    const html = richToHtml(doc);
    // El `<h3>` ahora lleva la escala de encabezado inline (paridad con el
    // render React: antes la miniatura mostraba el H3 sin tamaño).
    expect(html).toMatch(/<h3 style="[^"]*font-size:26px[^"]*">T<\/h3>/);
    expect(html).toContain('<ul><li>a</li></ul>');
    expect(html).toContain('<blockquote>q</blockquote>');
  });

  it('resuelve tokens sólo con resolveToken', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'paragraph', runs: [{ text: 'Hola {{docente}} y {{x}}' }] }],
    };
    expect(richToHtml(doc)).toContain('{{docente}}');
    expect(richToHtml(doc, { resolveToken: (n) => (n === 'docente' ? 'Ana' : undefined) })).toContain(
      'Hola Ana y {{x}}',
    );
  });
});

describe('marks', () => {
  it('hexToRgba', () => {
    expect(hexToRgba('#ff0000', 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(hexToRgba('rgb(1,2,3)', 50)).toBe('rgb(1,2,3)');
  });
  it('richMarksToStyle combina en orden', () => {
    expect(
      richMarksToStyle([{ t: 'bold' }, { t: 'color', value: '#111' }, { t: 'size', px: 20 }]),
    ).toMatchObject({ fontWeight: 'bold', color: '#111', fontSize: '20px' });
  });
  it('underline + strike se acumulan en una sola text-decoration', () => {
    const s = richMarksToStyle([{ t: 'underline' }, { t: 'strike' }]) as Record<string, unknown>;
    expect(String(s.textDecorationLine).split(/\s+/).sort()).toEqual([
      'line-through',
      'underline',
    ]);
  });
  it('script no produce estilo CSS (lo envuelve <sup>/<sub>)', () => {
    expect(richMarksToStyle([{ t: 'script', value: 'sup' }])).toEqual({});
  });
});
