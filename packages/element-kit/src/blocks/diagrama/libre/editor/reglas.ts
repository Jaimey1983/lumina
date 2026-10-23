// ─── Reglas y guías del usuario (Y16a) ────────────────────────────────────────
// Lógica pura: sin React ni DOM. Las guías viven en el estado del editor (DY9): no van a la escena, al historial ni a la exportación.

import type { Punto } from "@lumina/drawing";

/** Separación mínima, en píxeles de pantalla, entre dos marcas con número. */
export const PX_ENTRE_NUMEROS = 60;

/** Un paso «bonito» (1, 2 o 5 por una potencia de diez) en unidades de escena. */
export function pasoDeRegla(zoom: number, pxMinimo = PX_ENTRE_NUMEROS): number {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const minimo = pxMinimo / z;
  const potencia = Math.pow(10, Math.floor(Math.log10(minimo)));
  for (const m of [1, 2, 5, 10]) if (m * potencia >= minimo - 1e-9) return redondear(m * potencia);
  return redondear(10 * potencia);
}

/** Cuántas marcas chicas caben entre dos con número: se eligen para que caigan en valores redondos (1, 2→0,5, 5→1). */
function subdivisiones(paso: number): number {
  const mantisa = Math.round(paso / Math.pow(10, Math.floor(Math.log10(paso))));
  return mantisa === 2 ? 4 : 5;
}

/** Quita el ruido de coma flotante (0,30000000000000004 → 0,3). */
const redondear = (n: number): number => Math.round(n * 1e6) / 1e6;

export interface Marca {
  /** Posición en unidades de escena. */
  valor: number;
  /** Lleva número (las otras son rayitas). */
  mayor: boolean;
}

/**
 * Las marcas de una regla que muestra de `desde` a `hasta` (unidades de escena) con ese zoom: una con número cada paso
 * «bonito» y rayitas entre medias. Siempre son múltiplos exactos del paso (no se acumula error), van en orden, sin repetir.
 */
export function marcasDeRegla(zoom: number, desde: number, hasta: number): Marca[] {
  if (!Number.isFinite(desde) || !Number.isFinite(hasta) || hasta < desde) return [];
  const paso = pasoDeRegla(zoom);
  const n = subdivisiones(paso);
  const chico = paso / n;
  const primero = Math.floor(desde / chico);
  const ultimo = Math.ceil(hasta / chico);
  const marcas: Marca[] = [];
  for (let i = primero; i <= ultimo; i++) marcas.push({ valor: redondear(i * chico), mayor: i % n === 0 });
  return marcas;
}

/** El número de una marca («1 200», «0,5»). */
export function textoDeMarca(valor: number): string {
  const v = redondear(valor);
  return Number.isInteger(v) ? String(v) : String(v).replace(".", ",");
}

// ─── Guías ────────────────────────────────────────────────────────────────────

export type OrientacionGuia = "vertical" | "horizontal";

export interface GuiaUsuario {
  id: number;
  orientacion: OrientacionGuia;
  /** x (vertical) o y (horizontal), en unidades de escena. */
  posicion: number;
}

export const MAX_GUIAS = 50;

/** La guía nueva al final, o `null` si ya hay 50. La posición se redondea a la unidad. */
export function agregarGuia(guias: readonly GuiaUsuario[], orientacion: OrientacionGuia, posicion: number): GuiaUsuario[] | null {
  if (guias.length >= MAX_GUIAS || !Number.isFinite(posicion)) return null;
  const id = guias.reduce((m, g) => Math.max(m, g.id), 0) + 1;
  return [...guias, { id, orientacion, posicion: Math.round(posicion) }];
}

export function moverGuia(guias: readonly GuiaUsuario[], id: number, posicion: number): GuiaUsuario[] {
  if (!Number.isFinite(posicion)) return [...guias];
  return guias.map((g) => (g.id === id ? { ...g, posicion: Math.round(posicion) } : g));
}

export const quitarGuia = (guias: readonly GuiaUsuario[], id: number): GuiaUsuario[] => guias.filter((g) => g.id !== id);

/** La guía más cercana al punto, dentro de la tolerancia (unidades de escena), o `null`. */
export function guiaCerca(guias: readonly GuiaUsuario[], punto: Punto, tolerancia: number): GuiaUsuario | null {
  let mejor: GuiaUsuario | null = null;
  let distancia = Infinity;
  for (const g of guias) {
    const d = Math.abs((g.orientacion === "vertical" ? punto.x : punto.y) - g.posicion);
    if (d <= tolerancia && d < distancia) {
      mejor = g;
      distancia = d;
    }
  }
  return mejor;
}

/** Lo que el imán necesita saber de cada guía (sin el id). */
export const guiasParaImantar = (guias: readonly GuiaUsuario[]): Array<{ orientacion: OrientacionGuia; posicion: number }> => guias.map(({ orientacion, posicion }) => ({ orientacion, posicion }));
