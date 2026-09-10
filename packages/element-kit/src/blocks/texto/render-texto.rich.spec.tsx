import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import type { SlideTheme } from '@lumina/types/slide';
import { plainToRich } from '@lumina/editor-shared/rich-text';
import { SlideNavContext } from '@lumina/editor-shared/slide-nav-context';
import { SlideThemeProvider } from '@lumina/editor-shared/slide-theme-context';
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

  it('link.slideRef → navega con SlideNavContext al hacer clic (index 0-based)', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'ir', marks: [{ t: 'link', slideRef: 3 }] }] },
      ],
    };
    const navigate = vi.fn();
    const { container } = render(
      <SlideNavContext.Provider value={{ navigate, slideCount: 5, slideIndex: 0 }}>
        <RenderText block={{ tipo: 'texto', contenido: 'ir', contenidoRich: doc }} modo="viewer" />
      </SlideNavContext.Provider>,
    );
    const a = container.querySelector('a[data-slide-ref="3"]') as HTMLElement;
    expect(a).not.toBeNull();
    a.click();
    expect(navigate).toHaveBeenCalledWith({ kind: 'ir_a', index: 2 });
  });

  it('term con definición → <span data-term title aria-label tabindex>', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'paragraph',
          runs: [
            { text: 'ADN', marks: [{ t: 'term', glosaId: 'g1', definicion: 'ácido desoxirribonucleico' }] },
          ],
        },
      ],
    };
    const out = html({ tipo: 'texto', contenido: 'ADN', contenidoRich: doc });
    expect(out).toContain('data-term="g1"');
    expect(out).toContain('title="ácido desoxirribonucleico"');
    expect(out).toContain('tabindex="0"');
  });

  it('term sin definición → <span data-term> sin title', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'paragraph', runs: [{ text: 'x', marks: [{ t: 'term', glosaId: 'g2' }] }] }],
    };
    const out = html({ tipo: 'texto', contenido: 'x', contenidoRich: doc });
    expect(out).toContain('data-term="g2"');
    expect(out).not.toContain('title=');
  });

  it('link.slideRef sin navigate → <span data-slide-ref>, no <a>', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'ir', marks: [{ t: 'link', slideRef: 2 }] }] },
      ],
    };
    const out = html({ tipo: 'texto', contenido: 'ir', contenidoRich: doc });
    expect(out).toContain('data-slide-ref="2"');
    expect(out).not.toContain('<a ');
  });

  it('nodo con indent / spaceBefore / align → estilo propio del nodo', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'a' }] },
        { type: 'paragraph', indent: 2, spaceBefore: 10, align: 'derecha', runs: [{ text: 'b' }] },
      ],
    };
    const { container } = render(
      <RenderText block={{ tipo: 'texto', contenido: 'a\nb', contenidoRich: doc }} modo="viewer" />,
    );
    const p = container.querySelectorAll('p')[1] as HTMLElement;
    expect(p.style.marginInlineStart).toBe('2rem');
    expect(p.style.marginTop).toBe('10px');
    expect(p.style.textAlign).toBe('right');
  });

  it('taskList → <ul data-task-list> con <input type=checkbox> por ítem', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'taskList',
          children: [
            { type: 'listItem', checked: true, runs: [{ text: 'hecho' }] },
            { type: 'listItem', checked: false, runs: [{ text: 'falta' }] },
          ],
        },
      ],
    };
    const { container } = render(
      <RenderText block={{ tipo: 'texto', contenido: 'hecho\nfalta', contenidoRich: doc }} modo="viewer" />,
    );
    expect(container.querySelector('ul[data-task-list]')).not.toBeNull();
    const boxes = container.querySelectorAll('input[type="checkbox"]');
    expect(boxes).toHaveLength(2);
    expect((boxes[0] as HTMLInputElement).checked).toBe(true);
    expect((boxes[1] as HTMLInputElement).checked).toBe(false);
    expect(container.querySelector('li[data-checked="true"]')).not.toBeNull();
  });

  it('codeBlock → <pre><code> con el código (fallback mientras carga lowlight)', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'codeBlock', lang: 'js', runs: [{ text: 'const x = 1;' }] }],
    };
    const { container } = render(
      <RenderText block={{ tipo: 'texto', contenido: 'const x = 1;', contenidoRich: doc }} modo="viewer" />,
    );
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.querySelector('code')?.textContent).toBe('const x = 1;');
  });

  it('math → nodo [data-math] con el LaTeX (fallback mientras carga KaTeX)', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        { type: 'paragraph', runs: [{ text: 'x' }] },
        { type: 'math', latex: 'a^2 + b^2 = c^2' },
      ],
    };
    const { container } = render(
      <RenderText
        block={{ tipo: 'texto', contenido: 'x', contenidoRich: doc }}
        modo="viewer"
      />,
    );
    const math = container.querySelector('[data-math]');
    expect(math).not.toBeNull();
    expect(math?.textContent).toContain('a^2 + b^2 = c^2');
  });

  it('table → <table> con <th> en cabecera y <td> en el cuerpo', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [
        {
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [
                { type: 'tableCell', header: true, runs: [{ text: 'Col' }] },
              ],
            },
            {
              type: 'tableRow',
              children: [{ type: 'tableCell', runs: [{ text: 'val' }] }],
            },
          ],
        },
      ],
    };
    const { container } = render(
      <RenderText block={{ tipo: 'texto', contenido: 'Col\nval', contenidoRich: doc }} modo="viewer" />,
    );
    expect(container.querySelector('table[data-table]')).not.toBeNull();
    expect(container.querySelector('th')?.textContent).toBe('Col');
    expect(container.querySelector('td')?.textContent).toBe('val');
    expect(container.querySelectorAll('tr')).toHaveLength(2);
  });

  it('callout → <div data-callout> con borde e íconos de color por variante', () => {
    const doc: RichDoc = {
      version: 1,
      nodes: [{ type: 'callout', variant: 'tip', runs: [{ text: 'consejo' }] }],
    };
    const { container } = render(
      <RenderText block={{ tipo: 'texto', contenido: 'consejo', contenidoRich: doc }} modo="viewer" />,
    );
    const el = container.querySelector('div[data-callout="tip"]') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('consejo');
    expect(el.style.borderInlineStart).toContain('#10b981');
  });

  describe('estiloTema (rol tipográfico del tema)', () => {
    const theme: SlideTheme = {
      id: 'x',
      nombre: 'X',
      esPersonalizado: false,
      fondo: { tipo: 'color', valor: '#fff' },
      fuente: 'Poppins',
      colores: { texto: '#123456', textoSecundario: '#777', acento: '#00f', fondo: '#fff' },
      tipografia: { titulo: { tamanoFuente: 55 } },
    };

    it('aplica tamaño/color del rol cuando hay tema en contexto', () => {
      const { container } = render(
        <SlideThemeProvider value={{ theme }}>
          <RenderText
            block={{ tipo: 'texto', contenido: 'Título', estiloTema: 'titulo' }}
            modo="viewer"
          />
        </SlideThemeProvider>,
      );
      const p = container.querySelector('p') as HTMLElement;
      expect(p.style.fontSize).toBe('55px');
      expect(p.style.color).toBe('rgb(18, 52, 86)'); // #123456
    });

    it('el ajuste explícito del bloque gana sobre el rol del tema', () => {
      const { container } = render(
        <SlideThemeProvider value={{ theme }}>
          <RenderText
            block={{
              tipo: 'texto',
              contenido: 'Título',
              estiloTema: 'titulo',
              tamanoFuente: '18px',
              color: '#ff0000',
            }}
            modo="viewer"
          />
        </SlideThemeProvider>,
      );
      const p = container.querySelector('p') as HTMLElement;
      expect(p.style.fontSize).toBe('18px');
      expect(p.style.color).toBe('rgb(255, 0, 0)');
    });

    it('sin tema en contexto → el rol no rompe nada (preset del rol)', () => {
      const { container } = render(
        <RenderText
          block={{ tipo: 'texto', contenido: 'Pie', estiloTema: 'pie' }}
          modo="viewer"
        />,
      );
      const p = container.querySelector('p') as HTMLElement;
      expect(p.style.fontSize).toBe('14px');
    });
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
