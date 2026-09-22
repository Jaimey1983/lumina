import { describe, it, expect } from 'vitest';
import { cicloDeGrado, resolverEstandarEbc, EBC_ESTANDARES } from './ebc-estandares.js';

describe('cicloDeGrado', () => {
  it('agrupa ciencias-naturales en 5 ciclos (1-3, 4-5, 6-7, 8-9, 10-11)', () => {
    expect(cicloDeGrado('ciencias-naturales', '1')).toBe('1-3');
    expect(cicloDeGrado('ciencias-naturales', '3')).toBe('1-3');
    expect(cicloDeGrado('ciencias-naturales', '4')).toBe('4-5');
    expect(cicloDeGrado('ciencias-naturales', '6')).toBe('6-7');
    expect(cicloDeGrado('ciencias-naturales', '7')).toBe('6-7');
    expect(cicloDeGrado('ciencias-naturales', '10')).toBe('10-11');
    expect(cicloDeGrado('ciencias-naturales', '11')).toBe('10-11');
  });

  it('lenguaje trata el grado 1 como ciclo propio, distinto de 2-3', () => {
    expect(cicloDeGrado('lenguaje', '1')).toBe('1');
    expect(cicloDeGrado('lenguaje', '2')).toBe('2-3');
    expect(cicloDeGrado('lenguaje', '3')).toBe('2-3');
  });

  it('ingles usa niveles de bilingüismo, no ciclos de grado iguales a las demás áreas', () => {
    expect(cicloDeGrado('ingles', '6')).toBe('basico-3');
    expect(cicloDeGrado('ingles', '10')).toBe('intermedio');
  });
});

describe('resolverEstandarEbc', () => {
  it('resuelve estándar + subprocesos por label, insensible a mayúsculas', () => {
    const r = resolverEstandarEbc('ciencias-naturales', '6', 'entorno vivo');
    expect(r).not.toBeNull();
    expect(r?.estandar).toContain('condiciones de cambio y de equilibrio');
    expect(r?.subprocesos.length).toBeGreaterThan(0);
  });

  it('mismo resultado para grado 6 y grado 7 (mismo ciclo EBC)', () => {
    const r6 = resolverEstandarEbc('ciencias-naturales', '6', 'Entorno físico');
    const r7 = resolverEstandarEbc('ciencias-naturales', '7', 'Entorno físico');
    expect(r7).toEqual(r6);
  });

  it('null si el componente no existe en el catálogo del área', () => {
    expect(
      resolverEstandarEbc('ciencias-naturales', '6', 'Componente inexistente'),
    ).toBeNull();
  });

  it('null si el ciclo de ese grado todavía no está curado en EBC_ESTANDARES', () => {
    expect(resolverEstandarEbc('ciencias-naturales', '1', 'Entorno vivo')).toBeNull();
  });

  it('null si el área no tiene ningún ciclo curado', () => {
    expect(resolverEstandarEbc('lenguaje', '6', 'Producción textual')).toBeNull();
  });
});

describe('EBC_ESTANDARES — forma del catálogo curado', () => {
  it('ciencias-naturales 6-7 tiene entorno_fisico y entorno_vivo, sin duplicados', () => {
    const ciclo = EBC_ESTANDARES['ciencias-naturales']?.['6-7'];
    expect(ciclo).toBeDefined();
    const claves = Object.keys(ciclo!).sort();
    expect(claves).toEqual(['entorno_fisico', 'entorno_vivo']);
    for (const entrada of Object.values(ciclo!)) {
      const subprocesos = entrada!.subprocesos;
      expect(new Set(subprocesos).size).toBe(subprocesos.length);
    }
  });
});
