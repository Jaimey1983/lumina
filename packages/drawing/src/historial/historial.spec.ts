import { describe, expect, it } from 'vitest';
import { agregar, agrupar, duplicar, eliminar, mover, redimensionar, reordenar, rotar } from '../operaciones/index.js';
import { escena, forma, getForma, ids, linea, texto } from '../operaciones/util-pruebas.js';
import { aplicarParche, diferencia, Historial } from './historial.js';

const base = () => escena(forma('a', 0, 0), forma('b', 100, 0), texto('t', 0, 100), linea('l', [[0, 0], [50, 50]]));

describe('diferencia y aplicarParche', () => {
  it('escenas iguales: no hay parche', () => {
    expect(diferencia(base(), base())).toBeNull();
    const e = base();
    expect(diferencia(e, e)).toBeNull();
  });

  it('un movimiento guarda solo el elemento que cambió y no el orden', () => {
    const e = base();
    const p = diferencia(e, mover(e, ['a'], 10, 0));
    expect(p?.elementos.map((c) => c.id)).toEqual(['a']);
    expect(p?.orden).toBeUndefined();
  });

  it('aplicar hacia adelante y hacia atrás recupera cada escena exactamente', () => {
    const e = base();
    const cambios = [
      mover(e, ['a', 'l'], 12.5, -7),
      redimensionar(e, ['b'], 'se', 40, 30),
      rotar(e, ['a', 'b'], 33),
      agregar(e, { tipo: 'forma', forma: 'rombo' }).escena,
      eliminar(e, ['a', 'l']),
      reordenar(e, ['a'], 'frente'),
      agrupar(e, ['a', 'b']).escena,
      duplicar(e, ['a', 'b']).escena,
      { ...e, ancho: 2000, fondo: '#ffffff' },
    ];
    for (const despues of cambios) {
      const p = diferencia(e, despues);
      expect(p).not.toBeNull();
      if (!p) continue;
      expect(aplicarParche(e, p, 'adelante')).toEqual(despues);
      expect(aplicarParche(despues, p, 'atras')).toEqual(e);
    }
  });

  it('no muta ninguna de las escenas', () => {
    const e = base();
    const despues = mover(e, ['a'], 1, 1);
    const [s1, s2] = [JSON.stringify(e), JSON.stringify(despues)];
    const p = diferencia(e, despues);
    if (p) {
      aplicarParche(e, p, 'adelante');
      aplicarParche(despues, p, 'atras');
    }
    expect([JSON.stringify(e), JSON.stringify(despues)]).toEqual([s1, s2]);
  });

  it('una diferencia estructural (mismo contenido, otra referencia) no cuenta como cambio', () => {
    const e = base();
    expect(diferencia(e, JSON.parse(JSON.stringify(e)))).toBeNull();
  });
});

describe('Historial', () => {
  it('deshacer y rehacer recorren los cambios en orden', () => {
    const h = new Historial();
    const s0 = base();
    const s1 = mover(s0, ['a'], 10, 0);
    const s2 = mover(s1, ['a'], 10, 0);
    h.registrar(s0, s1);
    h.registrar(s1, s2);
    expect(h.puedeDeshacer).toBe(true);
    expect(h.puedeRehacer).toBe(false);
    const u1 = h.deshacer(s2);
    expect(u1).toEqual(s1);
    const u0 = h.deshacer(u1 as typeof s1);
    expect(u0).toEqual(s0);
    expect(h.deshacer(u0 as typeof s0)).toBeNull();
    const r1 = h.rehacer(u0 as typeof s0);
    expect(r1).toEqual(s1);
    expect(h.rehacer(r1 as typeof s1)).toEqual(s2);
    expect(h.rehacer(s2)).toBeNull();
  });

  it('un cambio nuevo borra lo que se podía rehacer', () => {
    const h = new Historial();
    const s0 = base();
    const s1 = mover(s0, ['a'], 10, 0);
    h.registrar(s0, s1);
    const atras = h.deshacer(s1) as typeof s0;
    expect(h.puedeRehacer).toBe(true);
    h.registrar(atras, mover(atras, ['b'], 5, 5));
    expect(h.puedeRehacer).toBe(false);
  });

  it('registrar sin cambio no agrega nada', () => {
    const h = new Historial();
    const e = base();
    expect(h.registrar(e, e)).toBe(false);
    expect(h.tamano).toBe(0);
    expect(h.deshacer(e)).toBeNull();
  });

  it('el tope descarta lo más viejo', () => {
    const h = new Historial({ tope: 3 });
    let actual = base();
    const estados = [actual];
    for (let i = 0; i < 6; i++) {
      const sig = mover(actual, ['a'], 1, 0);
      h.registrar(actual, sig);
      actual = sig;
      estados.push(actual);
    }
    expect(h.tamano).toBe(3);
    let e = actual;
    for (let i = 0; i < 3; i++) e = h.deshacer(e) as typeof e;
    expect(e).toEqual(estados[3]);
    expect(h.deshacer(e)).toBeNull();
  });

  it('tope inválido: usa 100', () => {
    expect(new Historial({ tope: Number.NaN }).tope).toBe(100);
    expect(new Historial({ tope: 0 }).tope).toBe(1);
  });

  it('un gesto con cien fotogramas es una sola entrada', () => {
    const h = new Historial();
    const inicio = base();
    h.iniciarGesto(inicio);
    expect(h.enGesto).toBe(true);
    let actual = inicio;
    for (let i = 0; i < 100; i++) actual = mover(inicio, ['a'], i, i); // cada fotograma parte del inicio, como el editor
    expect(h.terminarGesto(actual)).toBe(true);
    expect(h.enGesto).toBe(false);
    expect(h.tamano).toBe(1);
    expect(h.deshacer(actual)).toEqual(inicio);
  });

  it('un gesto que no cambia nada, o cancelado, no deja entrada', () => {
    const h = new Historial();
    const e = base();
    h.iniciarGesto(e);
    expect(h.terminarGesto(e)).toBe(false);
    h.iniciarGesto(e);
    h.cancelarGesto();
    expect(h.enGesto).toBe(false);
    expect(h.terminarGesto(mover(e, ['a'], 1, 1))).toBe(false);
    expect(h.tamano).toBe(0);
  });

  it('limpiar vacía todo', () => {
    const h = new Historial();
    const e = base();
    h.registrar(e, mover(e, ['a'], 1, 1));
    h.iniciarGesto(e);
    h.limpiar();
    expect([h.puedeDeshacer, h.puedeRehacer, h.enGesto]).toEqual([false, false, false]);
  });

  it('cadena larga de operaciones distintas: deshacer todo vuelve a la escena inicial, rehacer todo a la final', () => {
    const h = new Historial();
    const inicial = base();
    let actual = inicial;
    const paso = (siguiente: typeof inicial): void => {
      h.registrar(actual, siguiente);
      actual = siguiente;
    };
    paso(mover(actual, ['a'], 20, 20));
    paso(agregar(actual, { tipo: 'forma', forma: 'estrella' }).escena);
    paso(redimensionar(actual, ['b'], 'e', 60, 0));
    paso(rotar(actual, ['a', 'b'], 45));
    const { escena: conGrupo, id } = agrupar(actual, ['a', 'b']);
    paso(conGrupo);
    paso(mover(actual, [id], 5, 5));
    paso(duplicar(actual, [id]).escena);
    paso(reordenar(actual, ['t'], 'frente'));
    paso(eliminar(actual, ['l']));
    const final = actual;
    let e = actual;
    while (h.puedeDeshacer) e = h.deshacer(e) as typeof e;
    expect(e).toEqual(inicial);
    while (h.puedeRehacer) e = h.rehacer(e) as typeof e;
    expect(e).toEqual(final);
    expect(ids(final)).not.toContain('l');
    expect(getForma(final, 'b').transformacion.rotacion).toBe(45);
  });

  it('guarda mucho menos que copias completas', () => {
    const grande = escena(...Array.from({ length: 500 }, (_, i) => forma(`f${i}`, i, i)));
    const h = new Historial();
    const despues = mover(grande, ['f0'], 1, 1);
    h.registrar(grande, despues);
    const p = diferencia(grande, despues);
    expect(p?.elementos).toHaveLength(1);
    expect(JSON.stringify(p).length).toBeLessThan(JSON.stringify(grande).length / 50);
  });
});
