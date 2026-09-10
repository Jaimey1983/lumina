import { describe, expect, it } from 'vitest';
import {
  TEXT_INDENT_STEP,
  asFiniteNumber,
  isFirstLineIndent,
  isHangingIndent,
  textIndentStyle,
} from './indent.js';

describe('textIndentStyle', () => {
  it('sin valor o 0 no genera CSS', () => {
    expect(textIndentStyle(undefined)).toEqual({});
    expect(textIndentStyle(0)).toEqual({});
  });

  it('positivo → solo text-indent (primera línea)', () => {
    expect(textIndentStyle(TEXT_INDENT_STEP)).toEqual({ textIndent: '1.5rem' });
  });

  it('negativo → text-indent + padding (sangría francesa)', () => {
    expect(textIndentStyle(-TEXT_INDENT_STEP)).toEqual({
      textIndent: '-1.5rem',
      paddingInlineStart: '1.5rem',
    });
  });
});

describe('asFiniteNumber', () => {
  it('acepta número y string numérico (getJSON de TipTap)', () => {
    expect(asFiniteNumber(1.5)).toBe(1.5);
    expect(asFiniteNumber(-1.5)).toBe(-1.5);
    expect(asFiniteNumber('1.5')).toBe(1.5);
    expect(asFiniteNumber('-1.5')).toBe(-1.5);
    expect(asFiniteNumber('')).toBeUndefined();
    expect(asFiniteNumber(undefined)).toBeUndefined();
    expect(asFiniteNumber(NaN)).toBeUndefined();
  });
});

describe('isFirstLineIndent / isHangingIndent', () => {
  it('clasifica el signo', () => {
    expect(isFirstLineIndent(1.5)).toBe(true);
    expect(isFirstLineIndent(-1.5)).toBe(false);
    expect(isHangingIndent(-1.5)).toBe(true);
    expect(isHangingIndent(1.5)).toBe(false);
    expect(isFirstLineIndent(undefined)).toBe(false);
    expect(isHangingIndent(undefined)).toBe(false);
  });
});
