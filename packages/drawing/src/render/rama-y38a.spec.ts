import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import { sincronizarConectores } from '../conectores/index.js';
import { normalizarEscena } from '../normalizar.js';
import { escena, forma } from '../operaciones/util-pruebas.js';
import { fijarColapso } from '../operaciones/colapso.js';
import type { Escena } from '../tipos.js';
import { escenaANodos, escenaASvg, type NodoSvg } from './render.js';

const arbol = (): Escena => {
  let e = escena(...['raiz', 'a', 'b', 'a1', 'a2', 'b1'].map((id, i) => forma(id, 20 + i * 150, 40 + (i % 3) * 100, 100, 60, { texto: id })));
  for (const [p, h] of [['raiz', 'a'], ['raiz', 'b'], ['a', 'a1'], ['a', 'a2'], ['b', 'b1']] as const) e = conectarFormas(e, p, h);
  return e;
};
const plegar = (e: Escena, ...ids: string[]): Escena => fijarColapso(e, ids, true);

const recorrer = (n: NodoSvg, f: (x: NodoSvg) => void): void => {
  f(n);
  (n.hijos ?? []).forEach((h) => recorrer(h, f));
};
const marcadores = (e: Escena, indicadoresRama?: 'colapsados' | 'todos' | 'ninguno'): NodoSvg[] => {
  const salida: NodoSvg[] = [];
  for (const n of escenaANodos(e, indicadoresRama ? { indicadoresRama } : {}).nodos) recorrer(n, (x) => x.attrs['data-colapsar-id'] !== undefined && salida.push(x));
  return salida;
};
const idsDibujados = (e: Escena, modo?: 'colapsados' | 'todos' | 'ninguno'): string[] => {
  const ids: string[] = [];
  for (const n of escenaANodos(e, modo ? { indicadoresRama: modo } : {}).nodos) if (n.attrs['data-elemento-id'] !== undefined) ids.push(String(n.attrs['data-elemento-id']));
  return ids;
};
const texto = (m: NodoSvg): string => (m.hijos ?? []).find((h) => h.tag === 'text')?.texto ?? '';

describe('dibujo de las ramas plegadas (Y38a)', () => {
  it('lo plegado no se dibuja (ni sus conectores); lo demás sí', () => {
    const ids = idsDibujados(plegar(arbol(), 'a'));
    expect(ids).not.toContain('a1');
    expect(ids).not.toContain('a2');
    for (const v of ['raiz', 'a', 'b', 'b1']) expect(ids).toContain(v);
    // 5 conectores en total: dos tocan a1 y a2.
    expect(ids.filter((i) => i.startsWith('linea'))).toHaveLength(3);
  });

  it('el marcador «+N» de una plegada: círculo en la esquina inferior derecha de la forma, con su número', () => {
    const e = plegar(arbol(), 'a');
    const [m] = marcadores(e);
    expect(m?.attrs['data-colapsar-id']).toBe('a');
    expect(texto(m as NodoSvg)).toBe('+2');
    const circulo = (m?.hijos ?? []).find((h) => h.tag === 'circle') as NodoSvg;
    const a = e.elementos.find((x) => x.id === 'a') as { transformacion: { x: number; y: number; ancho: number; alto: number } };
    expect(circulo.attrs.cx).toBe(a.transformacion.x + a.transformacion.ancho);
    expect(circulo.attrs.cy).toBe(a.transformacion.y + a.transformacion.alto);
  });

  it('el marcador tiene rol, nombre accesible y usa tokens del tema', () => {
    const [m] = marcadores(plegar(arbol(), 'a'));
    expect(m?.attrs.role).toBe('button');
    expect(m?.attrs['aria-label']).toBe('Rama plegada «a»: 2 elementos ocultos. Desplegar');
    const circulo = (m?.hijos ?? []).find((h) => h.tag === 'circle') as NodoSvg;
    expect(String(circulo.attrs.fill)).toContain('var(--card)');
  });

  it('con un solo elemento oculto, singular', () => {
    const [m] = marcadores(plegar(arbol(), 'b'));
    expect(m?.attrs['aria-label']).toBe('Rama plegada «b»: 1 elemento oculto. Desplegar');
    expect(texto(m as NodoSvg)).toBe('+1');
  });

  it('desde 100 ocultas el marcador dice «99+»', () => {
    const els: Array<Record<string, unknown>> = [forma('r', 0, 0, 100, 60, { colapsado: true }), ...Array.from({ length: 100 }, (_v, i) => forma(`h${i}`, 200 + (i % 10) * 120, Math.floor(i / 10) * 80))];
    let e = normalizarEscena({ ancho: 5000, alto: 2000, elementos: els });
    for (let i = 0; i < 100; i++) e = conectarFormas(e, 'r', `h${i}`);
    expect(texto(marcadores(e)[0] as NodoSvg)).toBe('99+');
    const casi = { ...e, elementos: e.elementos.filter((x) => x.id !== 'h0' && !(x.tipo === 'linea' && x.destino?.elementoId === 'h0')) } as Escena;
    expect(texto(marcadores(casi)[0] as NodoSvg)).toBe('+99');
  });

  it('modo por defecto («colapsados»): solo los «+N»; sin plegadas no se agrega ningún nodo', () => {
    expect(marcadores(arbol())).toHaveLength(0);
    expect(marcadores(plegar(arbol(), 'a')).map((m) => m.attrs['data-colapsar-id'])).toEqual(['a']);
  });

  it('modo «todos»: además un «−» en cada forma desplegada con hijos', () => {
    const ms = marcadores(plegar(arbol(), 'a'), 'todos');
    expect(ms.map((m) => `${m.attrs['data-colapsar-id']}:${texto(m)}`).sort()).toEqual(['a:+2', 'b:−', 'raiz:−']);
    const desplegado = marcadores(arbol(), 'todos');
    expect(desplegado.map((m) => m.attrs['data-colapsar-id']).sort()).toEqual(['a', 'b', 'raiz']);
    expect(desplegado[0]?.attrs['aria-label']).toMatch(/^Plegar la rama «/);
  });

  it('modo «ninguno»: no hay marcadores', () => {
    expect(marcadores(plegar(arbol(), 'a'), 'ninguno')).toHaveLength(0);
  });

  it('una plegada que no oculta nada (otro camino la mantiene) no lleva «+N»; ni un marcador sobre lo oculto', () => {
    let e = escena(...['r', 'p', 'q', 'h'].map((id, i) => forma(id, 20 + i * 150, 40, 100, 60)));
    for (const [a, b] of [['r', 'p'], ['r', 'q'], ['p', 'h'], ['q', 'h']] as const) e = conectarFormas(e, a, b);
    expect(marcadores(plegar(e, 'p'))).toHaveLength(0);
    const anidada = plegar(arbol(), 'raiz', 'a');
    expect(marcadores(anidada).map((m) => m.attrs['data-colapsar-id'])).toEqual(['raiz']); // «a» está oculta: su marcador también
  });

  it('el marcador va encima de todo (después de los elementos)', () => {
    const nodos = escenaANodos(plegar(arbol(), 'a')).nodos;
    expect(nodos.at(-1)?.attrs['data-colapsar-id']).toBe('a');
  });

  it('los conectores en ángulo recto no rodean formas plegadas', () => {
    const base = (conObstaculo: boolean): Escena => {
      const els = [forma('s', 20, 100, 100, 60), forma('t', 620, 100, 100, 60), forma('p', 320, 400, 100, 60, { colapsado: true }), ...(conObstaculo ? [forma('o', 320, 100, 100, 60)] : [])];
      let e = normalizarEscena({ ancho: 1000, alto: 700, elementos: els });
      e = conectarFormas(e, 's', 't');
      e = conectarFormas(e, 's', 'p');
      if (conObstaculo) e = conectarFormas(e, 'p', 'o');
      e = { ...e, elementos: e.elementos.map((x) => (x.tipo === 'linea' && x.destino?.elementoId === 't' ? { ...x, trazado: 'ortogonal' as const } : x)) };
      return sincronizarConectores(e);
    };
    const ruta = (e: Escena): string => {
      const linea = e.elementos.find((x) => x.tipo === 'linea' && x.destino?.elementoId === 't') as { id: string };
      let d = '';
      for (const n of escenaANodos(e, { indicadoresRama: 'ninguno' }).nodos) {
        if (n.attrs['data-elemento-id'] === linea.id) recorrer(n, (x) => x.tag === 'path' && x.attrs.d !== undefined && (d += String(x.attrs.d)));
      }
      return d;
    };
    expect(ruta(base(true))).not.toBe('');
    expect(ruta(base(true))).toBe(ruta(base(false)));
  });

  it('el SVG exportado trae lo plegado fuera y los «+N» dentro', () => {
    const { svg } = escenaASvg(plegar(arbol(), 'a'), { modo: 'claro' });
    expect(svg).toContain('data-colapsar-id="a"');
    expect(svg).toContain('>+2<');
    expect(svg).not.toContain('data-elemento-id="a1"');
    expect(escenaASvg(plegar(arbol(), 'a'), { modo: 'claro', indicadoresRama: 'ninguno' }).svg).not.toContain('data-colapsar-id');
  });

  it('en modo oscuro los colores del marcador se resuelven con el tema', () => {
    const { svg } = escenaASvg(plegar(arbol(), 'a'), { modo: 'oscuro' });
    expect(svg).toContain('#1E293B'); // var(--card) oscuro
  });
});
