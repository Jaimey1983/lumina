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
  elementosEnPoligono,
  mover,
  redimensionar,
  rotar,
  rotarA,
  type Asa,
  type Caja,
  type Cota,
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
  /** Las guías que puso la persona (Y16a): imantan aunque `guias` esté apagado. Ctrl lo suspende, como todo el imán. */
  guiasUsuario?: ReadonlyArray<{ orientacion: "vertical" | "horizontal"; posicion: number }>;
}

export type Gesto =
  | { tipo: "mover"; base: Escena; ids: string[]; inicio: Punto; caja: Caja }
  | { tipo: "redimensionar"; base: Escena; ids: string[]; asa: Asa; inicio: Punto }
  | { tipo: "rotar"; base: Escena; ids: string[]; inicio: Punto; centro: Punto; unico: boolean }
  | { tipo: "recuadro"; base: Escena; inicio: Punto; previa: string[]; aditivo: boolean }
  /** Lazo (Y15): `Alt` + arrastrar en un vacío dibuja un polígono libre; `puntos` crece con el arrastre y `inicial` es la selección de antes. */
  | { tipo: "lazo"; base: Escena; puntos: Punto[]; inicial: string[]; aditivo: boolean };

export interface ResultadoGesto {
  escena: Escena;
  /** Selección que resulta (solo el gesto de recuadro la cambia). */
  seleccion?: string[];
  guias: Guia[];
  recuadro?: Caja;
  /** El polígono del lazo hasta ahora (solo el gesto de lazo). */
  lazo?: Punto[];
  /** Cotas de espaciado igual y de distancia a las vecinas (solo al mover, con el imán a otros elementos; Y16b). */
  cotas?: Cota[];
  /** Lo que se está midiendo, para la etiqueta junto al cursor: «X 120 · Y 45», «200 × 80» o «45°» (Y16b). */
  etiqueta?: string;
}

/** Un número para la etiqueta: hasta un decimal, con coma. */
const num = (v: number): string => String(Math.round(v * 10) / 10).replace(".", ",");
const gradosPositivos = (g: number): number => ((g % 360) + 360) % 360;

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

export function iniciarLazo(base: Escena, inicio: Punto, aditivo: boolean, seleccionActual: readonly string[]): Gesto {
  return { tipo: "lazo", base, puntos: [inicio], inicial: [...seleccionActual], aditivo };
}

// ─── Avance ───────────────────────────────────────────────────────────────────

const hayGuiasUsuario = (o: OpcionesGesto): boolean => (o.guiasUsuario?.length ?? 0) > 0;

function avanzarMover(g: Extract<Gesto, { tipo: "mover" }>, p: Punto, mod: Modificadores, o: OpcionesGesto): ResultadoGesto {
  let dx = p.x - g.inicio.x;
  let dy = p.y - g.inicio.y;
  // Mayús: solo en horizontal o solo en vertical, según hacia dónde se movió más.
  if (mod.shift) {
    if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
    else dx = 0;
  }
  let guias: Guia[] = [];
  let cotas: Cota[] = [];
  if (!mod.ctrl && (o.guias || o.cuadricula || hayGuiasUsuario(o))) {
    const movida: Caja = { ...g.caja, x: g.caja.x + dx, y: g.caja.y + dy };
    const r = ajustarCaja(movida, g.base, {
      excluir: g.ids,
      guias: o.guias,
      umbral: 6 / o.zoom,
      // El reparto igual y las cotas son parte del imán a otros elementos: lo siguen en el interruptor y en Ctrl.
      espaciado: o.guias,
      ...(o.cuadricula ? { cuadricula: o.cuadricula } : {}),
      ...(hayGuiasUsuario(o) ? { guiasUsuario: o.guiasUsuario } : {}),
    });
    if (!mod.shift || dx !== 0) dx += r.dx;
    if (!mod.shift || dy !== 0) dy += r.dy;
    guias = r.guias;
    // Con Mayús un eje queda fijo y las cotas del otro ya no describen la posición final: no se muestran.
    cotas = mod.shift ? [] : (r.cotas ?? []);
  }
  const escena = mover(g.base, g.ids, dx, dy);
  const caja = cajaDeSeleccion(escena, g.ids);
  return { escena, guias, cotas, ...(caja ? { etiqueta: `X ${num(caja.x)} · Y ${num(caja.y)}` } : {}) };
}

function avanzarRedimensionar(g: Extract<Gesto, { tipo: "redimensionar" }>, p: Punto, mod: Modificadores, o: OpcionesGesto): ResultadoGesto {
  let dx = p.x - g.inicio.x;
  let dy = p.y - g.inicio.y;
  let guias: Guia[] = [];
  const marco = marcoDeSeleccion(g.base, g.ids);
  // Solo se imanta cuando el marco no está girado: con giro, el borde arrastrado no es horizontal ni vertical.
  if (marco && marco.rotacion === 0 && !mod.ctrl && (o.guias || o.cuadricula || hayGuiasUsuario(o))) {
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
      ...(hayGuiasUsuario(o) ? { guiasUsuario: o.guiasUsuario } : {}),
    });
    if (mueveX) dx = r.punto.x - arrastrado.x;
    if (mueveY) dy = r.punto.y - arrastrado.y;
    guias = r.guias.filter((gu) => (gu.orientacion === "vertical" ? mueveX : mueveY));
  }
  const escena = redimensionar(g.base, g.ids, g.asa, dx, dy, { proporcional: mod.shift, desdeCentro: mod.alt });
  const caja = cajaDeSeleccion(escena, g.ids);
  return { escena, guias, ...(caja ? { etiqueta: `${num(caja.ancho)} × ${num(caja.alto)}` } : {}) };
}

function avanzarRotar(g: Extract<Gesto, { tipo: "rotar" }>, p: Punto, mod: Modificadores): ResultadoGesto {
  const delta = angulo(g.centro, p) - angulo(g.centro, g.inicio);
  const ajuste = mod.shift ? 15 : undefined;
  if (g.unico) {
    const id = g.ids[0];
    const actual = g.base.elementos.find((e) => e.id === id);
    const rotacionInicial = actual && (actual.tipo === "forma" || actual.tipo === "texto") ? actual.transformacion.rotacion : 0;
    const escena = id ? rotarA(g.base, id, rotacionInicial + delta, ajuste ? { ajustar: ajuste } : {}) : g.base;
    const girada = escena.elementos.find((e) => e.id === id);
    const grados = girada && (girada.tipo === "forma" || girada.tipo === "texto") ? girada.transformacion.rotacion : rotacionInicial + delta;
    return { escena, guias: [], etiqueta: `${num(gradosPositivos(grados))}°` };
  }
  // Varios elementos: lo que se llevan girado desde que se apretó.
  const girado = ajuste ? Math.round(delta / ajuste) * ajuste : delta;
  return { escena: rotar(g.base, g.ids, delta, { centro: g.centro, ...(ajuste ? { ajustar: ajuste } : {}) }), guias: [], etiqueta: `${num(gradosPositivos(girado))}°` };
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

/** Un punto nuevo del lazo solo se anota si se movió lo suficiente (el polígono no crece sin tope). */
const SEPARACION_MIN_LAZO = 2;
const MAX_PUNTOS_LAZO = 2000;

function avanzarLazo(g: Extract<Gesto, { tipo: "lazo" }>, p: Punto): ResultadoGesto {
  // El lazo es el único gesto con memoria: el polígono es lo que se fue dibujando, no solo el último punto.
  const ultimo = g.puntos[g.puntos.length - 1];
  if (!ultimo || (g.puntos.length < MAX_PUNTOS_LAZO && Math.hypot(p.x - ultimo.x, p.y - ultimo.y) >= SEPARACION_MIN_LAZO)) g.puntos.push(p);
  // Con menos de 3 puntos no hay área: se ignora y la selección queda como estaba.
  const dentro = elementosEnPoligono(g.base, g.puntos);
  const seleccion = g.puntos.length < 3 ? g.inicial : g.aditivo ? [...new Set([...g.inicial, ...dentro])] : dentro;
  return { escena: g.base, seleccion, guias: [], lazo: [...g.puntos] };
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
    case "lazo":
      return avanzarLazo(g, punto);
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
