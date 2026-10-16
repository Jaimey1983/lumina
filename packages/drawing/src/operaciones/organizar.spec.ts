import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { cajaDeSeleccion } from './geometria.js';
import { agrupar, alinear, desagrupar, distribuir, reordenar } from './organizar.js';
import { escena, forma, getForma, getGrupo, grupo, ids, linea } from './util-pruebas.js';

const x = (e: ReturnType<typeof escena>, id: string): number => getForma(e, id).transformacion.x;
const y = (e: ReturnType<typeof escena>, id: string): number => getForma(e, id).transformacion.y;

describe('reordenar', () => {
  const base = escena(forma('a', 0, 0), forma('b', 0, 0), forma('c', 0, 0), forma('d', 0, 0));

  it('frente y fondo', () => {
    expect(ids(reordenar(base, ['b'], 'frente'))).toEqual(['a', 'c', 'd', 'b']);
    expect(ids(reordenar(base, ['c'], 'fondo'))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('subir y bajar de a un lugar', () => {
    expect(ids(reordenar(base, ['b'], 'subir'))).toEqual(['a', 'c', 'b', 'd']);
    expect(ids(reordenar(base, ['c'], 'bajar'))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('varios a la vez conservan su orden relativo', () => {
    expect(ids(reordenar(base, ['a', 'c'], 'frente'))).toEqual(['b', 'd', 'a', 'c']);
    expect(ids(reordenar(base, ['a', 'c'], 'subir'))).toEqual(['b', 'a', 'd', 'c']);
    expect(ids(reordenar(base, ['b', 'd'], 'bajar'))).toEqual(['b', 'a', 'd', 'c']);
  });

  it('lo que ya está arriba no sube más y devuelve la misma escena', () => {
    expect(reordenar(base, ['d'], 'subir')).toBe(base);
    expect(reordenar(base, ['d'], 'frente')).toBe(base);
    expect(reordenar(base, ['a'], 'bajar')).toBe(base);
    expect(reordenar(base, ['a'], 'fondo')).toBe(base);
    expect(reordenar(base, [], 'frente')).toBe(base);
  });

  it('subir con la selección pegada al tope no la pasa por encima de nada', () => {
    expect(ids(reordenar(base, ['c', 'd'], 'subir'))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('un grupo se mueve entero, aunque se pida por un hijo', () => {
    const e = escena(forma('a', 0, 0), forma('x', 0, 0), forma('b', 0, 0), forma('y', 0, 0), grupo('g', ['a', 'b']));
    expect(ids(reordenar(e, ['a'], 'frente')).filter((i) => i !== 'g')).toEqual(['x', 'y', 'a', 'b']);
    expect(ids(reordenar(e, ['g'], 'fondo')).filter((i) => i !== 'g').slice(0, 2)).toEqual(['a', 'b']);
  });

  it('el resultado sigue siendo una escena válida y conserva todos los elementos', () => {
    const r = reordenar(base, ['a', 'c'], 'frente');
    expect(normalizarEscena(r)).toEqual(r);
    expect([...ids(r)].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('alinear', () => {
  const base = escena(forma('a', 10, 10, 100, 50), forma('b', 200, 100, 60, 80), forma('c', 400, 300, 20, 20));

  it('izquierda / centro / derecha', () => {
    const izq = alinear(base, ['a', 'b', 'c'], 'izquierda');
    expect([x(izq, 'a'), x(izq, 'b'), x(izq, 'c')]).toEqual([10, 10, 10]);
    const der = alinear(base, ['a', 'b', 'c'], 'derecha');
    expect(x(der, 'a') + 100).toBe(420);
    expect(x(der, 'b') + 60).toBe(420);
    expect(x(der, 'c') + 20).toBe(420);
    const cen = alinear(base, ['a', 'b', 'c'], 'centro');
    expect(x(cen, 'a') + 50).toBeCloseTo(x(cen, 'b') + 30);
    expect(x(cen, 'c') + 10).toBeCloseTo(x(cen, 'b') + 30);
  });

  it('arriba / medio / abajo', () => {
    const arr = alinear(base, ['a', 'b', 'c'], 'arriba');
    expect([y(arr, 'a'), y(arr, 'b'), y(arr, 'c')]).toEqual([10, 10, 10]);
    const abj = alinear(base, ['a', 'b', 'c'], 'abajo');
    expect(y(abj, 'a') + 50).toBe(320);
    expect(y(abj, 'c') + 20).toBe(320);
    const med = alinear(base, ['a', 'b', 'c'], 'medio');
    expect(y(med, 'a') + 25).toBeCloseTo(y(med, 'b') + 40);
  });

  it('la caja total de la selección no cambia al alinear a un borde', () => {
    const antes = cajaDeSeleccion(base, ['a', 'b', 'c']);
    const despues = cajaDeSeleccion(alinear(base, ['a', 'b', 'c'], 'izquierda'), ['a', 'b', 'c']);
    expect(despues?.x).toBe(antes?.x);
    expect(despues?.y).toBe(antes?.y);
  });

  it('con un solo elemento no hace nada, salvo respecto de la escena', () => {
    expect(alinear(base, ['a'], 'izquierda')).toBe(base);
    const r = alinear(base, ['a'], 'centro', { respecto: 'escena' });
    expect(x(r, 'a') + 50).toBe(500);
    const s = alinear(base, ['a'], 'abajo', { respecto: 'escena' });
    expect(y(s, 'a') + 50).toBe(600);
  });

  it('un grupo se alinea como una unidad', () => {
    const e = escena(forma('a', 0, 0, 50, 50), forma('b', 100, 0, 50, 50), forma('c', 300, 200, 40, 40), grupo('g', ['a', 'b']));
    const r = alinear(e, ['g', 'c'], 'derecha');
    expect(cajaDeSeleccion(r, ['g'])).toMatchObject({ x: 190, ancho: 150 });
    expect(x(r, 'c') + 40).toBe(340);
  });

  it('los bloqueados no se mueven', () => {
    const e = escena(forma('a', 0, 0, 10, 10), forma('b', 50, 0, 10, 10, { bloqueado: true }), forma('c', 100, 0, 10, 10));
    const r = alinear(e, ['a', 'b', 'c'], 'derecha');
    expect(x(r, 'b')).toBe(50);
    expect(x(r, 'a')).toBe(100);
  });

  it('las líneas también se alinean', () => {
    const e = escena(forma('a', 0, 0, 50, 50), linea('l', [[100, 100], [200, 100]]));
    const r = alinear(e, ['a', 'l'], 'arriba');
    expect(cajaDeSeleccion(r, ['l'])?.y).toBe(0);
  });
});

describe('distribuir', () => {
  it('reparte con huecos iguales y deja fijos los extremos', () => {
    const e = escena(forma('a', 0, 0, 50, 50), forma('b', 60, 0, 50, 50), forma('c', 400, 0, 50, 50), forma('d', 100, 200, 50, 50));
    const r = distribuir(e, ['a', 'b', 'c'], 'horizontal');
    expect(x(r, 'a')).toBe(0);
    expect(x(r, 'c')).toBe(400);
    expect(x(r, 'b')).toBe(200); // (450 − 150) / 2 = hueco de 150 entre cajas de 50
    expect(x(r, 'b') - (x(r, 'a') + 50)).toBe(x(r, 'c') - (x(r, 'b') + 50));
    expect(r.elementos.find((el) => el.id === 'd')).toBe(e.elementos.find((el) => el.id === 'd'));
  });

  it('funciona en vertical y con medidas distintas', () => {
    const e = escena(forma('a', 0, 0, 50, 10), forma('b', 0, 30, 50, 100), forma('c', 0, 500, 50, 40));
    const r = distribuir(e, ['c', 'a', 'b'], 'vertical');
    const hueco1 = y(r, 'b') - (y(r, 'a') + 10);
    const hueco2 = y(r, 'c') - (y(r, 'b') + 100);
    expect(hueco1).toBeCloseTo(hueco2);
    expect(y(r, 'a')).toBe(0);
    expect(y(r, 'c')).toBe(500);
  });

  it('con menos de tres elementos no hace nada', () => {
    const e = escena(forma('a', 0, 0), forma('b', 300, 0));
    expect(distribuir(e, ['a', 'b'], 'horizontal')).toBe(e);
  });
});

describe('agrupar y desagrupar', () => {
  it('agrupa dos o más y el grupo queda delante del primero', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), forma('c', 0, 0));
    const r = agrupar(e, ['c', 'a']);
    expect(r.id).toBe('grupo-1');
    expect(getGrupo(r.escena, 'grupo-1').hijos).toEqual(['a', 'c']);
    expect(ids(r.escena)).toEqual(['grupo-1', 'a', 'b', 'c']);
    expect(normalizarEscena(r.escena)).toEqual(r.escena);
  });

  it('agrupar y desagrupar conserva las posiciones', () => {
    const e = escena(forma('a', 13, 7), forma('b', 99, 1), linea('l', [[0, 0], [5, 5]]));
    const g = agrupar(e, ['a', 'b', 'l']);
    const d = desagrupar(g.escena, [g.id]);
    expect(d.escena).toEqual(e);
    expect(d.ids).toEqual(['a', 'b', 'l']);
  });

  it('con menos de dos elementos no agrupa', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0));
    expect(agrupar(e, ['a'])).toEqual({ escena: e, id: '' });
    expect(agrupar(e, ['a', 'a'])).toEqual({ escena: e, id: '' });
    expect(agrupar(e, ['a', 'nada']).id).toBe('');
  });

  it('seleccionar dos hijos de un mismo grupo agrupa su grupo con nada más: no agrupa', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), grupo('g', ['a', 'b']));
    expect(agrupar(e, ['a', 'b']).id).toBe('');
  });

  it('grupos anidados: agrupar un grupo con otra forma', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), forma('c', 0, 0), grupo('g', ['a', 'b']));
    const r = agrupar(e, ['g', 'c']);
    expect(getGrupo(r.escena, r.id).hijos).toEqual(['c', 'g'].sort((p, q) => ids(e).indexOf(p) - ids(e).indexOf(q)));
    expect(normalizarEscena(r.escena)).toEqual(r.escena);
  });

  it('los bloqueados no entran en un grupo', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), forma('c', 0, 0, 10, 10, { bloqueado: true }));
    expect(getGrupo(agrupar(e, ['a', 'b', 'c']).escena, 'grupo-1').hijos).toEqual(['a', 'b']);
  });

  it('desagrupar un grupo anidado entrega sus hijos al grupo de afuera', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), forma('c', 0, 0), grupo('g', ['a', 'b']), grupo('h', ['g', 'c']));
    const r = desagrupar(e, ['g']);
    expect(getGrupo(r.escena, 'h').hijos).toEqual(['a', 'b', 'c']);
    expect(normalizarEscena(r.escena)).toEqual(r.escena);
  });

  it('desagrupar algo que no es un grupo no hace nada', () => {
    const e = escena(forma('a', 0, 0));
    expect(desagrupar(e, ['a'])).toEqual({ escena: e, ids: [] });
  });
});
