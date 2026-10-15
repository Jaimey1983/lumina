import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { DiagramaNodoForma } from '@lumina/types/slide';

// El nodo usa `Handle`/`NodeToolbar` de React Flow, que exigen su store: se
// reemplazan por componentes vacíos para probar solo el render de la forma.
vi.mock('@lumina/editor-shared/graph-editor', () => ({
  Handle: () => null,
  NodeToolbar: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

import { DiagramaShapeNode } from './diagrama-shape-node.js';

function render(forma: DiagramaNodoForma, extra: Record<string, unknown> = {}): string {
  const props = {
    id: 'n1',
    selected: false,
    data: { label: 'Etiqueta', accent: '#2563EB', forma, ...extra },
  };
  return renderToStaticMarkup(createElement(DiagramaShapeNode, props as never));
}

describe('DiagramaShapeNode — rect, ellipse y hexagon (V1.2)', () => {
  it('`ellipse` dibuja un <ellipse> SVG con la etiqueta', () => {
    const html = render('ellipse');
    expect(html).toContain('<ellipse');
    expect(html).toContain('Etiqueta');
  });

  it('`hexagon` dibuja un <polygon> de 6 vértices', () => {
    const html = render('hexagon');
    const puntos = /<polygon[^>]*points="([^"]+)"/.exec(html);
    expect(puntos?.[1].trim().split(/\s+/)).toHaveLength(6);
  });

  it('`rect` es una tarjeta de esquinas rectas y `rounded` conserva las redondeadas', () => {
    expect(render('rect')).toContain('rounded-none');
    expect(render('rect')).not.toContain('rounded-lg');
    expect(render('rounded')).toContain('rounded-lg');
  });

  it('`ellipse`/`hexagon` respetan el `ancho` guardado', () => {
    expect(render('ellipse', { ancho: 200 })).toContain('width:200px');
    expect(render('hexagon', { ancho: 200 })).toContain('width:200px');
  });

  it('ninguna de las tres cae ya al rectángulo por defecto salvo `rect`', () => {
    expect(render('ellipse')).not.toContain('border-2 bg-card');
    expect(render('hexagon')).not.toContain('border-2 bg-card');
  });
});
