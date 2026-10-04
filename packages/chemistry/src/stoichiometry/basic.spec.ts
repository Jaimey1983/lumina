import { describe, expect, it } from 'vitest';
import { findLimitingReagent, productMolesAtLimit } from './basic.js';

describe('findLimitingReagent', () => {
  it('identifica reactivo limitante en H2 + O2 -> H2O', () => {
    const r = findLimitingReagent('H2 + O2 -> H2O', [2.016, 100]);
    expect(r.limitingIndex).toBe(0);
    expect(r.maxExtent).toBeCloseTo(0.5, 3);
    const h2oMoles = productMolesAtLimit(r, 0);
    expect(h2oMoles).toBeCloseTo(1, 3);
  });
});
