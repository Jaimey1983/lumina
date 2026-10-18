// ─── Gestos de arrastre del editor (W5) ───────────────────────────────────────
// Un gesto parte SIEMPRE de la escena inicial (`base`) y recalcula el resultado a partir del punto
// actual: así cien fotogramas de arrastre no acumulan error y soltar el ratón es una sola
// entrada de historial. Lógica pura: sin React ni DOM.

import {
  ajustar,
  ajustarCaja,
  cajaDeSeleccion,
  elementoEn,
  elementosEn,
  mover,
  redimensionar,
  rotar,
  rotarA,
  type Asa,
  type Caja,
  type Escena,
  type Guia,
  type Punto,
} from "@lumina/drawing";
import { bloqueadosEfectivos, centroDelMarco, marcoDeSeleccion } from "./asas.js";

export interface Modificadores {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
}

export interface OpcionesGesto {
  /** Lado de la cuadrícula (0 o ausente = sin cuadrícula). */
  cuadricula?: number;
  /** Imantar a los bordes y centros de los demás elementos. */
  guias: boolean;
  /** Zoom actual: las tolerancias están en píxeles de pantalla. */
  zoom: number;
}

export type Gesto =
  | { tipo: "mover"; base: Escena; ids: string[]; inicio: Punto; caja: Caja }
  | { tipo: "redimensionar"; base: Escena; ids: string[]; asa: Asa; inicio: Punto }
  | { tipo: "rotar"; base: Escena; ids: string[]; inicio: Punto; centro: Punto; unico: boolean }
  | { tipo: "recuadro"; base: Escena; inicio: Punto; previa: string[]; aditivo: boolean };

export interface ResultadoGesto {
  escena: Escena;
  /** Selección que resulta (solo el gesto de recuadro la cambia). */
  seleccion?: string[];
  guias: Guia[];
  recuadro?: Caja;
}

const grados = (r: number): number => (r * 180) / Math.PI;
const angulo = (centro: Punto, p: Punto): number => grados(Math.atan2(p.y - centro.y, p.x - centro.x));

/** Elementos de la selección que se pueden transformar. */
export function idsEditables(escena: Escena, ids: readonly string[]): string[] {
  const bloqueados = bloqueadosEfectivos(escena);
  return ids.filter((id) => !bloqueados.has(id));
}

// ─── Inicio ───────────────────────────────────────────────────────────────────

export function iniciarMover(base: Escena, seleccion: readonly string[], inicio: Punto): Gesto | null {
  const ids = idsEditables(base, seleccion);
  const caja = cajaDeSeleccion(base, ids);
  return ids.length > 0 && caja ? { tipo: "mover", base, ids, inicio, caja } : null;
}

export function iniciarRedimensionar(base: Escena, seleccion: readonly string[], asa: Asa, inicio: Punto): Gesto | null {
  const ids = idsEditables(base, seleccion);
  const marco = marcoDeSeleccion(base, ids);
  if (ids.length === 0 || !marco) return null;
  return { tipo: "redimensionar", base, ids, asa, inicio };
}

export function iniciarRotar(base: Escena, seleccion: readonly string[], inicio: Punto): Gesto | null {
  const ids = idsEditables(base, seleccion);
  const marco = marcoDeSeleccion(base, ids);
  if (ids.length === 0 || !marco) return null;
  const solo = ids.length === 1 ? base.elementos.find((e) => e.id === ids[0]) : undefined;
  const unico = solo?.tipo === "forma" || solo?.tipo === "texto";
  return { tipo: "rotar", base, ids, inicio, centro: centroDelMarco(marco), unico };
}

export function iniciarRecuadro(base: Escena, inicio: Punto, aditivo: boolean, seleccionActual: readonly string[]): Gesto {
  return { tipo: "recuadro", base, inicio, previa: aditivo ? [...seleccionActual] : [], aditivo };
}

// ─── Avance ───────────────────────────────────────────────────────────────────

function avanzarMover(g: Extract<Gesto, { tipo: "mover" }>, p: Punto, mod: Modificadores, o: OpcionesGesto): ResultadoGesto {
  let dx = p.x - g.inicio.x;
  let dy = p.y - g.inicio.y;
  // Mayús: solo en horizontal o solo en vertical, según hacia dónde se movió más.
  if (mod.shift) {
    if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
    else dx = 0;
  }
  let guias: Guia[] = [];
  if (!mod.ctrl && (o.guias || o.cuadricula)) {
    const movida: Caja = { ...g.caja, x: g.caja.x + dx, y: g.caja.y + dy };
    const r = ajustarCaja(movida, g.base, {
      excluir: g.ids,
      guias: o.guias,
      umbral: 6 / o.zoom,
      ...(o.cuadricula ? { cuadricula: o.cuadricula } : {}),
    });
    if (!mod.shift || dx !== 0) dx += r.dx;
    if (!mod.shift || dy !== 0) dy += r.dy;
    guias = r.guias;
  }
  return { escena: mover(g.base, g.ids, dx, dy), guias };
}

function avanzarRedimensionar(g: Extract<Gesto, { tipo: "redimensionar" }>, p: Punto, mod: Modificadores, o: OpcionesGesto): ResultadoGesto {
  let dx = p.x - g.inicio.x;
  let dy = p.y - g.inicio.y;
  let guias: Guia[] = [];
  const marco = marcoDeSeleccion(g.base, g.ids);
  // Solo se imanta cuando el marco no está girado: con giro, el borde arrastrado no es horizontal ni vertical.
  if (marco && marco.rotacion === 0 && !mod.ctrl && (o.guias || o.cuadricula)) {
    const mueveX = g.asa.includes("e") || g.asa.includes("w");
    const mueveY = g.asa.includes("n") || g.asa.includes("s");
    const arrastrado: Punto = {
      x: g.asa.includes("e") ? marco.x + marco.ancho : g.asa.includes("w") ? marco.x : marco.x + marco.ancho / 2,
      y: g.asa.includes("s") ? marco.y + marco.alto : g.asa.includes("n") ? marco.y : marco.y + marco.alto / 2,
    };
    const r = ajustar({ x: arrastrado.x + dx, y: arrastrado.y + dy }, g.base, {
      excluir: g.ids,
      guias: o.guias,
      umbral: 6 / o.zoom,
      ...(o.cuadricula ? { cuadricula: o.cuadricula } : {}),
    });
    if (mueveX) dx = r.punto.x - arrastrado.x;
    if (mueveY) dy = r.punto.y - arrastrado.y;
    guias = r.guias.filter((gu) => (gu.orientacion === "vertical" ? mueveX : mueveY));
  }
  return {
    escena: redimensionar(g.base, g.ids, g.asa, dx, dy, { proporcional: mod.shift, desdeCentro: mod.alt }),
    guias,
  };
}

function avanzarRotar(g: Extract<Gesto, { tipo: "rotar" }>, p: Punto, mod: Modificadores): ResultadoGesto {
  const delta = angulo(g.centro, p) - angulo(g.centro, g.inicio);
  const ajuste = mod.shift ? 15 : undefined;
  if (g.unico) {
    const id = g.ids[0];
    const actual = g.base.elementos.find((e) => e.id === id);
    const rotacionInicial = actual && (actual.tipo === "forma" || actual.tipo === "texto") ? actual.transformacion.rotacion : 0;
    return { escena: id ? rotarA(g.base, id, rotacionInicial + delta, ajuste ? { ajustar: ajuste } : {}) : g.base, guias: [] };
  }
  return { escena: rotar(g.base, g.ids, delta, { centro: g.centro, ...(ajuste ? { ajustar: ajuste } : {}) }), guias: [] };
}

function avanzarRecuadro(g: Extract<Gesto, { tipo: "recuadro" }>, p: Punto): ResultadoGesto {
  const recuadro: Caja = {
    x: Math.min(g.inicio.x, p.x),
    y: Math.min(g.inicio.y, p.y),
    ancho: Math.abs(p.x - g.inicio.x),
    alto: Math.abs(p.y - g.inicio.y),
  };
  const dentro = elementosEn(g.base, recuadro, { modo: "contenidos" });
  const seleccion = g.aditivo ? [...new Set([...g.previa, ...dentro])] : dentro;
  return { escena: g.base, seleccion, guias: [], recuadro };
}

export function avanzarGesto(g: Gesto, punto: Punto, mod: Modificadores, opciones: OpcionesGesto): ResultadoGesto {
  switch (g.tipo) {
    case "mover":
      return avanzarMover(g, punto, mod, opciones);
    case "redimensionar":
      return avanzarRedimensionar(g, punto, mod, opciones);
    case "rotar":
      return avanzarRotar(g, punto, mod);
    case "recuadro":
      return avanzarRecuadro(g, punto);
  }
}

// ─── Selección por clic ───────────────────────────────────────────────────────

/**
 * Qué queda seleccionado al hacer clic en `punto`. Sin Mayús: el elemento de abajo (si ya estaba
 * seleccionado se conserva toda la selección, para poder arrastrarla); en el vacío, nada.
 * Con Mayús: agrega o quita ese elemento.
 */
export function seleccionAlHacerClic(escena: Escena, seleccion: readonly string[], punto: Punto, shift: boolean, zoom: number): string[] {
  const id = elementoEn(escena, punto, { tolerancia: 6 / zoom });
  if (id === undefined) return shift ? [...seleccion] : [];
  if (shift) return seleccion.includes(id) ? seleccion.filter((s) => s !== id) : [...seleccion, id];
  return seleccion.includes(id) ? [...seleccion] : [id];
}
