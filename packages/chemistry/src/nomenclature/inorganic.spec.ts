import { describe, expect, it } from 'vitest';

import { answerMatchesFormula, nameToFormula } from './inorganic.js';

describe('inorganic nomenclature', () => {
  it('oxido de calcio', () => {
    expect(nameToFormula('óxido de calcio')).toBe('CaO');
    expect(answerMatchesFormula('CaO', 'óxido de calcio')).toBe(true);
  });

  it('agua', () => {
    expect(nameToFormula('agua')).toBe('H2O');
  });
});
