// ─── Grafo de un diagrama para organizarlo (Y13) ──────────────────────────────
// Lógica pura: de una escena saca «nodos» (formas, o grupos enteros) y «aristas» (conectores entre dos de ellos).

import { cajaDeSeleccion } from '../operaciones/geometria.js';
import { bloqueadosEfectivos, expandir, mapaPadres, ocultosEfectivos, raizDe } from '../operaciones/utilidades.js';
import type { Escena } from '../tipos.js';

/** Lo más que se organiza de una vez (DW9: el editor es fluido hasta ~500 elementos). */
export const MAX_FORMAS_DISPOSICION = 500;

/** Lo que se mueve como una unidad: una forma suelta o un grupo entero, con la caja que lo envuelve. */
export interface NodoDisposicion {
  id: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface AristaDisposicion {
  desde: string;
  hasta: string;
}

export interface Grafo {
  nodos: NodoDisposicion[];
  aristas: AristaDisposicion[];
}

export type ErrorDisposicion = 'pocas' | 'demasiadas';

/** Posición de la esquina superior izquierda de cada nodo. */
export type Posiciones = Map<string, { x: number; y: number }>;

/**
 * Los nodos y las aristas de lo que se va a organizar.
 *
 * - Con `ids` (las formas elegidas) solo cuentan ellas; sin ids, todo el diagrama.
 * - Un grupo es un solo nodo. Si algún elemento del grupo está bloqueado u oculto, el grupo **no se mueve** (no se puede
 *   mover a medias); una forma bloqueada u oculta tampoco.
 * - Las aristas son los conectores pegados por los dos lados a nodos del grafo; un conector entre dos formas del mismo
 *   grupo, o con un extremo suelto o pegado a algo que no se mueve, no cuenta. No se repiten ni se guardan las dobles.
 * - Los nodos van en el orden de la escena, para que el resultado sea siempre el mismo.
 */
export function extraerGrafo(escena: Escena, ids: readonly string[] = []): Grafo | { error: ErrorDisposicion } {
  const padres = mapaPadres(escena);
  const bloqueados = bloqueadosEfectivos(escena);
  const ocultos = ocultosEfectivos(escena);
  const ambito = ids.length > 0 ? expandir(escena, ids) : null;

  // Las formas de cada raíz, para saber si la unidad entera se puede mover.
  const formasPorRaiz = new Map<string, string[]>();
  let formasEnAmbito = 0;
  for (const e of escena.elementos) {
    if (e.tipo !== 'forma') continue;
    if (ambito && !ambito.has(e.id)) continue;
    formasEnAmbito++;
    const raiz = raizDe(e.id, padres);
    const lista = formasPorRaiz.get(raiz) ?? [];
    lista.push(e.id);
    formasPorRaiz.set(raiz, lista);
  }
  if (formasEnAmbito > MAX_FORMAS_DISPOSICION) return { error: 'demasiadas' };

  const nodos: NodoDisposicion[] = [];
  const idsNodo = new Set<string>();
  for (const e of escena.elementos) {
    if (e.tipo === 'grupo' || !formasPorRaiz.has(raizDe(e.id, padres))) continue;
    const raiz = raizDe(e.id, padres);
    if (idsNodo.has(raiz)) continue;
    // Se mueve entera o no se mueve: todo lo que contiene tiene que poder moverse.
    const contenido = [...expandir(escena, [raiz])];
    if (contenido.some((id) => bloqueados.has(id) || ocultos.has(id))) continue;
    const caja = cajaDeSeleccion(escena, [raiz]);
    if (!caja) continue;
    idsNodo.add(raiz);
    nodos.push({ id: raiz, x: caja.x, y: caja.y, ancho: caja.ancho, alto: caja.alto });
  }
  if (nodos.length < 2) return { error: 'pocas' };

  const aristas: AristaDisposicion[] = [];
  const vistas = new Set<string>();
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || !e.origen || !e.destino) continue;
    const desde = raizDe(e.origen.elementoId, padres);
    const hasta = raizDe(e.destino.elementoId, padres);
    if (desde === hasta || !idsNodo.has(desde) || !idsNodo.has(hasta)) continue;
    const clave = `${desde}\u0000${hasta}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    aristas.push({ desde, hasta });
  }
  return { nodos, aristas };
}

/** Los nodos que tienen al menos una arista (conectados) y los que no (sueltos), cada grupo en su orden. */
export function separarSueltos(grafo: Grafo): { conectados: NodoDisposicion[]; sueltos: NodoDisposicion[] } {
  const conConexion = new Set<string>();
  for (const a of grafo.aristas) {
    conConexion.add(a.desde);
    conConexion.add(a.hasta);
  }
  return {
    conectados: grafo.nodos.filter((n) => conConexion.has(n.id)),
    sueltos: grafo.nodos.filter((n) => !conConexion.has(n.id)),
  };
}

/**
 * El bosque que recorre el grafo: cada nodo con su padre y sus hijos. Las raíces son los nodos sin aristas de entrada (en
 * el orden de la escena) y, si queda alguno sin visitar (un ciclo sin entrada), el primero de ellos. Se recorre en anchura
 * por las aristas, así que **un ciclo no se cuelga**: cada nodo se visita una sola vez y la arista que cerraría el ciclo
 * (o un segundo padre) simplemente no cuenta.
 */
export interface Bosque {
  raices: string[];
  hijos: Map<string, string[]>;
  profundidad: Map<string, number>;
}

export function bosqueDe(nodos: readonly NodoDisposicion[], aristas: readonly AristaDisposicion[]): Bosque {
  const salientes = new Map<string, string[]>();
  const entrantes = new Set<string>();
  for (const a of aristas) {
    salientes.set(a.desde, [...(salientes.get(a.desde) ?? []), a.hasta]);
    entrantes.add(a.hasta);
  }
  const visitado = new Set<string>();
  const raices: string[] = [];
  const hijos = new Map<string, string[]>();
  const profundidad = new Map<string, number>();
  const recorrer = (raiz: string): void => {
    visitado.add(raiz);
    raices.push(raiz);
    profundidad.set(raiz, 0);
    const cola = [raiz];
    for (let i = 0; i < cola.length; i++) {
      const actual = cola[i] as string;
      for (const h of salientes.get(actual) ?? []) {
        if (visitado.has(h)) continue;
        visitado.add(h);
        profundidad.set(h, (profundidad.get(actual) ?? 0) + 1);
        hijos.set(actual, [...(hijos.get(actual) ?? []), h]);
        cola.push(h);
      }
    }
  };
  for (const n of nodos) if (!entrantes.has(n.id) && !visitado.has(n.id)) recorrer(n.id);
  for (const n of nodos) if (!visitado.has(n.id)) recorrer(n.id);
  return { raices, hijos, profundidad };
}
