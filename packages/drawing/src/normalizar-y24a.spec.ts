import { describe, expect, it } from 'vitest';

import { normalizarEscena } from './normalizar.js';
import { VINETAS, type Escena, type EstiloTexto, type Forma } from './tipos.js';

const estiloTexto = (e: unknown): EstiloTexto => (normalizarEscena({ elementos: [{ tipo: 'forma', estiloTexto: e }] }).elementos[0] as Forma).estiloTexto;
const CLAVES_DE_ANTES = ['tamano', 'negrita', 'cursiva', 'subrayado', 'alineacionH', 'alineacionV', 'color', 'fuente'];

describe('EstiloTexto.vinetas (Y24a)', () => {
  it('las viñetas válidas son «puntos» y «numeros»', () => {
    expect([...VINETAS]).toEqual(['puntos', 'numeros']);
  });

  it('un texto de antes sale con exactamente sus ocho campos, sin «vinetas»', () => {
    expect(Object.keys(estiloTexto({}))).toEqual(CLAVES_DE_ANTES);
    expect(Object.keys(estiloTexto({ tamano: 20, negrita: true }))).toEqual(CLAVES_DE_ANTES);
  });

  it.each([['puntos'], ['numeros']])('«%s» se conserva, al final', (v) => {
    const e = estiloTexto({ vinetas: v });
    expect(e.vinetas).toBe(v);
    expect(Object.keys(e)).toEqual([...CLAVES_DE_ANTES, 'vinetas']);
  });

  it.each([['"Puntos"', 'Puntos'], ['"si"', 'si'], ['1', 1], ['true', true], ['null', null], ['una lista', ['puntos']], ['un objeto', { a: 1 }], ['""', ''], ['"ninguna"', 'ninguna']])(
    '%s se descarta y no deja rastro',
    (_n, v) => {
      expect(Object.keys(estiloTexto({ vinetas: v }))).toEqual(CLAVES_DE_ANTES);
    },
  );

  it('la lista no cambia el resto del estilo del texto', () => {
    expect(estiloTexto({ vinetas: 'puntos', tamano: 22, alineacionH: 'derecha', color: '#112233' })).toEqual({
      tamano: 22,
      negrita: false,
      cursiva: false,
      subrayado: false,
      alineacionH: 'derecha',
      alineacionV: 'medio',
      color: '#112233',
      fuente: '',
      vinetas: 'puntos',
    });
  });

  it('vale para formas, cuadros de texto y conectores, y es idempotente', () => {
    const e: Escena = normalizarEscena({
      elementos: [
        { tipo: 'forma', id: 'f', estiloTexto: { vinetas: 'puntos' } },
        { tipo: 'texto', id: 't', texto: 'x', estiloTexto: { vinetas: 'numeros' } },
        { tipo: 'linea', id: 'l', puntos: [{ x: 0, y: 0 }, { x: 5, y: 5 }], estiloTexto: { vinetas: 'puntos' } },
      ],
    });
    expect(e.elementos.map((x) => (x.tipo === 'grupo' ? undefined : x.estiloTexto.vinetas))).toEqual(['puntos', 'numeros', 'puntos']);
    expect(JSON.stringify(normalizarEscena(e))).toBe(JSON.stringify(e));
  });
});
