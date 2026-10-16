import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { DiagramaNodoForma, DiagramaRelleno } from '@lumina/types/slide';

vi.mock('@lumina/editor-shared/graph-editor', () => ({
  Handle: () => null,
  NodeToolbar: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

import { DiagramaShapeNode, varsEstiloVisual, type EstiloVisualNodo } from './diagrama-shape-node.js';
import { resolverEstiloDiagrama, resolverEstiloNodo } from './diagrama-temas.js';

const FORMAS: DiagramaNodoForma[] = [
  'root', 'chip', 'rounded', 'rect', 'diamond', 'pill', 'parallelogram', 'card-icon',
  'trapezoid', 'triangle', 'inverted-trapezoid', 'circle', 'ellipse', 'hexagon',
];
const RELLENOS: DiagramaRelleno[] = ['contorno', 'tintado', 'solido'];
const ACENTO = '#1E3A8A';

function visual(relleno: DiagramaRelleno, sinSombra = false): EstiloVisualNodo {
  const nodo = resolverEstiloNodo(resolverEstiloDiagrama({ estilo: { relleno } }, 'flujo'), ACENTO);
  return { relleno, rellenoCss: nodo.rellenoCss, colorTexto: nodo.colorTexto, ...(sinSombra ? { sinSombra } : {}) };
}

function render(forma: DiagramaNodoForma, estiloVisual?: EstiloVisualNodo): string {
  const props = {
    id: 'n1',
    selected: false,
    data: { label: 'Etiqueta', accent: ACENTO, forma, ...(estiloVisual ? { estiloVisual } : {}) },
  };
  return renderToStaticMarkup(createElement(DiagramaShapeNode, props as never));
}

describe('DiagramaShapeNode — estilo explícito (V2.2)', () => {
  describe.each(FORMAS)('forma %s', (forma) => {
    it.each(RELLENOS)('relleno %s: el fondo sale del estilo y no de `bg-card` fijo', (relleno) => {
      const vis = visual(relleno);
      const html = render(forma, vis);
      expect(html).toContain('--nodo-bg:');
      // La forma lee la variable (clase) o usa el valor resuelto en línea (formas con tinte propio).
      expect(html.includes('var(--nodo-bg') || html.includes(`background-color:${vis.rellenoCss}`)).toBe(true);
      expect(html).not.toContain('fill-card');
    });

    it('sin estilo explícito no agrega contenedor ni variables (aspecto de siempre)', () => {
      const html = render(forma);
      expect(html).not.toContain('--nodo-bg:');
      expect(html).not.toContain('contents');
    });
  });

  it('solido fija texto con contraste (claro sobre acento oscuro) y atenúa el secundario', () => {
    const html = render('rounded', visual('solido'));
    expect(html).toContain(`--nodo-bg:${ACENTO}`);
    expect(html).toContain('--foreground:#ffffff');
    expect(html).toContain('--card-foreground:#ffffff');
    expect(html).toContain('--muted-foreground:color-mix(in srgb, #ffffff 78%, transparent)');
  });

  it('contorno y tintado no tocan los colores de texto del tema', () => {
    for (const relleno of ['contorno', 'tintado'] as const) {
      expect(render('rounded', visual(relleno))).not.toContain('--foreground:');
    }
  });

  it('tintado mezcla el acento sobre la tarjeta del tema (sin referirse a sí mismo)', () => {
    const html = render('rounded', visual('tintado'));
    expect(html).toMatch(/--nodo-bg:color-mix\(in srgb, #1E3A8A 14%, var\(--card/);
    expect(html).not.toContain('--card:');
  });

  it('sin sombra quita las sombras propias (HTML por contenedor, SVG por clase) y conserva el anillo de selección', () => {
    const conSombra = render('diamond', visual('contorno'));
    const sinSombra = render('diamond', visual('contorno', true));
    expect(conSombra).toContain('drop-shadow-2xs');
    expect(sinSombra).not.toContain('drop-shadow-2xs');
    expect(render('rounded', visual('contorno', true))).toContain('[&amp;_*]:!shadow-none');
    expect(render('rounded', visual('contorno'))).not.toContain('shadow-none');
  });

  it('`sombra: false` sin relleno no pinta fondo ni variables, solo quita sombras', () => {
    const html = render('rounded', { sinSombra: true });
    expect(html).not.toContain('--nodo-bg:');
    expect(html).toContain('!shadow-none');
  });

  describe('varsEstiloVisual', () => {
    it('sin estilo o sin nada que fijar devuelve undefined', () => {
      expect(varsEstiloVisual(undefined)).toBeUndefined();
      expect(varsEstiloVisual({ sinSombra: true })).toBeUndefined();
    });
  });
});
