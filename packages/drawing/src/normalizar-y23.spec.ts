import { describe, expect, it } from 'vitest';

import { LIMITES, normalizarEscena } from './normalizar.js';
import type { Escena, Forma } from './tipos.js';

const conEstilo = (estilo: unknown): Forma => normalizarEscena({ elementos: [{ tipo: 'forma', estilo }] }).elementos[0] as Forma;
const relleno = (r: unknown) => conEstilo({ relleno: r }).estilo.relleno;
const sombra = (s: unknown) => conEstilo({ sombra: s }).estilo.sombra;

const DEGRADADO = { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 90 };

describe('límites nuevos (Y23)', () => {
  it('declara los topes de la ficha con sus valores', () => {
    expect(LIMITES.paradasDegradado).toBe(3);
    expect(LIMITES.paradaPosicion).toEqual({ min: 0.05, max: 0.95 });
    expect(LIMITES.escalaPatron).toEqual({ min: 4, max: 64, porDefecto: 12 });
  });
});

describe('degradado ampliado: lo de antes no cambia', () => {
  it('un degradado de antes sale con exactamente sus cuatro campos, sin claves nuevas', () => {
    const r = relleno(DEGRADADO);
    expect(r).toEqual({ tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 90 });
    expect(Object.keys(r)).toEqual(['tipo', 'desde', 'hasta', 'angulo']);
  });

  it.each([
    ['forma «lineal»', { forma: 'lineal' }],
    ['forma desconocida', { forma: 'espiral' }],
    ['forma numérica', { forma: 1 }],
    ['paradas vacías', { paradas: [] }],
    ['paradas que no son lista', { paradas: 'x' }],
    ['paradas todas inválidas', { paradas: [{ posicion: 0.5, color: 'rojo' }, null, 3, { posicion: 0.5 }] }],
  ])('%s se descarta y no deja rastro', (_n, extra) => {
    const r = relleno({ ...DEGRADADO, ...extra });
    expect(Object.keys(r)).toEqual(['tipo', 'desde', 'hasta', 'angulo']);
  });
});

describe('degradado radial y paradas', () => {
  it('conserva «radial» y el ángulo (por si se vuelve a lineal)', () => {
    expect(relleno({ ...DEGRADADO, angulo: 45, forma: 'radial' })).toEqual({ tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 45, forma: 'radial' });
  });

  it('lee las paradas, las acota a [0,05; 0,95] y las ordena de menor a mayor', () => {
    const r = relleno({
      ...DEGRADADO,
      paradas: [
        { posicion: 0.8, color: '#00FF00' },
        { posicion: 0, color: 'var(--primary)' },
        { posicion: 7, color: '#0000FF' },
      ],
    });
    expect(r).toEqual({
      tipo: 'degradado',
      desde: '#FFFFFF',
      hasta: '#000000',
      angulo: 90,
      paradas: [
        { posicion: 0.05, color: 'var(--primary)' },
        { posicion: 0.8, color: '#00FF00' },
        { posicion: 0.95, color: '#0000FF' },
      ],
    });
  });

  it('se queda con las tres primeras paradas válidas (las inválidas no cuentan) y no lanza', () => {
    const r = relleno({
      ...DEGRADADO,
      paradas: [
        { posicion: 0.9, color: '#111111' },
        { posicion: 0.5, color: 'malo' },
        { posicion: 0.1, color: '#222222' },
        { posicion: 0.2, color: '#333333' },
        { posicion: 0.3, color: '#444444' },
      ],
    });
    expect(r.tipo === 'degradado' ? r.paradas : null).toEqual([
      { posicion: 0.1, color: '#222222' },
      { posicion: 0.2, color: '#333333' },
      { posicion: 0.9, color: '#111111' },
    ]);
  });

  it('una posición que no es número cae al medio y dos paradas en el mismo sitio se conservan', () => {
    const r = relleno({ ...DEGRADADO, paradas: [{ posicion: 'x', color: '#111111' }, { posicion: 0.5, color: '#222222' }] });
    expect(r.tipo === 'degradado' ? r.paradas : null).toEqual([
      { posicion: 0.5, color: '#111111' },
      { posicion: 0.5, color: '#222222' },
    ]);
  });
});

describe('relleno «patrón»', () => {
  it('lee todos sus campos y escribe las claves en este orden', () => {
    const r = relleno({ tipo: 'patron', patron: 'puntos', color: '#112233', fondo: 'var(--muted)', escala: 20 });
    expect(r).toEqual({ tipo: 'patron', patron: 'puntos', color: '#112233', fondo: 'var(--muted)', escala: 20 });
    expect(Object.keys(r)).toEqual(['tipo', 'patron', 'color', 'fondo', 'escala']);
  });

  it('sin nada más: diagonal, líneas #334155, sin fondo y escala 12', () => {
    expect(relleno({ tipo: 'patron' })).toEqual({ tipo: 'patron', patron: 'diagonal', color: '#334155', fondo: null, escala: 12 });
  });

  it.each([
    ['un patrón desconocido', { patron: 'olas' }, { patron: 'diagonal' }],
    ['un color de líneas inválido', { color: 'rgb(1,2,3)' }, { color: '#334155' }],
    ['un fondo inválido', { fondo: 'rojo' }, { fondo: null }],
    ['un fondo que no es texto', { fondo: 5 }, { fondo: null }],
    ['una escala NaN', { escala: Number.NaN }, { escala: 12 }],
    ['una escala de texto', { escala: '30' }, { escala: 12 }],
    ['una escala 0', { escala: 0 }, { escala: 4 }],
    ['una escala negativa', { escala: -9 }, { escala: 4 }],
    ['una escala enorme', { escala: 1e9 }, { escala: 64 }],
  ])('%s se corrige sin lanzar', (_n, entrada, esperado) => {
    expect(relleno({ tipo: 'patron', ...entrada })).toMatchObject(esperado);
  });

  it.each(['rayas', 'diagonal', 'cuadricula', 'puntos'])('acepta el patrón «%s»', (p) => {
    expect(relleno({ tipo: 'patron', patron: p })).toMatchObject({ patron: p });
  });

  it('un tipo de relleno desconocido sigue dando el relleno por defecto', () => {
    expect(relleno({ tipo: 'textura' })).toEqual({ tipo: 'solido', color: '#FFFFFF' });
  });
});

describe('sombra interior', () => {
  const BASE = { color: '#00000055', desenfoque: 8, dx: 2, dy: 4 };

  it('una sombra de antes sale con exactamente sus cuatro campos', () => {
    const s = sombra(BASE);
    expect(s).toEqual(BASE);
    expect(Object.keys(s as object)).toEqual(['color', 'desenfoque', 'dx', 'dy']);
  });

  it('«interior: true» se conserva, al final', () => {
    const s = sombra({ ...BASE, interior: true });
    expect(s).toEqual({ ...BASE, interior: true });
    expect(Object.keys(s as object)).toEqual(['color', 'desenfoque', 'dx', 'dy', 'interior']);
  });

  it.each([['false', false], ['0', 0], ['"si"', 'si'], ['1', 1], ['null', null]])('«interior: %s» se descarta', (_n, v) => {
    expect(Object.keys(sombra({ ...BASE, interior: v }) as object)).toEqual(['color', 'desenfoque', 'dx', 'dy']);
  });
});

describe('todo lo nuevo junto', () => {
  const completa = {
    ancho: 800,
    alto: 600,
    fondo: null,
    elementos: [
      { tipo: 'forma', id: 'a', estilo: { relleno: { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 30, forma: 'radial', paradas: [{ posicion: 0.4, color: '#FF0000' }] }, sombra: { color: '#00000055', desenfoque: 8, dx: 0, dy: 0, interior: true } } },
      { tipo: 'forma', id: 'b', estilo: { relleno: { tipo: 'patron', patron: 'cuadricula', color: 'var(--primary)', fondo: '#F1F5F9', escala: 24 } } },
    ],
  };

  it('sobrevive a normalizarEscena sin perder nada', () => {
    const e = normalizarEscena(completa);
    const [a, b] = e.elementos as Forma[];
    expect(a?.estilo.relleno).toEqual({ tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 30, forma: 'radial', paradas: [{ posicion: 0.4, color: '#FF0000' }] });
    expect(a?.estilo.sombra).toEqual({ color: '#00000055', desenfoque: 8, dx: 0, dy: 0, interior: true });
    expect(b?.estilo.relleno).toEqual({ tipo: 'patron', patron: 'cuadricula', color: 'var(--primary)', fondo: '#F1F5F9', escala: 24 });
  });

  it('es idempotente', () => {
    const una: Escena = normalizarEscena(completa);
    expect(normalizarEscena(una)).toEqual(una);
    expect(JSON.stringify(normalizarEscena(una))).toBe(JSON.stringify(una));
  });
});
