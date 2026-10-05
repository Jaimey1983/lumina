import { getAllElements } from '@lumina/chemistry';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BohrModel } from './bohr-model.js';
import { capasElectronicas } from './periodic-metadata.js';

describe('capasElectronicas (Q12)', () => {
  it('reparte los electrones por capa (K, L, M…)', () => {
    expect(capasElectronicas(1)).toEqual([1]);
    expect(capasElectronicas(8)).toEqual([2, 6]);
    expect(capasElectronicas(11)).toEqual([2, 8, 1]);
    expect(capasElectronicas(26)).toEqual([2, 8, 14, 2]);
    expect(capasElectronicas(79)).toEqual([2, 8, 18, 32, 18, 1]);
  });

  it('suma Z y no deja capas vacías en los 118 elementos', () => {
    for (const el of getAllElements()) {
      const capas = capasElectronicas(el.z);
      expect(capas.reduce((a, b) => a + b, 0), el.symbol).toBe(el.z);
      expect(capas.every((n) => n > 0), el.symbol).toBe(true);
      expect(capas.length).toBeLessThanOrEqual(7);
    }
  });
});

describe('BohrModel (Q12)', () => {
  it('dibuja un punto por electrón y describe las capas', () => {
    const { container, getByRole } = render(
      <BohrModel z={11} symbol="Na" name="Sodio" categoria="alkali_metal" />,
    );
    expect(container.querySelectorAll('circle[class*="ptBohrElectron"]')).toHaveLength(11);
    expect(getByRole('img').getAttribute('aria-label')).toContain('2, 8, 1');
    expect(container.querySelector('svg')?.getAttribute('data-cat')).toBe('alkali_metal');
  });

  it('no anima en modo estático', () => {
    const { container } = render(
      <BohrModel z={8} symbol="O" name="Oxígeno" categoria="nonmetal" estatico />,
    );
    expect(container.querySelector('[class*="ptBohrGira"]')).toBeNull();
  });
});
