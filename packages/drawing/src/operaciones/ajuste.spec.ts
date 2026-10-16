import { describe, expect, it } from 'vitest';
import { ajustar, ajustarCaja } from './ajuste.js';
import { escena, forma } from './util-pruebas.js';

describe('ajustarCaja a otros elementos', () => {
  const e = escena(forma('ref', 200, 100, 100, 100));

  it('imanta el borde izquierdo al borde izquierdo de otro y muestra la guía', () => {
    const r = ajustarCaja({ x: 203, y: 400, ancho: 50, alto: 50 }, e);
    expect(r.dx).toBe(-3);
    expect(r.dy).toBe(0);
    expect(r.guias).toContainEqual({ orientacion: 'vertical', posicion: 200, desde: 100, hasta: 450 });
  });

  it('imanta centro con centro', () => {
    const r = ajustarCaja({ x: 227, y: 400, ancho: 50, alto: 50 }, e);
    // centro de la caja = 252; centro de ref = 250
    expect(r.dx).toBe(-2);
    expect(r.guias.some((g) => g.orientacion === 'vertical' && g.posicion === 250)).toBe(true);
  });

  it('imanta en vertical (el borde de abajo con el de arriba de otro)', () => {
    const r = ajustarCaja({ x: 600, y: 54, ancho: 50, alto: 50 }, e);
    expect(r.dy).toBe(-4);
    expect(r.guias.some((g) => g.orientacion === 'horizontal' && g.posicion === 100)).toBe(true);
  });

  it('puede imantar en los dos ejes a la vez', () => {
    const r = ajustarCaja({ x: 305, y: 197, ancho: 40, alto: 40 }, e);
    expect(r).toMatchObject({ dx: -5, dy: 3 });
    expect(r.guias).toHaveLength(2);
  });

  it('fuera del umbral no corrige ni muestra guías', () => {
    const r = ajustarCaja({ x: 100, y: 450, ancho: 30, alto: 30 }, e);
    expect(r).toEqual({ dx: 0, dy: 0, guias: [] });
  });

  it('el umbral es configurable', () => {
    expect(ajustarCaja({ x: 210, y: 450, ancho: 30, alto: 30 }, e, { umbral: 3 }).dx).toBe(0);
    expect(ajustarCaja({ x: 210, y: 450, ancho: 30, alto: 30 }, e, { umbral: 12 }).dx).toBe(-10);
  });

  it('no usa de referencia a lo que se está moviendo', () => {
    const r = ajustarCaja({ x: 203, y: 400, ancho: 50, alto: 50 }, e, { excluir: ['ref'] });
    expect(r.dx).toBe(0);
  });

  it('no usa de referencia a lo oculto', () => {
    const o = escena(forma('ref', 200, 100, 100, 100, { oculto: true }));
    expect(ajustarCaja({ x: 203, y: 400, ancho: 50, alto: 50 }, o).dx).toBe(0);
  });

  it('también imanta a los bordes y al centro de la escena', () => {
    const vacia = escena();
    expect(ajustarCaja({ x: 4, y: 300, ancho: 50, alto: 50 }, vacia).dx).toBe(-4);
    expect(ajustarCaja({ x: 500 - 25 + 3, y: 300, ancho: 50, alto: 50 }, vacia).dx).toBe(-3); // centro de la escena (1000 / 2)
  });

  it('con guías desactivadas ignora a los elementos y a la escena', () => {
    expect(ajustarCaja({ x: 203, y: 4, ancho: 50, alto: 50 }, e, { guias: false })).toEqual({ dx: 0, dy: 0, guias: [] });
  });

  it('elige la corrección más chica cuando hay varias', () => {
    const dos = escena(forma('a', 200, 100, 50, 50), forma('b', 206, 300, 50, 50));
    expect(ajustarCaja({ x: 207, y: 450, ancho: 20, alto: 20 }, dos).dx).toBe(-1);
  });
});

describe('ajustarCaja a la cuadrícula', () => {
  const vacia = escena();

  it('lleva la esquina a la intersección más cercana', () => {
    expect(ajustarCaja({ x: 47, y: 103, ancho: 30, alto: 30 }, vacia, { cuadricula: 20, guias: false })).toEqual({ dx: -7, dy: -3, guias: [] });
    expect(ajustarCaja({ x: 54, y: 100, ancho: 30, alto: 30 }, vacia, { cuadricula: 20, guias: false })).toEqual({ dx: 6, dy: 0, guias: [] });
  });

  it('ya sobre la cuadrícula no corrige', () => {
    expect(ajustarCaja({ x: 40, y: 100, ancho: 30, alto: 30 }, vacia, { cuadricula: 20, guias: false })).toEqual({ dx: 0, dy: 0, guias: [] });
  });

  it('una guía tiene prioridad sobre la cuadrícula en ese eje', () => {
    const e = escena(forma('ref', 203, 0, 50, 50));
    const r = ajustarCaja({ x: 201, y: 400, ancho: 30, alto: 30 }, e, { cuadricula: 20 });
    expect(r.dx).toBe(2); // a la guía en 203, no a la cuadrícula en 200
  });

  it('una cuadrícula inválida se ignora', () => {
    expect(ajustarCaja({ x: 47, y: 103, ancho: 30, alto: 30 }, vacia, { cuadricula: 0, guias: false }).dx).toBe(0);
    expect(ajustarCaja({ x: 47, y: 103, ancho: 30, alto: 30 }, vacia, { cuadricula: -5, guias: false }).dx).toBe(0);
  });
});

describe('ajustar un punto', () => {
  it('a la cuadrícula', () => {
    expect(ajustar({ x: 38, y: 61 }, escena(), { cuadricula: 20, guias: false }).punto).toEqual({ x: 40, y: 60 });
  });

  it('al borde de otro elemento, con su guía', () => {
    const e = escena(forma('ref', 200, 100, 100, 100));
    const r = ajustar({ x: 297, y: 500 }, e);
    expect(r.punto).toEqual({ x: 300, y: 500 });
    expect(r.guias.some((g) => g.orientacion === 'vertical' && g.posicion === 300)).toBe(true);
  });

  it('un punto lejos de todo queda igual', () => {
    expect(ajustar({ x: 123, y: 456 }, escena(forma('r', 800, 10, 10, 10)))).toEqual({ punto: { x: 123, y: 456 }, guias: [] });
  });
});
