import { describe, expect, it } from 'vitest';
import { dilutionC2, dilutionSeries } from './dilution.js';
import { idealGasPressure, idealGasSeries, R_ATM_L_PER_MOL_K } from './ideal-gas.js';
import { phStrong } from './ph-strong.js';
import { titrationCurve, titrationPh } from './titration-curve.js';

describe('phStrong', () => {
  it('ácido 0,01 M → pH 2', () => {
    expect(phStrong(0.01, 'acid')).toBeCloseTo(2, 5);
  });
  it('base 0,001 M → pH 11', () => {
    expect(phStrong(0.001, 'base')).toBeCloseTo(11, 5);
  });
});

describe('idealGas', () => {
  it('PV=nRT con n=1, T=273, V=22,4 L', () => {
    const P = idealGasPressure({ n: 1, T: 273, V: 22.4, R: R_ATM_L_PER_MOL_K });
    expect(P).toBeCloseTo(1, 2);
  });
  it('serie decrece al aumentar V', () => {
    const s = idealGasSeries(1, 300, 1, 10, 5);
    expect(s.length).toBe(5);
    expect(s[0].P).toBeGreaterThan(s[4].P);
  });
});

describe('dilution', () => {
  it('duplicar volumen divide concentración', () => {
    expect(dilutionC2(2, 0.1, 0.2)).toBeCloseTo(1, 8);
  });
});

describe('titrationCurve', () => {
  it('punto de equivalencia cerca de pH 7', () => {
    const Ca = 0.1;
    const Va = 0.05;
    const Cb = 0.1;
    const veq = (Ca * Va) / Cb;
    expect(titrationPh(veq, Ca, Va, Cb)).toBeCloseTo(7, 1);
  });
  it('genera puntos monótonos en volumen', () => {
    const curve = titrationCurve(0.1, 0.05, 0.1, 0.12, 10);
    expect(curve.length).toBe(10);
    expect(curve[0].vol).toBe(0);
  });
});
