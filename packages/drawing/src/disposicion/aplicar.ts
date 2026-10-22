// ─── Poner el resultado de una disposición en la escena (Y13) ─────────────────

import { conectar } from '../conectores/conectar.js';
import { puertosParaConectar, type ParDePuertos } from '../conectores/enlazar.js';
import { cantidadDePuertos, LADO_OPUESTO, ladoDePuerto, VECTOR_LADO, type Lado } from '../conectores/puertos.js';
import { mover } from '../operaciones/transformar.js';
import { mapaPadres, raizDe } from '../operaciones/utilidades.js';
import type { Escena, Forma } from '../tipos.js';
import { disponerCuadricula } from './cuadricula.js';
import { separarSueltos, type Grafo, type NodoDisposicion, type Posiciones } from './grafo.js';

/** Separación entre lo organizado y la cuadrícula de lo que no está conectado. */
const HUECO_SUELTOS = 80;

const centroDe = (n: NodoDisposicion, p: { x: number; y: number }): { x: number; y: number } => ({ x: p.x + n.ancho / 2, y: p.y + n.alto / 2 });

/**
 * Completa las posiciones de los conectados con las de los sueltos y fija el ancla.
 *
 * - **Ancla:** el primer nodo sin aristas de entrada (o, si todos las tienen, el primero) **no se mueve de sitio**: el
 *   resultado se traslada para que su centro quede donde estaba. Así la disposición no «salta» al ejecutarla.
 * - **Sueltos:** los que no tienen ninguna conexión van en una cuadrícula aparte, **debajo** de lo organizado y alineada
 *   con su borde izquierdo. Si no hay nada conectado, la cuadrícula ocupa el sitio donde estaban (misma esquina).
 */
export function componerPosiciones(grafo: Grafo, deConectados: Posiciones): Posiciones {
  const { conectados, sueltos } = separarSueltos(grafo);
  const resultado: Posiciones = new Map();

  let minX = Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  if (conectados.length > 0) {
    const entrantes = new Set(grafo.aristas.map((a) => a.hasta));
    const ancla = conectados.find((n) => !entrantes.has(n.id)) ?? (conectados[0] as NodoDisposicion);
    const nueva = deConectados.get(ancla.id) ?? { x: ancla.x, y: ancla.y };
    const antes = centroDe(ancla, { x: ancla.x, y: ancla.y });
    const ahora = centroDe(ancla, nueva);
    const dx = antes.x - ahora.x;
    const dy = antes.y - ahora.y;
    for (const n of conectados) {
      const p = deConectados.get(n.id) ?? { x: n.x, y: n.y };
      const q = { x: p.x + dx, y: p.y + dy };
      resultado.set(n.id, q);
      minX = Math.min(minX, q.x);
      minY = Math.min(minY, q.y);
      maxY = Math.max(maxY, q.y + n.alto);
    }
  }

  if (sueltos.length > 0) {
    const cuadricula = disponerCuadricula(sueltos);
    const origen =
      conectados.length > 0
        ? { x: minX, y: maxY + HUECO_SUELTOS }
        : { x: Math.min(...sueltos.map((n) => n.x)), y: Math.min(...sueltos.map((n) => n.y)) };
    for (const n of sueltos) {
      const p = cuadricula.get(n.id) as { x: number; y: number };
      resultado.set(n.id, { x: origen.x + p.x, y: origen.y + p.y });
    }
  }
  return resultado;
}

export interface OpcionesAplicar {
  /**
   * El sentido en que fluye el diagrama (hacia dónde van los hijos). Con él, un conector sale por el lado de ese sentido y
   * entra por el opuesto, como en un organigrama; los que van contra el flujo (el que cierra un ciclo) y las formas sin un
   * puerto en ese lado se resuelven con el par de puertos más corto que se miran. Sin él, siempre se usa ese par.
   */
  flujo?: Lado;
}

/** El puerto de la forma que sale por `lado`, o `null` si no tiene ninguno ahí. */
function puertoDelLado(forma: Forma, lado: Lado): number | null {
  for (let i = 0; i < cantidadDePuertos(forma); i++) if (ladoDePuerto(forma, i) === lado) return i;
  return null;
}

function parSegunFlujo(origen: Forma, destino: Forma, flujo: Lado): ParDePuertos | null {
  const v = VECTOR_LADO[flujo];
  const co = { x: origen.transformacion.x + origen.transformacion.ancho / 2, y: origen.transformacion.y + origen.transformacion.alto / 2 };
  const cd = { x: destino.transformacion.x + destino.transformacion.ancho / 2, y: destino.transformacion.y + destino.transformacion.alto / 2 };
  if ((cd.x - co.x) * v.x + (cd.y - co.y) * v.y <= 0) return null; // va contra el flujo
  const po = puertoDelLado(origen, flujo);
  const pd = puertoDelLado(destino, LADO_OPUESTO[flujo]);
  if (po === null || pd === null) return null;
  return { origen: { elementoId: origen.id, puerto: po }, destino: { elementoId: destino.id, puerto: pd } };
}

/**
 * Mueve cada nodo (los grupos, enteros) a su posición y vuelve a escoger los puertos de los conectores que unen dos
 * nodos movidos, para que salgan por el lado que mira al otro (o, con `flujo`, por el del sentido del diagrama). Los
 * conectores siguen pegados a las mismas formas; la ruta la recalcula quien llama con `sincronizarConectores`.
 * Devuelve la misma escena si nada se mueve.
 */
export function aplicarDisposicion(escena: Escena, grafo: Grafo, posiciones: Posiciones, opciones: OpcionesAplicar = {}): Escena {
  let actual = escena;
  const movidos = new Set<string>();
  for (const n of grafo.nodos) {
    const p = posiciones.get(n.id);
    if (!p) continue;
    const dx = p.x - n.x;
    const dy = p.y - n.y;
    if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) continue;
    actual = mover(actual, [n.id], dx, dy);
    movidos.add(n.id);
  }
  if (actual === escena) return escena;

  const padres = mapaPadres(actual);
  const enGrafo = new Set(grafo.nodos.map((n) => n.id));
  for (const e of actual.elementos) {
    if (e.tipo !== 'linea' || !e.origen || !e.destino) continue;
    const desde = raizDe(e.origen.elementoId, padres);
    const hasta = raizDe(e.destino.elementoId, padres);
    if (desde === hasta || !enGrafo.has(desde) || !enGrafo.has(hasta) || (!movidos.has(desde) && !movidos.has(hasta))) continue;
    const formaOrigen = actual.elementos.find((x): x is Forma => x.id === e.origen?.elementoId && x.tipo === 'forma');
    const formaDestino = actual.elementos.find((x): x is Forma => x.id === e.destino?.elementoId && x.tipo === 'forma');
    const segunFlujo = opciones.flujo && formaOrigen && formaDestino ? parSegunFlujo(formaOrigen, formaDestino, opciones.flujo) : null;
    const par = segunFlujo ?? puertosParaConectar(actual, e.origen.elementoId, e.destino.elementoId);
    if (!par) continue;
    actual = conectar(actual, e.id, 'origen', par.origen);
    actual = conectar(actual, e.id, 'destino', par.destino);
  }
  return actual;
}
