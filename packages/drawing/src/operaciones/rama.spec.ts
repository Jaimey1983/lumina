import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import { eliminarRama } from './rama.js';
import { escena, forma, getForma, linea } from './util-pruebas.js';

function cadena(e: ReturnType<typeof escena>, ids: string[]): ReturnType<typeof escena> {
  let actual = e;
  for (let i = 0; i < ids.length - 1; i++) actual = conectarFormas(actual, ids[i]!, ids[i + 1]!);
  return actual;
}

describe('eliminarRama', () => {
  it('borra la raíz y descendientes sin tocar ramas hermanas', () => {
    const e0 = escena(forma('P', 0, 0), forma('B', 200, 0), forma('C', 200, 120), forma('H', 400, 0));
    const e1 = cadena(cadena(e0, ['P', 'B']), ['P', 'C']);
    const e2 = cadena(e1, ['B', 'H']);
    const e3 = eliminarRama(e2, 'B');
    expect(e3.elementos.some((x) => x.id === 'B' || x.id === 'H')).toBe(false);
    expect(e3.elementos.some((x) => x.id === 'P')).toBe(true);
    expect(e3.elementos.some((x) => x.id === 'C')).toBe(true);
  });

  it('una forma que también cuelga de otra rama se queda, y con ella lo que solo cuelga de ella', () => {
    // A → C → D y X → C: al borrar A se va solo A; C y D siguen colgando de X.
    const e0 = escena(forma('A', 0, 0), forma('X', 0, 200), forma('C', 300, 100), forma('D', 500, 100));
    const e1 = conectarFormas(conectarFormas(conectarFormas(e0, 'A', 'C'), 'X', 'C'), 'C', 'D');
    const ids = eliminarRama(e1, 'A').elementos.filter((x) => x.tipo === 'forma').map((x) => x.id);
    expect(ids).toEqual(['X', 'C', 'D']);
    // Los conectores entre lo que queda siguen pegados a sus extremos.
    const pegadas = eliminarRama(e1, 'A').elementos.filter((x) => x.tipo === 'linea' && x.origen && x.destino);
    expect(pegadas).toHaveLength(2);
  });

  it('salvar una forma puede obligar a salvar otra ya revisada (cascada en varias pasadas)', () => {
    // Líneas A→D, A→C, X→C, C→D: D se revisa antes que C; al salvarse C, D pasa a colgar de ella y también se queda.
    const e0 = escena(forma('A', 0, 0), forma('X', 0, 300), forma('C', 300, 150), forma('D', 600, 150));
    const e1 = conectarFormas(conectarFormas(conectarFormas(conectarFormas(e0, 'A', 'D'), 'A', 'C'), 'X', 'C'), 'C', 'D');
    const ids = eliminarRama(e1, 'A').elementos.filter((x) => x.tipo === 'forma').map((x) => x.id);
    expect(ids).toEqual(['X', 'C', 'D']);
  });

  it('un ciclo dentro de la rama se borra entero, pero uno con entrada desde fuera se queda', () => {
    const e0 = escena(forma('A', 0, 0), forma('B', 200, 0), forma('C', 400, 0), forma('X', 200, 200));
    const base = conectarFormas(conectarFormas(conectarFormas(e0, 'A', 'B'), 'B', 'C'), 'C', 'B');
    expect(eliminarRama(base, 'A').elementos.filter((x) => x.tipo === 'forma').map((x) => x.id)).toEqual(['X']);
    const conEntrada = conectarFormas(base, 'X', 'B');
    expect(eliminarRama(conEntrada, 'A').elementos.filter((x) => x.tipo === 'forma').map((x) => x.id)).toEqual(['B', 'C', 'X']);
  });

  it('una forma colgada también de una bloqueada se queda', () => {
    const e0 = escena(forma('A', 0, 0), forma('L', 0, 200, 100, 60, { bloqueado: true }), forma('C', 300, 100));
    const e1 = conectarFormas(conectarFormas(e0, 'A', 'C'), 'L', 'C');
    expect(eliminarRama(e1, 'A').elementos.some((x) => x.id === 'C')).toBe(true);
  });

  it('con un ciclo no se cuelga y borra todo el ciclo alcanzable', () => {
    const e0 = escena(forma('A', 0, 0), forma('B', 200, 0), forma('C', 400, 0));
    let e = cadena(e0, ['A', 'B']);
    e = cadena(e, ['B', 'C']);
    e = conectarFormas(e, 'C', 'B');
    const e1 = eliminarRama(e, 'A');
    expect(e1.elementos.filter((x) => x.tipo === 'forma')).toHaveLength(0);
  });

  it('no borra formas bloqueadas ni la raíz bloqueada', () => {
    const e0 = escena(forma('P', 0, 0), forma('H', 200, 0, 100, 60, { bloqueado: true }));
    const e1 = conectarFormas(e0, 'P', 'H');
    expect(eliminarRama(e1, 'H')).toBe(e1);
    const e2 = escena(forma('P', 0, 0, 100, 60, { bloqueado: true }), forma('H', 200, 0));
    const e3 = conectarFormas(e2, 'P', 'H');
    expect(eliminarRama(e3, 'P')).toBe(e3);
    expect(getForma(e3, 'P').bloqueado).toBe(true);
  });

  it('raíz que no es forma no cambia nada', () => {
    const e = escena(linea('L', [[0, 0], [10, 10]]));
    expect(eliminarRama(e, 'L')).toBe(e);
  });
});
