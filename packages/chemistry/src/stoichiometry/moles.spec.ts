import { describe, expect, it } from 'vitest';

import { massToMoles, moleRatio, molesToMass, productMolesFromReactantMass } from './moles.js';

describe('massToMoles / molesToMass', () => {
  it('agua 18 g → 1 mol', () => {
    expect(massToMoles(18, 'H2O')).toBeCloseTo(1, 2);
  });

  it('1 mol agua → 18 g', () => {
    expect(molesToMass(1, 'H2O')).toBeCloseTo(18, 0);
  });

  it('masa negativa', () => {
    expect(massToMoles(-1, 'H2O')).toBeNull();
  });
});

describe('moleRatio', () => {
  it('H2:H2O en formación de agua', () => {
    const r = moleRatio('H2 + O2 -> H2O', 'H2', 'H2O');
    expect(r).toBe(1);
  });

  it('O2:H2O', () => {
    const r = moleRatio('H2 + O2 -> H2O', 'O2', 'H2O');
    expect(r).toBe(2);
  });
});

describe('productMolesFromReactantMass', () => {
  it('2 mol H2 producen 2 mol H2O', () => {
    const gH2 = molesToMass(2, 'H2')!;
    const molesH2O = productMolesFromReactantMass(
      'H2 + O2 -> H2O',
      'H2',
      gH2,
      'H2O',
    );
    expect(molesH2O).toBeCloseTo(2, 2);
  });
});
