import { describe, expect, it } from 'vitest';

import { answerMatchesFormula } from './inorganic.js';
import { normalizeFormula, normalizeFormulaInput } from '../formula/normalize.js';
import { formulasEqual } from '../formula/parse.js';

describe('normalizeFormula / formulasEqual', () => {
  it('H₂O ≡ H2O', () => {
    expect(formulasEqual('H₂O', 'H2O')).toBe(true);
    expect(normalizeFormulaInput('H2O')).toBe('H2O');
    expect(normalizeFormula('H2O')).toBe('H2O');
  });
});

describe('nomenclature inorgánica v1', () => {
  it('óxido de calcio', () => {
    expect(answerMatchesFormula('CaO', 'óxido de calcio')).toBe(true);
    expect(answerMatchesFormula('CaO', 'CaO')).toBe(true);
  });
});
