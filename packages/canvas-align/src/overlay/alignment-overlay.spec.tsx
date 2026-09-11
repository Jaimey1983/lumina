// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AlignmentOverlay } from './alignment-overlay.js';
import type { SnapLine } from '../snap.js';
import type { Measurement } from '../measurements.js';

function meas(partial: Partial<Measurement>): Measurement {
  return {
    id: 'm',
    type: 'horizontal',
    minX_pct: 20,
    maxX_pct: 60,
    minY_pct: 40,
    maxY_pct: 40,
    distance: 24,
    role: 'neighbor',
    color: '#000',
    ...partial,
  };
}

describe('<AlignmentOverlay>', () => {
  it('renderiza una línea de guía vertical sólida para kind "align"', () => {
    const guides: SnapLine[] = [{ orientation: 'vertical', position: 25, kind: 'align' }];
    const { container } = render(<AlignmentOverlay guides={guides} />);
    const line = container.querySelector('div[style*="border-left"]') as HTMLElement;
    expect(line).toBeTruthy();
    expect(line.style.left).toBe('25%');
    expect(line.style.borderLeft).toContain('solid');
    expect(line.style.borderLeft).toContain('var(--align-object');
  });

  it('una guía "gap" se dibuja punteada con el token de distribución', () => {
    const { container } = render(
      <AlignmentOverlay guides={[{ orientation: 'horizontal', position: 50, kind: 'gap' }]} />,
    );
    const line = container.querySelector('div[style*="border-top"]') as HTMLElement;
    expect(line.style.borderTop).toContain('dashed');
    expect(line.style.borderTop).toContain('var(--align-distribute');
  });

  it('pinta una pill "N px" por cada cota', () => {
    render(<AlignmentOverlay measurements={[meas({ distance: 24 }), meas({ id: 'm2', distance: 8, minY_pct: 70, maxY_pct: 70 })]} />);
    expect(screen.getByText('24 px')).toBeTruthy();
    expect(screen.getByText('8 px')).toBeTruthy();
  });

  it('badge de dimensión W×H · X,Y sobre el bloque activo', () => {
    render(
      <AlignmentOverlay activeRect={{ x: 10, y: 20, ancho: 50, alto: 25 }} />,
    );
    const badge = screen.getByTestId('ca-dimension-badge');
    expect(badge.textContent).toContain('640 × 180');
    expect(badge.textContent).toContain('128, 144');
  });

  it('badge de grados sólo cuando hay rotación ≠ 0', () => {
    const { rerender } = render(
      <AlignmentOverlay activeRect={{ x: 10, y: 10, ancho: 20, alto: 20 }} rotationDeg={45} />,
    );
    expect(screen.getByTestId('ca-degrees-badge')).toBeTruthy();
    expect(screen.getByText('45°')).toBeTruthy();

    rerender(
      <AlignmentOverlay activeRect={{ x: 10, y: 10, ancho: 20, alto: 20 }} rotationDeg={0} />,
    );
    expect(screen.queryByTestId('ca-degrees-badge')).toBeNull();
  });

  it('overlay marcado aria-hidden y sin pointer-events', () => {
    const { container } = render(<AlignmentOverlay guides={[]} />);
    const root = container.querySelector('[data-canvas-align-overlay]') as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.style.pointerEvents).toBe('none');
  });
});
