import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { actualizar, agregar, bloquear, cambiarEstilo, duplicar, eliminar, ocultar } from './edicion.js';
import { escena, forma, get, getForma, getGrupo, getLinea, getTexto, grupo, ids, linea, texto } from './util-pruebas.js';

describe('agregar', () => {
  it('agrega una forma incompleta y el normalizador la completa', () => {
    const e = escena(forma('a', 0, 0));
    const r = agregar(e, { tipo: 'forma', forma: 'rombo', transformacion: { x: 10, y: 10, ancho: 80, alto: 80 } });
    expect(r.id).toBe('forma-1');
    expect(ids(r.escena)).toEqual(['a', 'forma-1']);
    expect(getForma(r.escena, 'forma-1').forma).toBe('rombo');
    expect(getForma(r.escena, 'forma-1').estilo.contorno.grosor).toBeGreaterThan(0);
  });

  it('respeta el id pedido si está libre y asigna otro si ya existe', () => {
    const e = escena(forma('a', 0, 0));
    expect(agregar(e, { tipo: 'forma', id: 'mia' }).id).toBe('mia');
    const r = agregar(e, { tipo: 'forma', id: 'a' });
    expect(r.id).not.toBe('a');
    expect(ids(r.escena)).toHaveLength(2);
  });

  it('inserta en el índice pedido (acotado al rango)', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0));
    expect(ids(agregar(e, { tipo: 'texto', id: 't' }, { indice: 1 }).escena)).toEqual(['a', 't', 'b']);
    expect(ids(agregar(e, { tipo: 'texto', id: 't' }, { indice: -5 }).escena)).toEqual(['t', 'a', 'b']);
    expect(ids(agregar(e, { tipo: 'texto', id: 't' }, { indice: 99 }).escena)).toEqual(['a', 'b', 't']);
  });

  it('una línea sin puntos suficientes se descarta y la escena no cambia', () => {
    const e = escena(forma('a', 0, 0));
    const r = agregar(e, { tipo: 'linea', puntos: [{ x: 0, y: 0 }] });
    expect(r.id).toBe('');
    expect(r.escena).toBe(e);
  });

  it('no deja pasar valores inválidos (color con url)', () => {
    const r = agregar(escena(), { tipo: 'forma', id: 'x', estilo: { relleno: { tipo: 'solido', color: 'url(#x)' } } });
    expect(getForma(r.escena, 'x').estilo.relleno).not.toEqual({ tipo: 'solido', color: 'url(#x)' });
  });

  it('no muta la escena original', () => {
    const e = escena(forma('a', 0, 0));
    const antes = JSON.stringify(e);
    agregar(e, { tipo: 'forma' });
    expect(JSON.stringify(e)).toBe(antes);
  });
});

describe('eliminar', () => {
  it('quita los elementos pedidos', () => {
    const r = eliminar(escena(forma('a', 0, 0), forma('b', 0, 0)), ['a']);
    expect(ids(r)).toEqual(['b']);
  });

  it('borrar un grupo borra a sus hijos', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), forma('c', 0, 0), grupo('g', ['a', 'b']));
    expect(ids(eliminar(e, ['g']))).toEqual(['c']);
  });

  it('borrar un hijo de un grupo de dos disuelve el grupo', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), grupo('g', ['a', 'b']));
    expect(ids(eliminar(e, ['a']))).toEqual(['b']);
  });

  it('las líneas conectadas a una forma borrada pierden la conexión pero no desaparecen', () => {
    const e = escena(forma('f', 0, 0), linea('l', [[0, 0], [50, 50]], { origen: { elementoId: 'f', puerto: 1 } }));
    const r = eliminar(e, ['f']);
    expect(ids(r)).toEqual(['l']);
    expect(getLinea(r, 'l').origen).toBeUndefined();
  });

  it('los bloqueados se conservan', () => {
    const e = escena(forma('a', 0, 0, 10, 10, { bloqueado: true }), forma('b', 0, 0));
    expect(ids(eliminar(e, ['a', 'b']))).toEqual(['a']);
  });

  it('un grupo que conserva un hijo bloqueado se conserva', () => {
    const e = escena(forma('a', 0, 0, 10, 10, { bloqueado: true }), forma('b', 0, 0), forma('c', 0, 0), grupo('g', ['a', 'b', 'c']));
    const r = eliminar(e, ['g']);
    expect(ids(r)).toContain('a');
    expect(ids(r)).not.toContain('b');
  });

  it('ids inexistentes o lista vacía: la misma escena', () => {
    const e = escena(forma('a', 0, 0));
    expect(eliminar(e, [])).toBe(e);
    expect(eliminar(e, ['nada'])).toBe(e);
  });
});

describe('actualizar', () => {
  it('cambia la forma de una forma sin perder el resto', () => {
    const e = escena(forma('a', 5, 6, 100, 50, { texto: 'Hola' }));
    const r = actualizar(e, ['a'], { forma: 'rombo' });
    expect(getForma(r, 'a')).toMatchObject({ forma: 'rombo', texto: 'Hola' });
    expect(getForma(r, 'a').transformacion).toMatchObject({ x: 5, y: 6, ancho: 100, alto: 50 });
  });

  it('cambia el tipo de trazado y los extremos de una línea', () => {
    const e = escena(linea('l', [[0, 0], [100, 100]]));
    expect(getLinea(actualizar(e, ['l'], { trazado: 'curvo', fin: 'rombo' }), 'l')).toMatchObject({ trazado: 'curvo', fin: 'rombo' });
  });

  it('un valor inválido cae al de por defecto, no entra', () => {
    const e = escena(forma('a', 0, 0));
    expect(getForma(actualizar(e, ['a'], { forma: 'dragon' }), 'a').forma).toBe('rectangulo');
  });

  it('no deja cambiar el tipo, el id ni los hijos', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), grupo('g', ['a', 'b']));
    expect(actualizar(e, ['a'], { tipo: 'texto', id: 'zzz' })).toBe(e);
    expect(actualizar(e, ['g'], { hijos: [] })).toBe(e);
  });

  it('ignora propiedades que el elemento no tiene (trazado en una forma)', () => {
    const e = escena(forma('a', 0, 0));
    expect(getForma(actualizar(e, ['a'], { trazado: 'curvo' }), 'a')).not.toHaveProperty('trazado');
  });

  it('los bloqueados no se editan, salvo para desbloquearlos', () => {
    const e = escena(forma('a', 0, 0, 10, 10, { bloqueado: true }));
    expect(actualizar(e, ['a'], { forma: 'rombo' })).toBe(e);
    expect(getForma(actualizar(e, ['a'], { bloqueado: false }), 'a').bloqueado).toBe(false);
  });

  it('edita el texto de un texto y de una forma', () => {
    const e = escena(texto('t', 0, 0), forma('f', 0, 0));
    const r = actualizar(e, ['t', 'f'], { texto: 'Nuevo' });
    expect(getTexto(r, 't').texto).toBe('Nuevo');
    expect(getForma(r, 'f').texto).toBe('Nuevo');
  });
});

describe('bloquear y ocultar', () => {
  it('marcan y desmarcan', () => {
    const e = escena(forma('a', 0, 0));
    const b = bloquear(e, ['a']);
    expect(getForma(b, 'a').bloqueado).toBe(true);
    expect(getForma(bloquear(b, ['a'], false), 'a').bloqueado).toBe(false);
    expect(getForma(ocultar(e, ['a']), 'a').oculto).toBe(true);
  });

  it('bloquear un grupo lo marca a él (sus hijos quedan bloqueados por efecto)', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), grupo('g', ['a', 'b']));
    const r = bloquear(e, ['g']);
    expect(getGrupo(r, 'g').bloqueado).toBe(true);
    expect(getForma(r, 'a').bloqueado).toBe(false);
  });
});

describe('cambiarEstilo', () => {
  it('reemplaza el relleno y mezcla el contorno', () => {
    const e = escena(forma('a', 0, 0));
    const r = cambiarEstilo(e, ['a'], { estilo: { relleno: { tipo: 'solido', color: '#ff0000' }, contorno: { grosor: 6 } } });
    const est = getForma(r, 'a').estilo;
    expect(est.relleno).toEqual({ tipo: 'solido', color: '#ff0000' });
    expect(est.contorno.grosor).toBe(6);
    expect(est.contorno.color).toBe(getForma(e, 'a').estilo.contorno.color);
  });

  it('aplica a los hijos de un grupo y no a los bloqueados', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0, 10, 10, { bloqueado: true }), forma('c', 0, 0), grupo('g', ['a', 'c']));
    const r = cambiarEstilo(e, ['g', 'b'], { estilo: { opacidad: 0.5 } });
    expect(getForma(r, 'a').estilo.opacidad).toBe(0.5);
    expect(getForma(r, 'c').estilo.opacidad).toBe(0.5);
    expect(getForma(r, 'b').estilo.opacidad).toBe(1);
  });

  it('cambia el estilo del texto', () => {
    const e = escena(texto('t', 0, 0));
    const r = cambiarEstilo(e, ['t'], { estiloTexto: { negrita: true, tamano: 30 } });
    expect(getTexto(r, 't').estiloTexto).toMatchObject({ negrita: true, tamano: 30 });
  });

  it('una sombra se agrega y se quita con null', () => {
    const e = escena(forma('a', 0, 0));
    const con = cambiarEstilo(e, ['a'], { estilo: { sombra: { color: '#00000055', desenfoque: 8, dx: 2, dy: 3 } } });
    expect(getForma(con, 'a').estilo.sombra).toMatchObject({ desenfoque: 8, dx: 2, dy: 3 });
    expect(getForma(cambiarEstilo(con, ['a'], { estilo: { sombra: null } }), 'a').estilo.sombra).toBeNull();
  });

  it('un color inválido no entra', () => {
    const r = cambiarEstilo(escena(forma('a', 0, 0)), ['a'], { estilo: { relleno: { tipo: 'solido', color: 'javascript:alert(1)' } } });
    expect(JSON.stringify(r)).not.toContain('javascript');
  });

  it('sin parche, sin elementos o con bloqueados: la misma escena', () => {
    const e = escena(forma('a', 0, 0, 10, 10, { bloqueado: true }));
    expect(cambiarEstilo(e, ['a'], { estilo: { opacidad: 0.2 } })).toBe(e);
    expect(cambiarEstilo(e, [], { estilo: { opacidad: 0.2 } })).toBe(e);
    expect(cambiarEstilo(escena(forma('a', 0, 0)), ['a'], {})).toEqual(escena(forma('a', 0, 0)));
  });
});

describe('duplicar', () => {
  it('copia con ids nuevos, desplazada y al frente', () => {
    const e = escena(forma('a', 10, 10), forma('b', 0, 0));
    const r = duplicar(e, ['a']);
    expect(r.ids).toEqual(['a-copia']);
    expect(ids(r.escena)).toEqual(['a', 'b', 'a-copia']);
    expect(getForma(r.escena, 'a-copia').transformacion).toMatchObject({ x: 30, y: 30 });
    expect(getForma(r.escena, 'a').transformacion).toMatchObject({ x: 10, y: 10 });
  });

  it('duplicar la copia no repite ids', () => {
    const e = escena(forma('a', 0, 0));
    const una = duplicar(e, ['a']);
    const dos = duplicar(una.escena, ['a']);
    const tres = duplicar(dos.escena, [dos.ids[0] ?? '']);
    expect(new Set(ids(tres.escena)).size).toBe(ids(tres.escena).length);
  });

  it('un grupo se copia con sus hijos y el grupo nuevo apunta a las copias', () => {
    const e = escena(forma('a', 0, 0), forma('b', 100, 0), grupo('g', ['a', 'b']));
    const r = duplicar(e, ['g'], { desplazamiento: { x: 5, y: 5 } });
    expect(r.ids).toEqual(['g-copia']);
    expect(getGrupo(r.escena, 'g-copia').hijos).toEqual(['a-copia', 'b-copia']);
    expect(getGrupo(r.escena, 'g').hijos).toEqual(['a', 'b']);
    expect(getForma(r.escena, 'b-copia').transformacion).toMatchObject({ x: 105, y: 5 });
    expect(normalizarEscena(r.escena)).toEqual(r.escena); // sigue siendo una escena válida
  });

  it('una línea copiada junto con su forma queda unida a la copia; si no, se despega', () => {
    const e = escena(forma('f', 0, 0), forma('g', 300, 0), linea('l', [[0, 0], [300, 0]], { origen: { elementoId: 'f', puerto: 1 }, destino: { elementoId: 'g', puerto: 3 } }));
    const entera = duplicar(e, ['f', 'g', 'l']);
    expect(getLinea(entera.escena, 'l-copia').origen).toEqual({ elementoId: 'f-copia', puerto: 1 });
    const sola = duplicar(e, ['l']);
    expect(getLinea(sola.escena, 'l-copia').origen).toBeUndefined();
    expect(getLinea(sola.escena, 'l-copia').destino).toBeUndefined();
  });

  it('seleccionar un grupo y su hijo duplica una sola vez', () => {
    const e = escena(forma('a', 0, 0), forma('b', 0, 0), grupo('g', ['a', 'b']));
    expect(ids(duplicar(e, ['g', 'a']).escena)).toHaveLength(6);
  });

  it('nada que duplicar: la misma escena', () => {
    const e = escena(forma('a', 0, 0));
    expect(duplicar(e, []).escena).toBe(e);
    expect(duplicar(e, ['nada']).ids).toEqual([]);
  });

  it('la copia conserva el contenido del original', () => {
    const e = escena(forma('a', 0, 0, 100, 50, { texto: 'Hola', forma: 'estrella' }));
    expect(getForma(duplicar(e, ['a']).escena, 'a-copia')).toMatchObject({ texto: 'Hola', forma: 'estrella' });
    expect(get(e, 'a')).toBe(e.elementos[0]);
  });
});
