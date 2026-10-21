// ─── Conectores en el editor (W7) ─────────────────────────────────────────────
// Lógica pura (sin React ni DOM) de lo que el editor hace con las líneas pegadas a formas: qué
// asas ofrece una línea seleccionada, cómo se arrastra un extremo o un punto intermedio y a qué
// puerto se pega un extremo al dibujar. Mismo patrón que `gestos.ts`: cada fotograma se calcula
// desde la escena inicial, así el arrastre no acumula error y soltar es una sola entrada de historial.

import {
  actualizar,
  cambiarEstilo,
  insertarVia,
  moverVia,
  puertoCercano,
  puntoMedio,
  quitarVia,
  sincronizarConectores,
  soltarExtremo,
  trazadoDeLinea,
  type Conexion,
  type Escena,
  type Extremo,
  type Linea,
  type Punto,
  type PuertoCercano,
  type Trazado,
} from "@lumina/drawing";
import { bloqueadosEfectivos } from "./asas.js";

/** Distancia (píxeles de pantalla) a la que un puerto atrae a un extremo. */
export const RADIO_PUERTO_PX = 14;
/** Tolerancia (píxeles de pantalla) para agarrar una asa del conector. */
export const TOLERANCIA_AGARRE_PX = 9;
/** Radio de las esquinas redondeadas de un conector ortogonal. */
export const RADIO_ESQUINA = 14;

export type Agarre =
  | { tipo: "extremo"; cual: "origen" | "destino"; punto: Punto }
  | { tipo: "via"; indice: number; punto: Punto }
  | { tipo: "insertar"; tramo: number; punto: Punto };

/** La línea seleccionada, si lo seleccionado es exactamente una línea que se puede editar. */
export function lineaUnica(escena: Escena, seleccion: readonly string[]): Linea | null {
  if (seleccion.length !== 1) return null;
  const e = escena.elementos.find((x) => x.id === seleccion[0]);
  if (e?.tipo !== "linea" || bloqueadosEfectivos(escena).has(e.id)) return null;
  return e;
}

/** Asas de una línea: sus dos extremos, sus puntos intermedios y un punto para crear uno nuevo en cada tramo. */
export function agarresDeConector(escena: Escena, linea: Linea): Agarre[] {
  const t = trazadoDeLinea(escena, linea);
  const salida: Agarre[] = [
    { tipo: "extremo", cual: "origen", punto: t.inicio },
    { tipo: "extremo", cual: "destino", punto: t.fin },
  ];
  for (let i = 1; i < linea.puntos.length - 1; i++) salida.push({ tipo: "via", indice: i, punto: { ...(linea.puntos[i] as Punto) } });
  t.tramos.forEach((tramo, i) => salida.push({ tipo: "insertar", tramo: i, punto: puntoMedio(tramo) }));
  return salida;
}

/** Asa bajo `punto` (coordenadas de escena): extremos y puntos intermedios mandan sobre los de crear uno nuevo. */
export function agarreEn(escena: Escena, linea: Linea, punto: Punto, zoom: number): Agarre | null {
  const tol = TOLERANCIA_AGARRE_PX / zoom;
  const cerca = (a: Agarre): boolean => Math.hypot(a.punto.x - punto.x, a.punto.y - punto.y) <= tol;
  const todos = agarresDeConector(escena, linea);
  for (const tipo of ["extremo", "via", "insertar"] as const) {
    const a = todos.find((g) => g.tipo === tipo && cerca(g));
    if (a) return a;
  }
  return null;
}

// ─── Gestos ───────────────────────────────────────────────────────────────────

export type GestoConector =
  | { tipo: "extremo"; base: Escena; id: string; cual: "origen" | "destino" }
  | { tipo: "via"; base: Escena; id: string; indice: number }
  | { tipo: "insertar"; base: Escena; id: string; tramo: number };

export function iniciarConector(base: Escena, id: string, agarre: Agarre): GestoConector {
  if (agarre.tipo === "extremo") return { tipo: "extremo", base, id, cual: agarre.cual };
  if (agarre.tipo === "via") return { tipo: "via", base, id, indice: agarre.indice };
  return { tipo: "insertar", base, id, tramo: agarre.tramo };
}

export interface EntradaConector {
  /** Posición del puntero en la escena, sin imantar. */
  puntero: Punto;
  /** Esa misma posición con el imán de cuadrícula y guías (para lo que queda libre). */
  imantado: Punto;
  zoom: number;
  /** Ctrl: sin imán de puertos. */
  sinImanDePuertos: boolean;
}

export interface ResultadoConector {
  escena: Escena;
  /** Puerto al que está pegado el extremo que se arrastra (para resaltarlo). */
  puerto: PuertoCercano | null;
}

export function avanzarConector(g: GestoConector, e: EntradaConector): ResultadoConector {
  if (g.tipo === "extremo") {
    const radio = e.sinImanDePuertos ? 0 : RADIO_PUERTO_PX / e.zoom;
    const cerca = radio > 0 ? puertoCercano(g.base, e.puntero, radio) : null;
    const r = soltarExtremo(g.base, g.id, g.cual, cerca ? e.puntero : e.imantado, { radio: cerca ? radio : 0 });
    return { escena: sincronizarConectores(r.escena), puerto: r.puerto };
  }
  if (g.tipo === "via") return { escena: sincronizarConectores(moverVia(g.base, g.id, g.indice, e.imantado)), puerto: null };
  return { escena: sincronizarConectores(insertarVia(g.base, g.id, g.tramo, e.imantado)), puerto: null };
}

/** Quita el punto intermedio `indice` (doble clic sobre su asa). */
export const quitarPuntoIntermedio = (escena: Escena, id: string, indice: number): Escena => sincronizarConectores(quitarVia(escena, id, indice));

// ─── Al dibujar una línea ─────────────────────────────────────────────────────

export interface PuntoDeLinea {
  punto: Punto;
  /** Puerto al que se pegó el punto, si lo hubo. */
  puerto: PuertoCercano | null;
}

/**
 * Dónde cae un punto de la línea que se está dibujando: pegado al puerto cercano si lo hay (Ctrl lo
 * suspende); si no, el punto ya imantado (con Mayús, restringido por `restringir`).
 */
export function resolverPuntoDeLinea(
  escena: Escena,
  puntero: Punto,
  imantado: Punto,
  opciones: { zoom: number; sinImanDePuertos: boolean; restringir?: (p: Punto) => Punto },
): PuntoDeLinea {
  const cerca = opciones.sinImanDePuertos ? null : puertoCercano(escena, puntero, RADIO_PUERTO_PX / opciones.zoom);
  if (cerca) return { punto: { ...cerca.punto }, puerto: cerca };
  return { punto: opciones.restringir ? opciones.restringir(imantado) : imantado, puerto: null };
}

export const aConexion = (p: PuertoCercano | null): Conexion | undefined => (p ? { elementoId: p.elementoId, puerto: p.puerto } : undefined);

// ─── Barra del conector ───────────────────────────────────────────────────────

export const TRAZADOS_OPCIONES: ReadonlyArray<{ valor: Trazado; etiqueta: string }> = [
  { valor: "recto", etiqueta: "Recto" },
  { valor: "ortogonal", etiqueta: "En ángulo recto" },
  { valor: "curvo", etiqueta: "Curvo" },
];

export const EXTREMOS_OPCIONES: ReadonlyArray<{ valor: Extremo; etiqueta: string }> = [
  { valor: "ninguno", etiqueta: "Ninguno" },
  { valor: "flecha", etiqueta: "Flecha" },
  { valor: "flecha-abierta", etiqueta: "Flecha abierta" },
  { valor: "circulo", etiqueta: "Círculo" },
  { valor: "rombo", etiqueta: "Rombo" },
];

/** Líneas entre los elementos elegidos (la barra del conector aparece si lo elegido son solo líneas). */
export function lineasElegidas(escena: Escena, seleccion: readonly string[]): Linea[] {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  if (elegidos.length === 0 || elegidos.some((e) => e.tipo !== "linea")) return [];
  const bloqueados = bloqueadosEfectivos(escena);
  return elegidos.filter((e): e is Linea => e.tipo === "linea" && !bloqueados.has(e.id));
}

export const cambiarTrazado = (escena: Escena, ids: readonly string[], trazado: Trazado): Escena => actualizar(escena, ids, { trazado });
export const cambiarExtremo = (escena: Escena, ids: readonly string[], cual: "inicio" | "fin", extremo: Extremo): Escena => actualizar(escena, ids, { [cual]: extremo });
export const cambiarEsquinas = (escena: Escena, ids: readonly string[], redondeadas: boolean): Escena =>
  cambiarEstilo(escena, ids, { estilo: { radio: redondeadas ? RADIO_ESQUINA : 0 } });

/** Valor común de una propiedad entre varias líneas, o `null` si difieren. */
export function valorComun<T>(lineas: readonly Linea[], leer: (l: Linea) => T): T | null {
  const primero = lineas[0];
  if (!primero) return null;
  const v = leer(primero);
  return lineas.every((l) => leer(l) === v) ? v : null;
}

/**
 * Selección sin las líneas que ya siguen a una forma elegida. Alinear y distribuir mueven pieza por
 * pieza: una línea pegada que se moviera sola se despegaría; así que se deja que siga a su forma.
 */
export function sinConectoresQueSiguen(escena: Escena, seleccion: readonly string[]): string[] {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const incluidos = new Set<string>();
  const sumar = (id: string): void => {
    if (incluidos.has(id)) return;
    incluidos.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(sumar);
  };
  seleccion.forEach(sumar);
  return seleccion.filter((id) => {
    const e = porId.get(id);
    return !(e?.tipo === "linea" && ((e.origen && incluidos.has(e.origen.elementoId)) || (e.destino && incluidos.has(e.destino.elementoId))));
  });
}
