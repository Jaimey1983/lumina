// ─── Asas «+» de hijo rápido (Y8) — lógica pura de interfaz ───────────────────

import { cajaDeElemento, formasVisibles, puntoDePuerto, puertosParaConectar, type Escena, type Forma, type Lado, type Punto } from "@lumina/drawing";
import { bloqueadosEfectivos, marcoDeSeleccion, posicionesDeAsas } from "./asas.js";
import type { Herramienta } from "./herramientas.js";

/** Distancia en pantalla del «+» al punto medio de cada lado de la caja envolvente. */
export const DISTANCIA_ASA_HIJO_PX = 44;
/** Radio visual del círculo «+» (pantalla). */
export const RADIO_ASA_HIJO_PX = 10;
export const RADIO_ASA_HIJO_TACTIL_PX = 14;
/** Tolerancia de clic (pantalla); mayor con el dedo. */
export const TOLERANCIA_ASA_HIJO_PX = 14;
export const TOLERANCIA_ASA_HIJO_TACTIL_PX = 24;

export const LADOS_HIJO: readonly Lado[] = ["arriba", "derecha", "abajo", "izquierda"];

export const ETIQUETA_ASA_HIJO: Record<Lado, string> = {
  arriba: "Agregar forma arriba",
  derecha: "Agregar forma a la derecha",
  abajo: "Agregar forma abajo",
  izquierda: "Agregar forma a la izquierda",
};

export interface PosicionAsaHijo {
  lado: Lado;
  /** Centro del «+» en coordenadas de escena. */
  centro: Punto;
}

export interface ContextoAsasHijo {
  herramienta: Herramienta;
  seleccion: readonly string[];
  escena: Escena;
  gestoEnCurso: boolean;
  edicionAbierta: boolean;
}

/** Id de la forma padre si deben mostrarse las asas «+»; si no, `null`. */
export function formaConAsasHijo(ctx: ContextoAsasHijo): string | null {
  if (ctx.herramienta.tipo !== "seleccionar") return null;
  if (ctx.gestoEnCurso) return null;
  if (ctx.edicionAbierta) return null;
  if (ctx.seleccion.length !== 1) return null;
  const id = ctx.seleccion[0];
  const e = ctx.escena.elementos.find((x) => x.id === id);
  if (e?.tipo !== "forma") return null;
  const visibles = new Set(formasVisibles(ctx.escena).map((f) => f.id));
  if (!visibles.has(id) || bloqueadosEfectivos(ctx.escena).has(id)) return null;
  return id;
}

/** Posiciones de los cuatro «+» en la escena (lados de pantalla de la caja envolvente). */
export function posicionesAsasHijo(escena: Escena, formaId: string, zoom: number): PosicionAsaHijo[] | null {
  const e = escena.elementos.find((x): x is Forma => x.id === formaId && x.tipo === "forma");
  if (!e) return null;
  const caja = cajaDeElemento(escena, e);
  if (!caja) return null;
  const d = DISTANCIA_ASA_HIJO_PX / zoom;
  const mx = caja.x + caja.ancho / 2;
  const my = caja.y + caja.alto / 2;
  return [
    { lado: "arriba", centro: { x: mx, y: caja.y - d } },
    { lado: "derecha", centro: { x: caja.x + caja.ancho + d, y: my } },
    { lado: "abajo", centro: { x: mx, y: caja.y + caja.alto + d } },
    { lado: "izquierda", centro: { x: caja.x - d, y: my } },
  ];
}

/** El «+» bajo el puntero, si lo hay. */
export function asaHijoEn(escena: Escena, formaId: string, punto: Punto, zoom: number, tactil: boolean): Lado | null {
  const posiciones = posicionesAsasHijo(escena, formaId, zoom);
  if (!posiciones) return null;
  const tol = (tactil ? TOLERANCIA_ASA_HIJO_TACTIL_PX : TOLERANCIA_ASA_HIJO_PX) / zoom;
  for (const p of posiciones) {
    if (Math.hypot(p.centro.x - punto.x, p.centro.y - punto.y) <= tol) return p.lado;
  }
  return null;
}

/**
 * Distancia mínima en pantalla entre el «+» de arriba y el asa de rotar (debe ser ≥ 2 px).
 * Útil en pruebas de no superposición.
 */
export function separacionAsaHijoYRotar(escena: Escena, formaId: string, zoom: number): number | null {
  const posiciones = posicionesAsasHijo(escena, formaId, zoom);
  const marco = marcoDeSeleccion(escena, [formaId]);
  if (!posiciones || !marco) return null;
  const arriba = posiciones.find((p) => p.lado === "arriba")?.centro;
  const rotar = posicionesDeAsas(marco, zoom).rotar;
  if (!arriba) return null;
  const distEscena = Math.hypot(arriba.x - rotar.x, arriba.y - rotar.y);
  return distEscena * zoom - RADIO_ASA_HIJO_PX;
}

/** Vista previa del conector al arrastrar un «+» hacia `destinoId` o hacia un punto libre. */
export function previaConexionHijo(
  escena: Escena,
  padreId: string,
  destinoId: string | null,
  puntoLibre: Punto | null,
): { desde: Punto; hasta: Punto } | null {
  const padre = escena.elementos.find((x): x is Forma => x.id === padreId && x.tipo === "forma");
  if (!padre) return null;
  if (destinoId) {
    const par = puertosParaConectar(escena, padreId, destinoId);
    const hija = escena.elementos.find((x): x is Forma => x.id === destinoId && x.tipo === "forma");
    if (!par || !hija) return null;
    return { desde: puntoDePuerto(padre, par.origen.puerto), hasta: puntoDePuerto(hija, par.destino.puerto) };
  }
  if (puntoLibre) {
    // Aún no hay hija: el extremo «hasta» es el puntero; «desde» el puerto del padre que mira hacia allí.
    const n = padre.transformacion;
    const centro = { x: n.x + n.ancho / 2, y: n.y + n.alto / 2 };
    const dx = puntoLibre.x - centro.x;
    const dy = puntoLibre.y - centro.y;
    let puerto = 0;
    if (Math.abs(dx) >= Math.abs(dy)) puerto = dx >= 0 ? 1 : 3;
    else puerto = dy >= 0 ? 2 : 0;
    return { desde: puntoDePuerto(padre, puerto), hasta: puntoLibre };
  }
  return null;
}
