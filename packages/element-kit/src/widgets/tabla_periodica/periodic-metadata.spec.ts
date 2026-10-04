import { describe, expect, it } from 'vitest';

import { configuracionElectronicaV1 } from './periodic-metadata.js';

describe('configuracionElectronicaV1 (Q9)', () => {
  it('llena por Madelung en los casos regulares', () => {
    expect(configuracionElectronicaV1(1)).toBe('1s1');
    expect(configuracionElectronicaV1(8)).toBe('1s2 · 2s2 · 2p4');
    expect(configuracionElectronicaV1(26)).toBe('1s2 · 2s2 · 2p6 · 3s2 · 3p6 · 4s2 · 3d6');
  });

  it('respeta las excepciones del estado fundamental', () => {
    expect(configuracionElectronicaV1(24)).toMatch(/4s1 · 3d5$/); // Cr
    expect(configuracionElectronicaV1(29)).toMatch(/4s1 · 3d10$/); // Cu
    expect(configuracionElectronicaV1(46)).toMatch(/4d10$/); // Pd (sin 5s)
    expect(configuracionElectronicaV1(46)).not.toMatch(/5s/);
    expect(configuracionElectronicaV1(79)).toMatch(/6s1 · 4f14 · 5d10$/); // Au
    expect(configuracionElectronicaV1(57)).toMatch(/6s2 · 5d1$/); // La
    expect(configuracionElectronicaV1(92)).toMatch(/7s2 · 5f3 · 6d1$/); // U
  });

  it('suma los electrones de Z en los 118 elementos', () => {
    for (let z = 1; z <= 118; z++) {
      const total = configuracionElectronicaV1(z)
        .split(' · ')
        .reduce((acc, orbital) => acc + Number(orbital.replace(/^\d[spdf]/, '')), 0);
      expect(total, `Z=${z}`).toBe(z);
    }
  });
});
