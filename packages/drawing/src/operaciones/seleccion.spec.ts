import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import type { Escena } from '../tipos.js';
import { elementosEnPoligono, invertirSeleccion, puntoEnPoligono, seleccionarIguales, seleccionarPorTipo, seleccionarRama, unidadesElegibles } from './seleccion.js';
import { escena, forma, grupo, linea, texto } from './util-pruebas.js';

const rojo = { relleno: { tipo: 'solido', color: '#FF0000' } };
const azul = { relleno: { tipo: 'solido', color: '#0000FF' } };

const mixta = (): Escena => escena(forma('f1', 0, 0), forma('f2', 200, 0), texto('t1', 0, 200), linea('l1', [[0, 300], [100, 300]]), forma('f3', 300, 300));

describe('unidadesElegibles', () => {
  it('deja fuera lo bloqueado, lo oculto y los hijos de un grupo; el grupo cuenta como una unidad', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 100, 100, 60, { bloqueado: true }), forma('c', 0, 200, 100, 60, { oculto: true }), forma('g1', 300, 0), forma('g2', 300, 100), grupo('G', ['g1', 'g2']));
    expect(unidadesElegibles(e).map((x) => x.id)).toEqual(['a', 'G']);
  });
  it('un grupo bloqueado o con hijos ocultos por el grupo no se elige', () => {
    const e = escena(forma('g1', 0, 0), forma('g2', 0, 100), grupo('G', ['g1', 'g2'], { oculto: true }), forma('h1', 300, 0), forma('h2', 300, 100), grupo('H', ['h1', 'h2'], { bloqueado: true }));
    expect(unidadesElegibles(e)).toEqual([]);
  });
});

describe('seleccionarPorTipo', () => {
  it('formas, conectores y textos, en orden de apilado', () => {
    const e = mixta();
    expect(seleccionarPorTipo(e, 'forma')).toEqual(['f1', 'f2', 'f3']);
    expect(seleccionarPorTipo(e, 'linea')).toEqual(['l1']);
    expect(seleccionarPorTipo(e, 'texto')).toEqual(['t1']);
  });
  it('excluye bloqueados y ocultos', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 100, 100, 60, { bloqueado: true }), forma('c', 0, 200, 100, 60, { oculto: true }));
    expect(seleccionarPorTipo(e, 'forma')).toEqual(['a']);
  });
  it('un grupo entra como unidad si alguna de sus hojas es del tipo, y sus hijos no entran sueltos', () => {
    const e = escena(forma('f', 0, 0), texto('t', 0, 100), grupo('G', ['f', 't']), texto('t2', 300, 0));
    expect(seleccionarPorTipo(e, 'forma')).toEqual(['G']);
    expect(seleccionarPorTipo(e, 'texto')).toEqual(['G', 't2']);
    expect(seleccionarPorTipo(e, 'linea')).toEqual([]);
  });
  it('sin nada del tipo: vacío', () => {
    expect(seleccionarPorTipo(escena(forma('a', 0, 0)), 'texto')).toEqual([]);
  });
});

describe('seleccionarIguales', () => {
  const e = escena(
    forma('a', 0, 0, 100, 60, { estilo: rojo }),
    forma('b', 200, 0, 50, 50, { estilo: rojo }), // otro tamaño: sigue siendo igual
    forma('c', 400, 0, 100, 60, { estilo: azul }),
    forma('d', 0, 200, 100, 60, { forma: 'elipse', estilo: rojo }),
    forma('e', 200, 200, 100, 60, { estilo: { ...rojo, contorno: { color: '#00FF00', grosor: 4 } } }),
    forma('f', 400, 200, 100, 60, { estilo: rojo, bloqueado: true }),
    forma('g', 600, 200, 100, 60, { estilo: rojo, oculto: true }),
  );
  it('mismo tipo de forma, relleno y contorno: ni otra forma, ni otro relleno, ni otro contorno', () => {
    expect(seleccionarIguales(e, ['a'])).toEqual(['a', 'b']);
  });
  it('con varias elegidas suma los de cada una', () => {
    expect(seleccionarIguales(e, ['a', 'c'])).toEqual(['a', 'b', 'c']);
  });
  it('no toca bloqueados ni ocultos', () => {
    expect(seleccionarIguales(e, ['a'])).not.toContain('f');
    expect(seleccionarIguales(e, ['a'])).not.toContain('g');
  });
  it('sin una forma elegida (nada, un texto, un conector) no hay con qué comparar', () => {
    const m = mixta();
    expect(seleccionarIguales(m, [])).toEqual([]);
    expect(seleccionarIguales(m, ['t1'])).toEqual([]);
    expect(seleccionarIguales(m, ['l1'])).toEqual([]);
  });
  it('un grupo elegido compara con las formas de adentro', () => {
    const g = escena(forma('x', 0, 0, 100, 60, { estilo: rojo }), forma('y', 0, 100, 100, 60, { estilo: azul }), grupo('G', ['x', 'y']), forma('z', 300, 0, 100, 60, { estilo: azul }));
    expect(seleccionarIguales(g, ['G'])).toEqual(['z']);
  });
});

describe('invertirSeleccion', () => {
  it('devuelve lo elegible que no estaba elegido', () => {
    expect(invertirSeleccion(mixta(), ['f1', 't1'])).toEqual(['f2', 'l1', 'f3']);
  });
  it('sin nada elegido, todo lo elegible; con todo elegido, nada', () => {
    const e = mixta();
    expect(invertirSeleccion(e, [])).toEqual(['f1', 'f2', 't1', 'l1', 'f3']);
    expect(invertirSeleccion(e, ['f1', 'f2', 't1', 'l1', 'f3'])).toEqual([]);
  });
  it('invertir dos veces es la identidad', () => {
    const e = mixta();
    for (const s of [[], ['f1'], ['f2', 'l1'], ['f1', 'f2', 't1', 'l1', 'f3']]) {
      expect(invertirSeleccion(e, invertirSeleccion(e, s))).toEqual(s);
    }
  });
  it('excluye bloqueados y ocultos, y ni siquiera aparecen al invertir', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 100, 100, 60, { bloqueado: true }), forma('c', 0, 200, 100, 60, { oculto: true }), forma('d', 0, 300));
    expect(invertirSeleccion(e, ['a'])).toEqual(['d']);
  });
  it('los grupos se tratan como unidad', () => {
    const e = escena(forma('g1', 0, 0), forma('g2', 0, 100), grupo('G', ['g1', 'g2']), forma('s', 300, 0));
    expect(invertirSeleccion(e, ['s'])).toEqual(['G']);
  });
});

describe('seleccionarRama', () => {
  const arbol = (): Escena => {
    let e = escena(forma('P', 0, 0), forma('B', 200, 0), forma('C', 200, 120), forma('H', 400, 0), forma('suelta', 0, 400));
    e = conectarFormas(e, 'P', 'B');
    e = conectarFormas(e, 'P', 'C');
    return conectarFormas(e, 'B', 'H');
  };
  const conectores = (e: Escena): string[] => e.elementos.filter((x) => x.tipo === 'linea').map((x) => x.id);

  it('la forma, lo que cuelga de ella y los conectores de adentro; no sus hermanas ni su padre', () => {
    const e = arbol();
    const r = seleccionarRama(e, 'B');
    expect(r.filter((id) => e.elementos.find((x) => x.id === id)?.tipo === 'forma')).toEqual(['B', 'H']);
    const dentro = e.elementos.filter((x) => x.tipo === 'linea' && x.origen?.elementoId === 'B').map((x) => x.id);
    for (const id of dentro) expect(r).toContain(id);
    // El conector que baja del padre hacia la raíz de la rama no es de la rama.
    const delPadre = e.elementos.filter((x) => x.tipo === 'linea' && x.destino?.elementoId === 'B').map((x) => x.id);
    for (const id of delPadre) expect(r).not.toContain(id);
    expect(r).toHaveLength(3);
  });
  it('desde la raíz del árbol: todo el árbol y ninguna suelta', () => {
    const e = arbol();
    const r = seleccionarRama(e, 'P');
    expect(r).toEqual(expect.arrayContaining(['P', 'B', 'C', 'H', ...conectores(e)]));
    expect(r).not.toContain('suelta');
  });
  it('una hoja es solo ella', () => {
    expect(seleccionarRama(arbol(), 'H')).toEqual(['H']);
  });
  it('coincide con lo que borra «Borrar rama»: una forma con otro padre fuera de la rama se queda fuera', () => {
    let e = escena(forma('A', 0, 0), forma('X', 0, 200), forma('C', 300, 100), forma('D', 500, 100));
    e = conectarFormas(conectarFormas(conectarFormas(e, 'A', 'C'), 'X', 'C'), 'C', 'D');
    expect(seleccionarRama(e, 'A')).toEqual(['A']);
  });
  it('con un ciclo no se cuelga', () => {
    let e = escena(forma('A', 0, 0), forma('B', 200, 0));
    e = conectarFormas(conectarFormas(e, 'A', 'B'), 'B', 'A');
    expect(seleccionarRama(e, 'A').filter((id) => id === 'A' || id === 'B').sort()).toEqual(['A', 'B']);
  });
  it('no vale una raíz bloqueada, oculta, inexistente o que no es forma; los bloqueados de la rama no entran', () => {
    const e = escena(forma('a', 0, 0, 100, 60, { bloqueado: true }), forma('b', 300, 0), texto('t', 0, 200));
    const c = conectarFormas(e, 'a', 'b');
    expect(seleccionarRama(c, 'a')).toEqual([]);
    expect(seleccionarRama(c, 'nada')).toEqual([]);
    expect(seleccionarRama(c, 't')).toEqual([]);
    const o = conectarFormas(escena(forma('a', 0, 0, 100, 60, { oculto: true }), forma('b', 300, 0)), 'a', 'b');
    expect(seleccionarRama(o, 'a')).toEqual([]);
    const h = conectarFormas(escena(forma('a', 0, 0), forma('b', 300, 0, 100, 60, { bloqueado: true })), 'a', 'b');
    expect(seleccionarRama(h, 'a').filter((id) => id === 'b')).toEqual([]);
  });
  it('una forma dentro de un grupo se elige como su grupo', () => {
    let e = escena(forma('a', 0, 0), forma('b', 300, 0), forma('b2', 300, 100), grupo('G', ['b', 'b2']));
    e = conectarFormas(e, 'a', 'b');
    const r = seleccionarRama(e, 'a');
    expect(r).toContain('G');
    expect(r).not.toContain('b');
  });
});

describe('puntoEnPoligono y elementosEnPoligono', () => {
  const cuadrado = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  it('puntoEnPoligono: dentro y fuera', () => {
    expect(puntoEnPoligono({ x: 50, y: 50 }, cuadrado)).toBe(true);
    expect(puntoEnPoligono({ x: 150, y: 50 }, cuadrado)).toBe(false);
  });

  // Centros en (50,50), (250,50), (50,250), (250,250).
  const rejilla = (): Escena => escena(forma('a', 0, 0, 100, 100), forma('b', 200, 0, 100, 100), forma('c', 0, 200, 100, 100), forma('d', 200, 200, 100, 100));
  it('elige lo que tiene el CENTRO dentro, no lo que solo se toca', () => {
    const e = rejilla();
    // Cubre toda la forma «a» y solo el borde de «b» (que llega a x=200).
    expect(elementosEnPoligono(e, [{ x: -10, y: -10 }, { x: 210, y: -10 }, { x: 210, y: 110 }, { x: -10, y: 110 }])).toEqual(['a']);
    // Toca poco de «a» pero contiene su centro.
    expect(elementosEnPoligono(e, [{ x: 40, y: 40 }, { x: 60, y: 40 }, { x: 60, y: 60 }, { x: 40, y: 60 }])).toEqual(['a']);
  });
  it('un lazo cóncavo no elige lo que cae en la muesca', () => {
    const e = rejilla();
    // Una «C» que abarca el cuadrante izquierdo y el derecho de arriba pero deja el centro de «b» en la muesca.
    const c = [{ x: -20, y: -20 }, { x: 320, y: -20 }, { x: 320, y: 120 }, { x: 200, y: 120 }, { x: 200, y: 20 }, { x: 300, y: 20 }, { x: 300, y: 80 }, { x: 100, y: 80 }, { x: 100, y: 120 }, { x: -20, y: 120 }];
    expect(puntoEnPoligono({ x: 250, y: 50 }, c)).toBe(false);
    expect(elementosEnPoligono(e, c)).toEqual(['a']);
  });
  it('un lazo que se cruza a sí mismo usa la regla par-impar', () => {
    // Moño: se cruza en (60,60) y deja dos lóbulos, el izquierdo y el derecho; arriba y abajo queda hueco.
    const mono = [{ x: 0, y: 0 }, { x: 120, y: 120 }, { x: 120, y: 0 }, { x: 0, y: 120 }];
    expect(puntoEnPoligono({ x: 100, y: 60 }, mono)).toBe(true);
    expect(puntoEnPoligono({ x: 20, y: 60 }, mono)).toBe(true);
    expect(puntoEnPoligono({ x: 60, y: 20 }, mono)).toBe(false);
    expect(puntoEnPoligono({ x: 60, y: 100 }, mono)).toBe(false);
    // Con formas de centro en cada lugar.
    const e = escena(forma('izq', -10, 40, 40, 40), forma('der', 80, 40, 40, 40), forma('arriba', 40, 0, 40, 40), forma('abajo', 40, 80, 40, 40));
    expect(elementosEnPoligono(e, mono)).toEqual(['izq', 'der']);
  });
  it('con menos de 3 puntos no elige nada', () => {
    const e = rejilla();
    expect(elementosEnPoligono(e, [])).toEqual([]);
    expect(elementosEnPoligono(e, [{ x: 50, y: 50 }])).toEqual([]);
    expect(elementosEnPoligono(e, [{ x: 50, y: 50 }, { x: 60, y: 60 }])).toEqual([]);
  });
  it('excluye bloqueados y ocultos; un grupo es una unidad', () => {
    const e = escena(forma('a', 0, 0, 100, 100, { bloqueado: true }), forma('b', 0, 200, 100, 100, { oculto: true }), forma('g1', 200, 0, 100, 100), forma('g2', 200, 200, 100, 100), grupo('G', ['g1', 'g2']));
    const todo = [{ x: -10, y: -10 }, { x: 400, y: -10 }, { x: 400, y: 400 }, { x: -10, y: 400 }];
    expect(elementosEnPoligono(e, todo)).toEqual(['G']);
  });
  it('un conector entra por el centro de su caja', () => {
    const e = escena(linea('l', [[0, 0], [100, 0]]), forma('a', 500, 500));
    expect(elementosEnPoligono(e, [{ x: 40, y: -10 }, { x: 60, y: -10 }, { x: 60, y: 10 }, { x: 40, y: 10 }])).toEqual(['l']);
  });
});
