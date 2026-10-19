// ─── Conectar líneas a formas (W7) ────────────────────────────────────────────
// Operaciones puras e inmutables (devuelven la misma escena si no hay nada que cambiar).
// Invariante que mantiene `sincronizarConectores`: los extremos pegados a una forma guardan en
// `puntos` la posición real de su puerto, así lo que lee el resto del motor (cajas, impacto,
// historial) y lo que queda si la forma desaparece coincide con lo que se ve.

import { LIMITES } from '../normalizar.js';
import { bloqueadosEfectivos } from '../operaciones/utilidades.js';
import type { Conexion, Elemento, Escena, Forma, Linea, Punto } from '../tipos.js';
import { cantidadDePuertos, puertoCercano, puntoDePuerto, type PuertoCercano } from './puertos.js';
import { trazarLinea, type TrazadoLinea } from './trazado.js';

const r2 = (v: number): number => Math.round(v * 100) / 100;
const punto = (p: Punto): Punto => ({ x: r2(p.x), y: r2(p.y) });

export type ExtremoConector = 'origen' | 'destino';

function formasDe(escena: Escena): Map<string, Forma> {
  return new Map(escena.elementos.filter((e): e is Forma => e.tipo === 'forma').map((f) => [f.id, f]));
}

/** El trazado de una línea de la escena tal como se dibuja. */
export const trazadoDeLinea = (escena: Escena, linea: Linea): TrazadoLinea => trazarLinea(linea, formasDe(escena));

function conCambios(escena: Escena, cambios: Map<string, Elemento>): Escena {
  if (cambios.size === 0) return escena;
  return { ...escena, elementos: escena.elementos.map((e) => cambios.get(e.id) ?? e) };
}

function conPuntos(l: Linea, puntos: Punto[]): Linea {
  return { ...l, puntos };
}

function mismosPuntos(a: readonly Punto[], b: readonly Punto[]): boolean {
  return a.length === b.length && a.every((p, i) => p.x === (b[i] as Punto).x && p.y === (b[i] as Punto).y);
}

/**
 * Pone en `puntos[0]` y `puntos[n-1]` la posición real de los puertos a los que está pegada cada
 * línea, y quita las conexiones a formas que ya no existen (la línea se queda donde estaba dibujada).
 * Se llama después de cualquier cambio que pueda mover, girar, redimensionar o borrar formas.
 */
export function sincronizarConectores(escena: Escena): Escena {
  const formas = formasDe(escena);
  const cambios = new Map<string, Elemento>();
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || (!e.origen && !e.destino)) continue;
    const origenVivo = e.origen && formas.has(e.origen.elementoId) ? e.origen : undefined;
    const destinoVivo = e.destino && formas.has(e.destino.elementoId) ? e.destino : undefined;
    const puntos = e.puntos.map((p) => ({ ...p }));
    if (origenVivo) puntos[0] = punto(puntoDePuerto(formas.get(origenVivo.elementoId) as Forma, origenVivo.puerto));
    if (destinoVivo) puntos[puntos.length - 1] = punto(puntoDePuerto(formas.get(destinoVivo.elementoId) as Forma, destinoVivo.puerto));
    const igual = mismosPuntos(puntos, e.puntos) && origenVivo === e.origen && destinoVivo === e.destino;
    if (!igual) cambios.set(e.id, conExtremos(e, puntos, origenVivo, destinoVivo));
  }
  return conCambios(escena, cambios);
}

function lineaEditable(escena: Escena, id: string): Linea | undefined {
  const l = escena.elementos.find((e) => e.id === id);
  if (l?.tipo !== 'linea' || bloqueadosEfectivos(escena).has(id)) return undefined;
  return l;
}

/** La línea con otros puntos y otras conexiones (sin dejar claves `undefined`). */
function conExtremos(l: Linea, puntos: Punto[], origen: Conexion | undefined, destino: Conexion | undefined): Linea {
  const nueva: Linea = { ...l, puntos };
  if (origen) nueva.origen = origen;
  else delete nueva.origen;
  if (destino) nueva.destino = destino;
  else delete nueva.destino;
  return nueva;
}

const indiceDeExtremo = (l: Linea, extremo: ExtremoConector): number => (extremo === 'origen' ? 0 : l.puntos.length - 1);

/** Pega un extremo de la línea al puerto `conexion`, o lo despega (`null`) dejándolo donde está. */
export function conectar(escena: Escena, lineaId: string, extremo: ExtremoConector, conexion: Conexion | null): Escena {
  const l = lineaEditable(escena, lineaId);
  if (!l) return escena;
  const formas = formasDe(escena);
  const indice = indiceDeExtremo(l, extremo);
  const actual = l[extremo];
  const puntos = l.puntos.map((p) => ({ ...p }));
  let nuevaConexion: Conexion | undefined;
  if (conexion === null) {
    if (!actual) return escena;
    // Al despegar, el extremo conserva la posición que tenía.
    const forma = formas.get(actual.elementoId);
    if (forma) puntos[indice] = punto(puntoDePuerto(forma, actual.puerto));
  } else {
    const forma = formas.get(conexion.elementoId);
    const puerto = Math.trunc(conexion.puerto);
    if (!forma || !Number.isFinite(puerto) || puerto < 0 || puerto >= cantidadDePuertos(forma)) return escena;
    if (actual && actual.elementoId === conexion.elementoId && actual.puerto === puerto) return escena;
    nuevaConexion = { elementoId: conexion.elementoId, puerto };
    puntos[indice] = punto(puntoDePuerto(forma, puerto));
  }
  const origen = extremo === 'origen' ? nuevaConexion : l.origen;
  const destino = extremo === 'destino' ? nuevaConexion : l.destino;
  return conCambios(escena, new Map([[l.id, conExtremos(l, puntos, origen, destino)]]));
}

export interface OpcionesSoltar {
  /** Distancia máxima (en unidades de escena) a la que un puerto «atrae» al extremo. 0 = nunca se pega. */
  radio: number;
}

export interface ResultadoSoltar {
  escena: Escena;
  /** El puerto al que quedó pegado, si lo hubo (para resaltarlo mientras se arrastra). */
  puerto: PuertoCercano | null;
}

/**
 * Lleva un extremo de la línea a `lugar`: si hay un puerto (de otra forma o de la misma) dentro del
 * radio, se pega ahí; si no, queda libre en ese punto. Sirve igual para un fotograma de arrastre que
 * para la suelta final.
 */
export function soltarExtremo(escena: Escena, lineaId: string, extremo: ExtremoConector, lugar: Punto, opciones: OpcionesSoltar): ResultadoSoltar {
  const l = lineaEditable(escena, lineaId);
  if (!l || !Number.isFinite(lugar.x) || !Number.isFinite(lugar.y)) return { escena, puerto: null };
  const cercano = opciones.radio > 0 ? puertoCercano(escena, lugar, opciones.radio) : null;
  if (cercano) return { escena: conectar(escena, lineaId, extremo, { elementoId: cercano.elementoId, puerto: cercano.puerto }), puerto: cercano };
  const puntos = l.puntos.map((p) => ({ ...p }));
  puntos[indiceDeExtremo(l, extremo)] = punto(lugar);
  const origen = extremo === 'origen' ? undefined : l.origen;
  const destino = extremo === 'destino' ? undefined : l.destino;
  if (mismosPuntos(puntos, l.puntos) && l[extremo] === undefined) return { escena, puerto: null };
  return { escena: conCambios(escena, new Map([[l.id, conExtremos(l, puntos, origen, destino)]])), puerto: null };
}

// ─── Puntos intermedios ───────────────────────────────────────────────────────

/** Mueve el punto intermedio `indice` (1 … n-2 de `puntos`). */
export function moverVia(escena: Escena, lineaId: string, indice: number, lugar: Punto): Escena {
  const l = lineaEditable(escena, lineaId);
  if (!l || !Number.isInteger(indice) || indice < 1 || indice > l.puntos.length - 2) return escena;
  if (!Number.isFinite(lugar.x) || !Number.isFinite(lugar.y)) return escena;
  const nuevo = punto(lugar);
  const actual = l.puntos[indice] as Punto;
  if (actual.x === nuevo.x && actual.y === nuevo.y) return escena;
  const puntos = l.puntos.map((p, i) => (i === indice ? nuevo : { ...p }));
  return conCambios(escena, new Map([[l.id, conPuntos(l, puntos)]]));
}

/** Agrega un punto intermedio en `lugar` dentro del tramo `tramo` (0 = entre el primer y el segundo punto). */
export function insertarVia(escena: Escena, lineaId: string, tramo: number, lugar: Punto): Escena {
  const l = lineaEditable(escena, lineaId);
  if (!l || !Number.isInteger(tramo) || tramo < 0 || tramo > l.puntos.length - 2) return escena;
  if (l.puntos.length >= LIMITES.puntosPorLinea || !Number.isFinite(lugar.x) || !Number.isFinite(lugar.y)) return escena;
  const puntos = l.puntos.map((p) => ({ ...p }));
  puntos.splice(tramo + 1, 0, punto(lugar));
  return conCambios(escena, new Map([[l.id, conPuntos(l, puntos)]]));
}

/** Quita el punto intermedio `indice`; la línea vuelve a enrutarse sola entre los vecinos. */
export function quitarVia(escena: Escena, lineaId: string, indice: number): Escena {
  const l = lineaEditable(escena, lineaId);
  if (!l || !Number.isInteger(indice) || indice < 1 || indice > l.puntos.length - 2) return escena;
  const puntos = l.puntos.filter((_, i) => i !== indice).map((p) => ({ ...p }));
  return conCambios(escena, new Map([[l.id, conPuntos(l, puntos)]]));
}

/** Líneas pegadas a la forma `formaId` (por cualquiera de sus extremos). */
export function conectoresDe(escena: Escena, formaId: string): Linea[] {
  return escena.elementos.filter((e): e is Linea => e.tipo === 'linea' && (e.origen?.elementoId === formaId || e.destino?.elementoId === formaId));
}

/**
 * Copia de la escena pensada solo para detectar clics: cada línea se reemplaza por su recorrido real
 * (el de un conector ortogonal o curvo no es la recta entre sus extremos). No es una escena para guardar.
 */
export function escenaConRutas(escena: Escena): Escena {
  const formas = formasDe(escena);
  const cambios = new Map<string, Elemento>();
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || e.trazado === 'recto') continue;
    cambios.set(e.id, conExtremos({ ...e, trazado: 'recto' }, trazarLinea(e, formas).polilinea, undefined, undefined));
  }
  return conCambios(escena, cambios);
}
