import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { RenderText } from './render-texto.js';
import { curvedArcPath } from './curved-text.js';

describe('curvedArcPath', () => {
  // `M x0 yBase Q xc yCtrl x1 y1`
  const parse = (d: string) => {
    const [x0, yBase, xc, yCtrl, x1, y1] = d.match(/-?[\d.]+/g)!.map(Number) as number[];
    return { x0, yBase, xc, yCtrl, x1, y1 };
  };
  it('curvatura 0 → control en la línea base (recto)', () => {
    const p = parse(curvedArcPath(400, 140, 0, 32));
    expect(p.yCtrl).toBe(p.yBase);
  });
  it('positiva → control por ENCIMA (menor y) → arco hacia arriba', () => {
    const p = parse(curvedArcPath(400, 140, 60, 32));
    expect(p.yCtrl).toBeLessThan(p.yBase);
  });
  it('negativa → control por DEBAJO (mayor y) → valle', () => {
    const p = parse(curvedArcPath(400, 140, -50, 32));
    expect(p.yCtrl).toBeGreaterThan(p.yBase);
  });
});

describe('RenderText — texto curvado (Fase 5A)', () => {
  const block = (extra: Partial<TextBlock>): TextBlock => ({
    tipo: 'texto',
    contenido: 'Texto en arco',
    ...extra,
  });

  it('con curvatura → <svg><textPath>, sin <p>', () => {
    const { container } = render(<RenderText block={block({ curvatura: 60 })} modo="viewer" />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('textPath')?.textContent).toBe('Texto en arco');
    expect(container.querySelector('p')).toBeNull();
  });

  it('curvatura 0 → render normal (<p>)', () => {
    const { container } = render(<RenderText block={block({ curvatura: 0 })} modo="viewer" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('Texto en arco');
  });

  it('multilínea se colapsa a una sola línea', () => {
    const { container } = render(
      <RenderText block={block({ contenido: 'linea 1\nlinea 2', curvatura: 40 })} modo="viewer" />,
    );
    expect(container.querySelector('textPath')?.textContent).toBe('linea 1 linea 2');
  });

  it('el color del bloque va al fill del texto', () => {
    const { container } = render(
      <RenderText block={block({ curvatura: 30, color: '#e11d48' })} modo="viewer" />,
    );
    expect((container.querySelector('text') as SVGElement).getAttribute('style')).toContain(
      'fill: #e11d48',
    );
  });
});
