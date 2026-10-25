// ─── Plegar ramas (Y38a) ──────────────────────────────────────────────────────
// Puro. Una forma con `colapsado` oculta lo que cuelga de ella. La estructura de árbol de un dibujo está solo en los conectores: los
// hijos de una forma son los destinos de los conectores que salen de ella (DY74). Este módulo es una **hoja** del grafo de importaciones
// (solo conoce los tipos) para que lo usen `ocultosEfectivos`, `formasVisibles` y el render sin ciclos.

import type { Escena, Forma } from '../tipos.js';

/** Hijos de cada forma (destinos de sus conectores, en el orden de los conectores y sin repetir). Solo cuenta la unión entre formas. */
function hijosPorForma(escena: Escena): { hijos: Map<string, string[]>; formas: Set<string>; conPadre: Set<string> } {
  const formas = new Set<string>();
  for (const e of escena.elementos) if (e.tipo === 'forma') formas.add(e.id);
  const hijos = new Map<string, string[]>();
  const conPadre = new Set<string>();
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || !e.origen || !e.destino) continue;
    const desde = e.origen.elementoId;
    const hasta = e.destino.elementoId;
    if (desde === hasta || !formas.has(desde) || !formas.has(hasta)) continue;
    const lista = hijos.get(desde) ?? [];
    if (lista.includes(hasta)) continue;
    lista.push(hasta);
    hijos.set(desde, lista);
    conPadre.add(hasta);
  }
  return { hijos, formas, conPadre };
}

/** Los ids de las formas que son destino de un conector que sale de `id`, en el orden de los conectores y sin repetir. */
export function hijosDe(escena: Escena, id: string): string[] {
  return hijosPorForma(escena).hijos.get(id) ?? [];
}

/** Ids de las formas que tienen al menos un hijo (las que se pueden plegar). */
export function formasConHijos(escena: Escena): Set<string> {
  return new Set(hijosPorForma(escena).hijos.keys());
}

/** La forma tiene al menos un hijo: solo entonces se puede plegar. */
export function tieneHijos(escena: Escena, id: string): boolean {
  return hijosDe(escena, id).length > 0;
}

export interface ResumenDeColapso {
  /** Ids de las formas y de los conectores que quedan ocultos por formas plegadas. */
  ocultos: Set<string>;
  /** Cuántas formas oculta cada forma plegada (con sus descendientes ocultos). Solo trae las plegadas que ocultan algo. */
  cuentas: Map<string, number>;
}

const VACIO: ResumenDeColapso = { ocultos: new Set(), cuentas: new Map() };

/**
 * Qué queda oculto por las formas plegadas y cuánto oculta cada una (DY74). Las raíces son las formas a las que no llega ningún
 * conector. Una forma se oculta si **toda** forma-camino hasta ella desde una raíz pasa por una plegada: se parte de las raíces, se avanza
 * por los conectores **sin salir de las plegadas** (eso es lo que se ve) y se ocultan las que se alcanzan desde las raíces pero no así.
 * Por eso un nodo con dos padres, uno plegado y otro visible, **sigue a la vista**; un ciclo no cuelga el cálculo, y lo que ningún camino
 * desde una raíz alcanza (un ciclo sin entrada) no se oculta. Los conectores que tocan una forma oculta se ocultan. **Camino rápido:** sin
 * ninguna forma plegada devuelve un resumen vacío sin armar el grafo.
 */
export function resumenDeColapso(escena: Escena): ResumenDeColapso {
  let hay = false;
  for (const e of escena.elementos) {
    if (e.tipo === 'forma' && e.colapsado === true) {
      hay = true;
      break;
    }
  }
  if (!hay) return VACIO;

  const { hijos, formas, conPadre } = hijosPorForma(escena);
  const plegadas = new Set<string>();
  for (const e of escena.elementos) if (e.tipo === 'forma' && e.colapsado === true) plegadas.add(e.id);

  const raices = [...formas].filter((id) => !conPadre.has(id));
  const recorrer = (parar: (id: string) => boolean): Set<string> => {
    const vistos = new Set(raices);
    const cola = [...raices];
    for (let i = 0; i < cola.length; i++) {
      const u = cola[i] as string;
      if (parar(u)) continue;
      for (const h of hijos.get(u) ?? []) {
        if (vistos.has(h)) continue;
        vistos.add(h);
        cola.push(h);
      }
    }
    return vistos;
  };
  const alcanzadas = recorrer(() => false);
  const visibles = recorrer((id) => plegadas.has(id));

  const ocultos = new Set<string>();
  for (const id of alcanzadas) if (!visibles.has(id)) ocultos.add(id);
  if (ocultos.size === 0) return VACIO;

  // Cuántas oculta cada plegada: las ocultas que se alcanzan desde ella (sin volver a pasar por ella).
  const cuentas = new Map<string, number>();
  for (const p of plegadas) {
    const vistos = new Set<string>([p]);
    const cola = [p];
    let n = 0;
    for (let i = 0; i < cola.length; i++) {
      for (const h of hijos.get(cola[i] as string) ?? []) {
        if (vistos.has(h)) continue;
        vistos.add(h);
        cola.push(h);
        if (ocultos.has(h)) n++;
      }
    }
    if (n > 0) cuentas.set(p, n);
  }

  for (const e of escena.elementos) {
    if (e.tipo === 'linea' && ((e.origen && ocultos.has(e.origen.elementoId)) || (e.destino && ocultos.has(e.destino.elementoId)))) ocultos.add(e.id);
  }
  return { ocultos, cuentas };
}

/** Ids (formas y conectores) que quedan ocultos por formas plegadas. */
export function ocultosPorColapso(escena: Escena): Set<string> {
  return resumenDeColapso(escena).ocultos;
}

/** Cuántas formas oculta la plegada `id` (0 si no está plegada o no oculta nada). */
export function contarOcultos(escena: Escena, id: string): number {
  return resumenDeColapso(escena).cuentas.get(id) ?? 0;
}

function conColapso(f: Forma, plegada: boolean): Forma {
  if (plegada) return { ...f, colapsado: true };
  const resto: Forma = { ...f };
  delete resto.colapsado;
  return resto;
}

/**
 * Pliega (`plegada: true`) o despliega las formas `ids`. Una forma **sin hijos no se pliega**; lo que no es una forma se ignora; las
 * bloqueadas sí se pliegan (no se edita su contenido, DY78). Devuelve la misma escena si nada cambia.
 */
export function fijarColapso(escena: Escena, ids: Iterable<string>, plegada: boolean): Escena {
  const objetivo = new Set(ids);
  const { hijos } = plegada ? hijosPorForma(escena) : { hijos: new Map<string, string[]>() };
  let cambio = false;
  const elementos = escena.elementos.map((e) => {
    if (e.tipo !== 'forma' || !objetivo.has(e.id)) return e;
    if ((e.colapsado === true) === plegada) return e;
    if (plegada && (hijos.get(e.id)?.length ?? 0) === 0) return e;
    cambio = true;
    return conColapso(e, plegada);
  });
  return cambio ? { ...escena, elementos } : escena;
}

/** Pliega la forma si está desplegada y tiene hijos, o la despliega si está plegada. Misma escena si no se puede. */
export function alternarColapso(escena: Escena, id: string): Escena {
  const f = escena.elementos.find((e) => e.id === id);
  if (!f || f.tipo !== 'forma') return escena;
  return fijarColapso(escena, [id], f.colapsado !== true);
}
