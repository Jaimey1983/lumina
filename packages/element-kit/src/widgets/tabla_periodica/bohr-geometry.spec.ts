import { getAllElements } from '@lumina/chemistry';
import { describe, expect, it } from 'vitest';

import {
  capasOrbitales,
  faseElectron,
  posicionesNucleo,
  puntoEnOrbita,
  radioNucleo,
} from './bohr-geometry.js';

describe('bohr-geometry (Q13)', () => {
  it('capasOrbitales: suma Z, radios crecientes y sentido alterno', () => {
    for (const el of getAllElements()) {
      const a = Math.round(el.atomicMass);
      const capas = capasOrbitales(el.z, a);
      expect(capas.reduce((s, c) => s + c.electrones, 0), el.symbol).toBe(el.z);
      for (let i = 1; i < capas.length; i++) {
        expect(capas[i]!.radio).toBeGreaterThan(capas[i - 1]!.radio);
        expect(Math.sign(capas[i]!.velocidad)).toBe(-Math.sign(capas[i - 1]!.velocidad));
      }
      expect(capas[0]!.radio).toBeGreaterThan(radioNucleo(a));
    }
  });

  it('capasOrbitales: el plano de cada capa difiere del de la anterior', () => {
    const capas = capasOrbitales(79, 197);
    for (let i = 1; i < capas.length; i++) {
      const previa = capas[i - 1]!;
      const actual = capas[i]!;
      expect(
        actual.inclinacionX !== previa.inclinacionX || actual.inclinacionZ !== previa.inclinacionZ,
      ).toBe(true);
    }
  });

  it('puntoEnOrbita queda a distancia `radio` del núcleo y en su plano', () => {
    for (const ang of [0, 1, 2.5, 4]) {
      const [x, y, z] = puntoEnOrbita(2, ang);
      expect(Math.hypot(x, z)).toBeCloseTo(2, 10);
      expect(y).toBe(0);
    }
  });

  it('faseElectron reparte los electrones en partes iguales', () => {
    expect(faseElectron(0, 4)).toBe(0);
    expect(faseElectron(1, 4)).toBeCloseTo(Math.PI / 2, 10);
    expect(faseElectron(0, 0)).toBe(0);
  });

  it('posicionesNucleo: A nucleones, Z protones y todo dentro del radio del núcleo', () => {
    const nucleones = posicionesNucleo(26, 56);
    expect(nucleones).toHaveLength(56);
    expect(nucleones.filter((n) => n.tipo === 'p')).toHaveLength(26);
    const limite = radioNucleo(56);
    for (const { pos } of nucleones) {
      expect(Math.hypot(...pos)).toBeLessThanOrEqual(limite);
    }
  });

  it('posicionesNucleo funciona para H (1 protón, sin neutrones) y para Og', () => {
    expect(posicionesNucleo(1, 1)).toEqual([{ tipo: 'p', pos: [0, 0, 0] }]);
    const og = posicionesNucleo(118, 294);
    expect(og).toHaveLength(294);
    expect(og.filter((n) => n.tipo === 'p')).toHaveLength(118);
  });
});
