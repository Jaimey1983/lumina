import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import { sincronizarConectores } from '../conectores/conectar.js';
import { puertosParaConectar } from '../conectores/enlazar.js';
import { ladoDePuerto, puntoDePuerto } from '../conectores/puertos.js';
import { cajaDeSeleccion } from '../operaciones/geometria.js';
import { escena, forma, getForma, getGrupo, getLinea, grupo } from '../operaciones/util-pruebas.js';
import type { Escena, Forma, Linea } from '../tipos.js';
import { aplicarDisposicion, componerPosiciones } from './aplicar.js';
import { disponerArbol } from './arbol.js';
import { extraerGrafo, separarSueltos, type Grafo } from './grafo.js';
import { disponerRadial } from './radial.js';

const organizar = (e: Escena, ids: string[] = [], modo: 'arbol' | 'radial' = 'arbol'): Escena => {
  const g = extraerGrafo(e, ids) as Grafo;
  const { conectados } = separarSueltos(g);
  const disp = modo === 'arbol' ? disponerArbol(conectados, g.aristas) : disponerRadial(conectados, g.aristas);
  return sincronizarConectores(aplicarDisposicion(e, g, componerPosiciones(g, disp)));
};
const centro = (e: Escena, id: string) => {
  const c = cajaDeSeleccion(e, [id]) as { x: number; y: number; ancho: number; alto: number };
  return { x: c.x + c.ancho / 2, y: c.y + c.alto / 2 };
};
const desordenado = (): Escena => {
  let e = escena(forma('r', 300, 400), forma('a', 50, 50), forma('b', 700, 20), forma('c', 120, 500), forma('d', 650, 450));
  e = conectarFormas(e, 'r', 'a');
  e = conectarFormas(e, 'r', 'b');
  e = conectarFormas(e, 'a', 'c');
  return conectarFormas(e, 'b', 'd');
};

describe('componerPosiciones: el ancla y los sueltos', () => {
  it('el primer nodo sin entrada (la raíz) no se mueve de sitio', () => {
    const e = desordenado();
    const antes = centro(e, 'r');
    const r = organizar(e);
    expect(centro(r, 'r').x).toBeCloseTo(antes.x, 6);
    expect(centro(r, 'r').y).toBeCloseTo(antes.y, 6);
    expect(centro(r, 'a')).not.toEqual(centro(e, 'a')); // y el resto sí
  });

  it('la raíz es el ancla aunque no sea la primera en el orden de la escena', () => {
    // En la escena van primero los hijos y la raíz última: el ancla sigue siendo la raíz (la que no tiene entrada).
    let e = escena(forma('hijo1', 50, 50), forma('hijo2', 700, 20), forma('raiz', 300, 400));
    e = conectarFormas(conectarFormas(e, 'raiz', 'hijo1'), 'raiz', 'hijo2');
    const antes = centro(e, 'raiz');
    const r = organizar(e);
    expect(centro(r, 'raiz').x).toBeCloseTo(antes.x, 6);
    expect(centro(r, 'raiz').y).toBeCloseTo(antes.y, 6);
  });

  it('en un ciclo, el ancla es el primero', () => {
    let e = escena(forma('x', 100, 100), forma('y', 500, 300), forma('z', 900, 100));
    e = conectarFormas(conectarFormas(conectarFormas(e, 'x', 'y'), 'y', 'z'), 'z', 'x');
    const antes = centro(e, 'x');
    const r = organizar(e);
    expect(centro(r, 'x').x).toBeCloseTo(antes.x, 6);
    expect(centro(r, 'x').y).toBeCloseTo(antes.y, 6);
  });

  it('los nodos sin ninguna conexión van en una cuadrícula aparte, debajo y alineada con el borde izquierdo', () => {
    let e = escena(forma('a', 100, 100), forma('b', 500, 400), forma('s1', 20, 20), forma('s2', 800, 40), forma('s3', 400, 700));
    e = conectarFormas(e, 'a', 'b');
    const r = organizar(e);
    const principal = cajaDeSeleccion(r, ['a', 'b']) as { x: number; y: number; ancho: number; alto: number };
    for (const id of ['s1', 's2', 's3']) {
      const c = cajaDeSeleccion(r, [id]) as { x: number; y: number };
      expect(c.y).toBeGreaterThanOrEqual(principal.y + principal.alto + 80 - 1e-6);
    }
    expect(Math.min(...['s1', 's2', 's3'].map((id) => (cajaDeSeleccion(r, [id]) as { x: number }).x))).toBeCloseTo(principal.x, 6);
  });

  it('si no hay nada conectado, la cuadrícula ocupa el sitio donde estaban (misma esquina)', () => {
    const e = escena(forma('a', 300, 200), forma('b', 700, 500), forma('c', 100, 600), forma('d', 900, 50));
    const r = organizar(e);
    const antes = cajaDeSeleccion(e, ['a', 'b', 'c', 'd']) as { x: number; y: number };
    const despues = cajaDeSeleccion(r, ['a', 'b', 'c', 'd']) as { x: number; y: number };
    expect(despues.x).toBeCloseTo(antes.x, 6);
    expect(despues.y).toBeCloseTo(antes.y, 6);
  });
});

describe('aplicarDisposicion', () => {
  it('mueve las formas sin cambiarles el tamaño, el texto ni el estilo', () => {
    let e = escena(forma('a', 0, 0, 120, 70, { texto: 'Uno', forma: 'rombo' }), forma('b', 500, 500, 90, 50, { texto: 'Dos' }));
    e = conectarFormas(e, 'a', 'b');
    const r = organizar(e);
    const a = getForma(r, 'a');
    expect(a).toMatchObject({ forma: 'rombo', texto: 'Uno' });
    expect(a.transformacion).toMatchObject({ ancho: 120, alto: 70, rotacion: 0 });
    expect(getForma(r, 'b').transformacion).toMatchObject({ ancho: 90, alto: 50 });
  });

  it('los conectores siguen pegados a las mismas formas y sus extremos están en sus puertos', () => {
    const e = desordenado();
    const antes = e.elementos.filter((x): x is Linea => x.tipo === 'linea').map((l) => [l.origen?.elementoId, l.destino?.elementoId]);
    const r = organizar(e);
    const lineas = r.elementos.filter((x): x is Linea => x.tipo === 'linea');
    expect(lineas.map((l) => [l.origen?.elementoId, l.destino?.elementoId])).toEqual(antes);
    for (const l of lineas) {
      const o = r.elementos.find((x) => x.id === l.origen?.elementoId) as Forma;
      const d = r.elementos.find((x) => x.id === l.destino?.elementoId) as Forma;
      const p0 = puntoDePuerto(o, l.origen?.puerto as number);
      const pn = puntoDePuerto(d, l.destino?.puerto as number);
      expect(l.puntos[0]).toEqual(p0);
      expect(l.puntos[l.puntos.length - 1]).toEqual(pn);
    }
  });

  it('vuelve a escoger los puertos para que se miren: de izquierda a derecha sale por la derecha y entra por la izquierda', () => {
    const e = desordenado();
    const r = organizar(e); // árbol hacia la derecha
    const l = r.elementos.filter((x): x is Linea => x.tipo === 'linea').find((x) => x.origen?.elementoId === 'r' && x.destino?.elementoId === 'a') as Linea;
    expect(l.origen?.puerto).toBe(1); // derecha
    expect(l.destino?.puerto).toBe(3); // izquierda
  });

  it('con un flujo, los conectores salen por el lado del sentido y entran por el opuesto', () => {
    const e = desordenado();
    const g = extraerGrafo(e) as Grafo;
    const { conectados } = separarSueltos(g);
    // Un árbol hacia la derecha: todos los conectores avanzan hacia la derecha.
    const pos = componerPosiciones(g, disponerArbol(conectados, g.aristas));
    const lineas = (esc: Escena) => esc.elementos.filter((x): x is Linea => x.tipo === 'linea');
    const aFavor = aplicarDisposicion(e, g, pos, { flujo: 'derecha' });
    expect(lineas(aFavor).map((l) => [l.origen?.puerto, l.destino?.puerto])).toEqual(lineas(aFavor).map(() => [1, 3]));
    // El mismo resultado visto con el flujo contrario: todos van contra él y se resuelven con el par que se mira (los de siempre).
    const enContra = aplicarDisposicion(e, g, pos, { flujo: 'izquierda' });
    const sinFlujo = aplicarDisposicion(e, g, pos);
    expect(lineas(enContra).map((l) => [l.origen?.puerto, l.destino?.puerto])).toEqual(lineas(sinFlujo).map((l) => [l.origen?.puerto, l.destino?.puerto]));
  });

  it('si una forma no tiene puerto en el lado del flujo, se usa el par que se mira (no un puerto cualquiera)', () => {
    // El triángulo rectángulo no tiene puerto por arriba: con flujo «abajo» no puede recibir por ahí.
    let e = escena(forma('a', 100, 0), forma('b', 100, 300, 100, 60, { forma: 'triangulo-rectangulo' }));
    e = conectarFormas(e, 'a', 'b');
    const g = extraerGrafo(e) as Grafo;
    const iguales = new Map(g.nodos.map((n) => [n.id, { x: n.x + 1, y: n.y }]));
    const r = aplicarDisposicion(e, g, iguales, { flujo: 'abajo' });
    const l = r.elementos.find((x) => x.tipo === 'linea') as Linea;
    const par = puertosParaConectar(r, 'a', 'b');
    expect([l.origen?.puerto, l.destino?.puerto]).toEqual([par?.origen.puerto, par?.destino.puerto]);
    expect(ladoDePuerto(getForma(r, 'b'), l.destino?.puerto as number)).not.toBe('arriba');
  });

  it('un conector que va contra el flujo no usa los puertos del flujo: se resuelve con el par que se mira', () => {
    // «a» queda a la IZQUIERDA de «b» y el conector va de b a a: contra el flujo «derecha».
    let e = escena(forma('a', 0, 0), forma('b', 400, 0));
    e = conectarFormas(e, 'b', 'a');
    const g = extraerGrafo(e) as Grafo;
    const sinMover = new Map(g.nodos.map((n) => [n.id, { x: n.x + 1, y: n.y }]));
    const l = aplicarDisposicion(e, g, sinMover, { flujo: 'derecha' }).elementos.find((x) => x.tipo === 'linea') as Linea;
    expect(l.origen?.puerto).toBe(3); // sale por la izquierda de «b»…
    expect(l.destino?.puerto).toBe(1); // …y entra por la derecha de «a»
  });

  it('un grupo se mueve entero: sus hijos conservan la posición entre sí', () => {
    let e = escena(forma('a', 0, 0), forma('x', 600, 300), forma('y', 800, 380), grupo('g', ['x', 'y']), forma('z', 100, 700));
    e = conectarFormas(e, 'a', 'x');
    e = conectarFormas(e, 'y', 'z');
    const dx = getForma(e, 'y').transformacion.x - getForma(e, 'x').transformacion.x;
    const dy = getForma(e, 'y').transformacion.y - getForma(e, 'x').transformacion.y;
    const r = organizar(e);
    expect(getForma(r, 'y').transformacion.x - getForma(r, 'x').transformacion.x).toBeCloseTo(dx, 6);
    expect(getForma(r, 'y').transformacion.y - getForma(r, 'x').transformacion.y).toBeCloseTo(dy, 6);
    expect(getGrupo(r, 'g').hijos).toEqual(['x', 'y']);
  });

  it('lo bloqueado y lo que queda fuera de lo elegido no se mueve', () => {
    let e = escena(forma('a', 0, 0), forma('b', 400, 300), forma('fija', 700, 100, 100, 60, { bloqueado: true }), forma('fuera', 900, 500));
    e = conectarFormas(e, 'a', 'b');
    const r = organizar(e, ['a', 'b']);
    expect(getForma(r, 'fija').transformacion).toEqual(getForma(e, 'fija').transformacion);
    expect(getForma(r, 'fuera').transformacion).toEqual(getForma(e, 'fuera').transformacion);
  });

  it('con formas elegidas solo se mueven ellas', () => {
    let e = escena(forma('a', 0, 0), forma('b', 400, 300), forma('c', 800, 100), forma('d', 100, 500));
    e = conectarFormas(e, 'a', 'b');
    e = conectarFormas(e, 'c', 'd');
    const r = organizar(e, ['a', 'b']);
    expect(getForma(r, 'c').transformacion).toEqual(getForma(e, 'c').transformacion);
    expect(getForma(r, 'd').transformacion).toEqual(getForma(e, 'd').transformacion);
  });

  it('si las posiciones ya son las que hay, devuelve la misma escena', () => {
    let e = escena(forma('a', 0, 0), forma('b', 400, 0));
    e = conectarFormas(e, 'a', 'b');
    const g = extraerGrafo(e) as Grafo;
    const iguales = new Map(g.nodos.map((n) => [n.id, { x: n.x, y: n.y }]));
    expect(aplicarDisposicion(e, g, iguales)).toBe(e);
  });

  it('no deja formas pisadas, en árbol ni en radial', () => {
    const e = desordenado();
    for (const modo of ['arbol', 'radial'] as const) {
      const r = organizar(e, [], modo);
      const formas = r.elementos.filter((x): x is Forma => x.tipo === 'forma');
      for (let i = 0; i < formas.length; i++) {
        for (let j = i + 1; j < formas.length; j++) {
          const a = (formas[i] as Forma).transformacion;
          const b = (formas[j] as Forma).transformacion;
          const pisa = a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto;
          expect(pisa, `${modo}: ${(formas[i] as Forma).id}/${(formas[j] as Forma).id}`).toBe(false);
        }
      }
    }
  });

  it('un conector pegado se conserva aunque el trazado sea ortogonal', () => {
    const e = desordenado();
    const l0 = e.elementos.find((x) => x.tipo === 'linea') as Linea;
    const r = organizar(e);
    expect(getLinea(r, l0.id).trazado).toBe(l0.trazado);
  });
});

describe('aplicarDisposicion: cada nodo se mueve su propio vector', () => {
  it('formas sueltas y un grupo van cada una a su sitio, y lo demás no se toca', () => {
    let e = escena(forma('a', 0, 0), forma('b', 300, 0), forma('c', 600, 0), forma('d', 900, 0), grupo('G', ['b', 'c']));
    e = conectarFormas(e, 'a', 'b');
    e = conectarFormas(e, 'c', 'd');
    const g = extraerGrafo(e, []) as Grafo;
    const destino = new Map([
      ['a', { x: 10, y: 20 }],
      ['G', { x: 500, y: 700 }], // el grupo b+c: su caja envolvente va a (500, 700)
      ['d', { x: 40, y: 50 }],
    ]);
    const r = aplicarDisposicion(e, g, destino);
    expect(getForma(r, 'a').transformacion).toMatchObject({ x: 10, y: 20 });
    expect(getForma(r, 'd').transformacion).toMatchObject({ x: 40, y: 50 });
    // el grupo conserva la distancia entre sus formas (b a 300 de c… 300 de b hasta 600): b queda en 500 y c en 800
    expect(getForma(r, 'b').transformacion).toMatchObject({ x: 500, y: 700 });
    expect(getForma(r, 'c').transformacion).toMatchObject({ x: 800, y: 700 });
    expect(getGrupo(r, 'G').hijos).toEqual(['b', 'c']);
  });

  it('un conector dentro de un grupo conserva sus conexiones con lo del mismo grupo; los que salen del grupo se vuelven a pegar', () => {
    let e = escena(forma('a', 0, 0), forma('b', 300, 100), forma('c', 600, 0), forma('d', 100, 400));
    e = conectarFormas(e, 'a', 'b');
    e = conectarFormas(e, 'b', 'c');
    e = conectarFormas(e, 'a', 'd');
    const lineas = e.elementos.filter((x): x is Linea => x.tipo === 'linea').map((x) => x.id);
    e = escena(...e.elementos.map((x) => x as never), grupo('G', ['a', 'b', lineas[0] as string, lineas[2] as string]));
    const g = extraerGrafo(e, []) as Grafo;
    const { conectados } = separarSueltos(g);
    const r = aplicarDisposicion(e, g, componerPosiciones(g, disponerArbol(conectados, g.aristas, { orientacion: 'abajo', separacionNiveles: 150, separacionHermanos: 50 })), { flujo: 'abajo' });
    const conexion = (id: string) => ({ origen: getLinea(r, id).origen, destino: getLinea(r, id).destino });
    // Los dos extremos están en el mismo grupo: se mueven juntos y no se vuelven a escoger (quedan como estaban)…
    expect(conexion(lineas[0] as string)).toEqual({ origen: { elementoId: 'a', puerto: 1 }, destino: { elementoId: 'b', puerto: 3 } });
    // …y los que salen del grupo sí se vuelven a pegar por el lado del flujo.
    expect(conexion(lineas[1] as string)).toEqual({ origen: { elementoId: 'b', puerto: 2 }, destino: { elementoId: 'c', puerto: 0 } });
    expect(conexion(lineas[2] as string)).toEqual({ origen: { elementoId: 'a', puerto: 2 }, destino: { elementoId: 'd', puerto: 0 } });
  });

  it('nada que mover devuelve la misma escena', () => {
    const e = desordenado();
    const g = extraerGrafo(e, []) as Grafo;
    expect(aplicarDisposicion(e, g, new Map())).toBe(e);
  });
});
