import { describe, expect, it } from 'vitest';
import { aparienciaACss, combinarAparienciasCss } from './apariencia-estado';

describe('aparienciaACss (N6)', () => {
  it('sin apariencia no hay estilo', () => {
    expect(aparienciaACss(undefined)).toEqual({});
    expect(aparienciaACss({})).toEqual({});
  });
  it('traduce cada propiedad declarativa; la escala no usa transform (no pisa la rotación)', () => {
    const css = aparienciaACss({ opacidad: 0.5, escala: 1.1, fondo: '#abc', borde: '#112233', sombra: 2, brillo: 1.2 });
    expect(css).toMatchObject({
      opacity: 0.5,
      scale: '1.1',
      backgroundColor: '#abc',
      outline: '2px solid #112233',
      boxShadow: '0 4px 10px rgba(0,0,0,0.30)',
      filter: 'brightness(1.2)',
    });
    expect('transform' in css).toBe(false);
  });
  it('no deja pasar CSS libre ni valores fuera de rango', () => {
    const css = aparienciaACss({
      fondo: 'url(javascript:alert(1))',
      escala: 50,
      position: 'fixed',
    } as never);
    expect(css).toEqual({});
  });
  it('combina en orden: la última capa pisa a la anterior', () => {
    expect(combinarAparienciasCss({ fondo: '#111111', opacidad: 1 }, undefined, { fondo: '#222222' })).toEqual({
      backgroundColor: '#222222',
      opacity: 1,
    });
  });
});
