import { describe, expect, it } from 'vitest';

import { percentComposition } from './percent-composition.js';

describe('percentComposition', () => {
  it('H2O suma ~100%', () => {
    const rows = percentComposition('H2O');
    expect(rows).not.toBeNull();
    const sum = rows!.reduce((a, r) => a + r.percent, 0);
    expect(sum).toBeGreaterThan(99.5);
    expect(sum).toBeLessThan(100.5);
  });

  it('incluye H y O en agua', () => {
    const rows = percentComposition('H2O')!;
    expect(rows.find((r) => r.element === 'H')?.percent).toBeGreaterThan(10);
    expect(rows.find((r) => r.element === 'O')?.percent).toBeGreaterThan(85);
  });

  it('fórmula inválida → null', () => {
    expect(percentComposition('not-a-formula')).toBeNull();
  });
});
