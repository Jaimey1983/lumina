import { describe, expect, it } from 'vitest';
import { puntoDePuerto } from '../conectores/puertos.js';
import { FORMAS } from '../formas/index.js';
import { normalizarEscena } from '../normalizar.js';
import { TIPOS_FORMA, type Escena, type Forma, type TipoForma } from '../tipos.js';
import { asasDeAjuste, fijarParametro, rangoDeAjuste, valorDeAsa } from './ajuste-forma.js';
import { escena, forma, grupo, linea } from './util-pruebas.js';

const CON_ASAS: readonly TipoForma[] = [
  'rectangulo', 'rectangulo-redondeado', 'trapecio', 'trapecio-invertido', 'paralelogramo', 'hexagono', 'octogono', 'cruz',
  'flecha-derecha', 'flecha-izquierda', 'flecha-doble', 'cilindro', 'llave', 'callout',
];

const unaForma = (tipo: TipoForma, extra: Record<string, unknown> = {}, rotacion = 0, ancho = 160, alto = 100): Forma =>
  escena(forma('a', 100, 100, ancho, alto, { forma: tipo, ...extra, transformacion: { x: 100, y: 100, ancho, alto, rotacion } })).elementos[0] as Forma;
const f = (e: Escena, id = 'a'): Forma => e.elementos.find((x) => x.id === id) as Forma;

describe('el catálogo de asas de ajuste', () => {
  it('declara asas exactamente en las 14 formas de la ficha (la estrella no)', () => {
    const con = TIPOS_FORMA.filter((t) => (FORMAS[t].asasAjuste?.length ?? 0) > 0);
    expect([...con].sort()).toEqual([...CON_ASAS].sort());
    expect(FORMAS.estrella.asasAjuste).toBeUndefined();
  });

  it('cada clave existe en los parámetros de su forma (o es el radio del rectángulo) y cada parámetro de esas formas tiene su asa', () => {
    for (const t of CON_ASAS) {
      const claves = (FORMAS[t].asasAjuste ?? []).map((a) => a.clave);
      for (const c of claves) expect(c === 'radio' ? t === 'rectangulo' : FORMAS[t].parametros.some((p) => p.clave === c), `${t}: ${c}`).toBe(true);
      for (const p of FORMAS[t].parametros) expect(claves, `${t}: falta el asa de ${p.clave}`).toContain(p.clave);
    }
  });

  it('ida y vuelta: llevar el asa a su propio punto da el mismo valor, en el mínimo, a la mitad y en el máximo, con y sin giro', () => {
    let comprobados = 0;
    for (const t of CON_ASAS) {
      for (const rotacion of [0, 33, 90, 215]) {
        const base = unaForma(t, {}, rotacion);
        for (const asa of FORMAS[t].asasAjuste ?? []) {
          const r = rangoDeAjuste(base, asa.clave);
          expect(r, `${t} ${asa.clave}`).not.toBeNull();
          const { min, max } = r as { min: number; max: number };
          // El globo no pasa de su recorte: el asa tampoco.
          const tope = t === 'callout' ? (160 - Math.min(0.15 * Math.min(160, 80), 80) - 0.14 * 160) / 160 : Infinity;
          for (const v of [min, (min + max) / 2, max].map((x) => Math.min(x, tope))) {
            const e = asa.clave === 'radio' ? { estilo: { radio: v } } : { parametros: { ...(FORMAS[t].parametros.length ? { [asa.clave]: v } : {}) } };
            const forma_ = unaForma(t, e, rotacion);
            const borde = asasDeAjuste(forma_).find((x) => x.clave === asa.clave)?.borde;
            expect(borde).toBeDefined();
            const vuelta = valorDeAsa(forma_, asa.clave, borde as { x: number; y: number });
            expect(vuelta, `${t} ${asa.clave} ${v} a ${rotacion}°`).toBeCloseTo(v, 1);
            comprobados++;
          }
        }
      }
    }
    expect(comprobados).toBeGreaterThan(14 * 4 * 3);
  });
});

describe('valorDeAsa', () => {
  it('acota a los dos extremos del rango', () => {
    const t = unaForma('trapecio');
    expect(valorDeAsa(t, 'inclinacion', { x: -1000, y: 100 })).toBe(0);
    expect(valorDeAsa(t, 'inclinacion', { x: 5000, y: 100 })).toBe(0.45);
  });
  it('es continuo (dos decimales) y con alPaso se ajusta al paso del catálogo', () => {
    const t = unaForma('trapecio'); // x de escena = 100 + inclinación × 160
    const px = 100 + 0.33 * 160;
    expect(valorDeAsa(t, 'inclinacion', { x: px, y: 100 })).toBe(0.33);
    expect(valorDeAsa(t, 'inclinacion', { x: px, y: 100 }, { alPaso: true })).toBe(0.35);
  });
  it('el radio del rectángulo es entero y llega a la mitad del lado menor', () => {
    const r = unaForma('rectangulo');
    expect(valorDeAsa(r, 'radio', { x: 100 + 17.4, y: 100 })).toBe(17);
    expect(valorDeAsa(r, 'radio', { x: 1000, y: 100 })).toBe(50);
    expect(valorDeAsa(r, 'radio', { x: -1000, y: 100 })).toBe(0);
  });
  it('desde el otro lado (flecha a la izquierda, trapecio invertido) cuenta bien', () => {
    expect(valorDeAsa(unaForma('flecha-izquierda'), 'cabeza', { x: 100 + 0.3 * 160, y: 100 })).toBe(0.3);
    expect(valorDeAsa(unaForma('flecha-derecha'), 'cabeza', { x: 100 + 0.7 * 160, y: 100 })).toBe(0.3);
    expect(valorDeAsa(unaForma('trapecio-invertido'), 'inclinacion', { x: 100 + 0.2 * 160, y: 200 })).toBe(0.2);
  });
  it('el giro de 90° cambia de eje: arrastrar hacia abajo es hacia la derecha de la forma', () => {
    const t = unaForma('trapecio', {}, 90); // centro (180, 150): el eje local x queda vertical en la escena
    const sinGiro = valorDeAsa(unaForma('trapecio'), 'inclinacion', { x: 100 + 0.3 * 160, y: 100 });
    // el punto local (0,3·160, 0) girado 90° alrededor del centro
    const c = { x: 180, y: 150 };
    const local = { x: 100 + 0.3 * 160 - c.x, y: 100 - c.y };
    const girado = { x: c.x - local.y, y: c.y + local.x };
    expect(valorDeAsa(t, 'inclinacion', girado)).toBe(sinGiro);
  });
  it('NaN si la forma no tiene esa asa', () => {
    expect(valorDeAsa(unaForma('rombo'), 'inclinacion', { x: 0, y: 0 })).toBeNaN();
    expect(valorDeAsa(unaForma('trapecio'), 'radio', { x: 0, y: 0 })).toBeNaN();
  });
});

describe('fijarParametro', () => {
  it('mezcla con los parámetros que ya había (la flecha conserva el cuerpo al cambiar la cabeza)', () => {
    const e = escena(forma('a', 0, 0, 160, 80, { forma: 'flecha-derecha', parametros: { cabeza: 0.3, cuerpo: 0.6 } }));
    const r = fijarParametro(e, ['a'], 'cabeza', 0.5);
    expect(f(r).parametros).toEqual({ cabeza: 0.5, cuerpo: 0.6 });
  });
  it('acota al rango y redondea', () => {
    const e = escena(forma('a', 0, 0, 160, 80, { forma: 'trapecio' }));
    expect(f(fijarParametro(e, ['a'], 'inclinacion', 9)).parametros).toEqual({ inclinacion: 0.45 });
    expect(f(fijarParametro(e, ['a'], 'inclinacion', 0.333333)).parametros).toEqual({ inclinacion: 0.33 });
    const estrella = escena(forma('a', 0, 0, 100, 100, { forma: 'estrella' }));
    expect(f(fijarParametro(estrella, ['a'], 'puntas', 6.7)).parametros?.puntas).toBe(7);
  });
  it('devuelve la misma escena si nada cambia (mismo valor, parámetro ajeno, texto, bloqueada, número inválido)', () => {
    const e = escena(forma('a', 0, 0, 160, 80, { forma: 'trapecio', parametros: { inclinacion: 0.3 } }), forma('b', 300, 0, 100, 60, { forma: 'rombo' }), forma('c', 600, 0, 100, 60, { forma: 'trapecio', bloqueado: true }));
    expect(fijarParametro(e, ['a'], 'inclinacion', 0.3)).toBe(e);
    expect(fijarParametro(e, ['a'], 'cabeza', 0.5)).toBe(e);
    expect(fijarParametro(e, ['b'], 'inclinacion', 0.3)).toBe(e);
    expect(fijarParametro(e, ['c'], 'inclinacion', 0.4)).toBe(e);
    expect(fijarParametro(e, ['a'], 'inclinacion', Number.NaN)).toBe(e);
    expect(fijarParametro(e, ['nada'], 'inclinacion', 0.4)).toBe(e);
  });
  it('el radio solo vale para el rectángulo y va a estilo.radio', () => {
    const e = escena(forma('a', 0, 0, 160, 100), forma('b', 300, 0, 100, 60, { forma: 'rombo' }));
    const r = fijarParametro(e, ['a', 'b'], 'radio', 12);
    expect(f(r).estilo.radio).toBe(12);
    expect(f(r, 'b').estilo.radio).toBe(0);
  });
  it('el radio no cambia la escena si ya tiene ese valor, y se acota a la mitad del lado menor', () => {
    const e = escena(forma('a', 0, 0, 160, 100, { estilo: { radio: 12 } }));
    expect(fijarParametro(e, ['a'], 'radio', 12)).toBe(e);
    expect(f(fijarParametro(e, ['a'], 'radio', 9999)).estilo.radio).toBe(50);
  });
  it('aplica a todas las formas elegidas (también dentro de un grupo)', () => {
    const e = escena(forma('a', 0, 0, 160, 80, { forma: 'trapecio' }), forma('b', 300, 0, 160, 80, { forma: 'trapecio' }), grupo('g', ['a', 'b']));
    const r = fijarParametro(e, ['g'], 'inclinacion', 0.4);
    expect(f(r).parametros?.inclinacion).toBe(0.4);
    expect(f(r, 'b').parametros?.inclinacion).toBe(0.4);
  });
  it('los conectores pegados siguen a la forma (sus puertos se mueven con el parámetro)', () => {
    const e = escena(forma('a', 100, 100, 160, 80, { forma: 'trapecio' }), linea('l', [[600, 140], [260, 140]], { destino: { elementoId: 'a', puerto: 1 } }));
    const antes = (e.elementos[1] as { puntos: Array<{ x: number; y: number }> }).puntos.at(-1);
    const r = fijarParametro(e, ['a'], 'inclinacion', 0.45);
    const despues = (r.elementos[1] as { puntos: Array<{ x: number; y: number }> }).puntos.at(-1);
    expect(despues).not.toEqual(antes);
    const p = puntoDePuerto(f(r), 1);
    expect(despues?.x).toBeCloseTo(p.x, 1);
    expect(despues?.y).toBeCloseTo(p.y, 1);
  });
  it('el resultado pasa por el normalizador sin cambios', () => {
    const e = escena(forma('a', 0, 0, 160, 80, { forma: 'flecha-doble' }));
    const r = fijarParametro(e, ['a'], 'cuerpo', 0.7);
    expect(normalizarEscena(r)).toEqual(r);
  });
});

describe('rendimiento (DW9)', () => {
  it('un fotograma de arrastre con 500 conectores pegados tarda menos de 8 ms', () => {
    const lineas = Array.from({ length: 500 }, (_, i) => linea(`c${i}`, [[600, 50 + (i % 40) * 10], [260, 140]], { destino: { elementoId: 'a', puerto: 1 } }));
    const e = escena(forma('a', 100, 100, 160, 80, { forma: 'trapecio' }), ...lineas);
    const forma_ = f(e);
    const paso = (i: number): void => {
      const v = valorDeAsa(forma_, 'inclinacion', { x: 100 + (0.1 + (i % 30) * 0.01) * 160, y: 100 });
      fijarParametro(e, ['a'], 'inclinacion', v);
    };
    for (let i = 0; i < 6; i++) paso(i);
    const t: number[] = [];
    for (let i = 0; i < 15; i++) {
      const t0 = performance.now();
      paso(i);
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    expect(t[7]).toBeLessThan(8);
  });
});
