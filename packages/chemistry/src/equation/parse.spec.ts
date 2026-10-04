import { describe, expect, it } from 'vitest';

import { parseEquation } from './parse.js';

describe('parseEquation', () => {
  it('flecha ->', () => {
    expect(parseEquation('A + B -> C')?.products).toEqual(['C']);
  });

  it('flecha Unicode', () => {
    expect(parseEquation('A → B')?.products).toEqual(['B']);
  });

  it('sin productos', () => {
    expect(parseEquation('A + B')).toBeNull();
  });
});
