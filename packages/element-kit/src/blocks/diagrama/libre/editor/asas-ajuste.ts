// ─── Asas amarillas de ajuste (Y20) — lógica pura de interfaz ─────────────────
// Dónde se dibujan, cuándo se ven y cuál se agarra. El valor que da un arrastre sale de `valorDeAsa` (`@lumina/drawing`).

import { asasDeAjuste, formasVisibles, type Escena, type Forma, type LadoAsaAjuste, type Punto } from "@lumina/drawing";
import { bloqueadosEfectivos } from "./asas.js";
import type { Herramienta } from "./herramientas.js";
import { escenaAPantalla, type Vista } from "./vista.js";

/** Cuánto se mete el asa hacia dentro de la forma desde el borde al que pertenece (píxeles de pantalla). */
export const DESPLAZAMIENTO_ASA_AJUSTE_PX = 14;
/** Lado del rombo amarillo. */
export const TAMANO_ASA_AJUSTE_PX = 10;
export const TAMANO_ASA_AJUSTE_TACTIL_PX = 14;
/** Tolerancia de clic; mayor con el dedo. */
export const TOLERANCIA_ASA_AJUSTE_PX = 8;
export const TOLERANCIA_ASA_AJUSTE_TACTIL_PX = 12;

export interface ContextoAsasAjuste {
  escena: Escena;
  herramienta: Herramienta;
  seleccion: readonly string[];
  gestoEnCurso: boolean;
  edicionAbierta: boolean;
  menuAbierto: boolean;
  pincel: boolean;
}

/** La forma que muestra asas de ajuste: una sola forma visible y editable, con la herramienta Seleccionar y nada en curso. */
export function formaConAsasAjuste(ctx: ContextoAsasAjuste): Forma | null {
  if (ctx.herramienta.tipo !== "seleccionar" || ctx.gestoEnCurso || ctx.edicionAbierta || ctx.menuAbierto || ctx.pincel) return null;
  if (ctx.seleccion.length !== 1) return null;
  const id = ctx.seleccion[0];
  const forma = ctx.escena.elementos.find((e): e is Forma => e.id === id && e.tipo === "forma");
  if (!forma || bloqueadosEfectivos(ctx.escena).has(forma.id)) return null;
  if (!formasVisibles(ctx.escena).some((f) => f.id === forma.id)) return null;
  return asasDeAjuste(forma).length > 0 ? forma : null;
}

export interface AsaAjusteEnPantalla {
  clave: string;
  etiqueta: string;
  lado: LadoAsaAjuste;
  valor: number;
  /** Donde se dibuja: hacia dentro de la forma desde su borde, en píxeles de pantalla. */
  centro: Punto;
}

/** Hacia dónde es «dentro» desde cada borde, en el sistema local de la forma. */
const HACIA_DENTRO: Record<LadoAsaAjuste, Punto> = { arriba: { x: 0, y: 1 }, abajo: { x: 0, y: -1 }, izquierda: { x: 1, y: 0 }, derecha: { x: -1, y: 0 } };

/** Las asas de la forma en pantalla. Se meten 14 px hacia dentro (o hasta el centro, si la forma es más chica), siguiendo el giro. */
export function asasAjusteEnPantalla(forma: Forma, vista: Vista): AsaAjusteEnPantalla[] {
  const t = forma.transformacion;
  const a = (t.rotacion * Math.PI) / 180;
  return asasDeAjuste(forma).map((asa) => {
    const borde = escenaAPantalla(vista, asa.borde);
    const dentro = HACIA_DENTRO[asa.lado];
    // La mitad de la forma en ese eje, en pantalla: el asa nunca pasa del centro.
    const tope = ((dentro.x !== 0 ? t.ancho : t.alto) * vista.zoom) / 2;
    const d = Math.min(DESPLAZAMIENTO_ASA_AJUSTE_PX, tope);
    const dx = dentro.x * Math.cos(a) - dentro.y * Math.sin(a);
    const dy = dentro.x * Math.sin(a) + dentro.y * Math.cos(a);
    return { clave: asa.clave, etiqueta: asa.etiqueta, lado: asa.lado, valor: asa.valor, centro: { x: borde.x + dx * d, y: borde.y + dy * d } };
  });
}

/** El asa bajo `punto` (en la escena), con una tolerancia en píxeles de pantalla; si hay varias, la más cercana. */
export function asaAjusteEn(forma: Forma, punto: Punto, vista: Vista, tactil: boolean): AsaAjusteEnPantalla | null {
  const pantalla = escenaAPantalla(vista, punto);
  const tolerancia = tactil ? TOLERANCIA_ASA_AJUSTE_TACTIL_PX : TOLERANCIA_ASA_AJUSTE_PX;
  let mejor: AsaAjusteEnPantalla | null = null;
  let distancia = Infinity;
  for (const asa of asasAjusteEnPantalla(forma, vista)) {
    const d = Math.hypot(asa.centro.x - pantalla.x, asa.centro.y - pantalla.y);
    if (d <= tolerancia && d < distancia) {
      mejor = asa;
      distancia = d;
    }
  }
  return mejor;
}

/** Un valor para la etiqueta en vivo: entero si lo es y, si no, hasta dos decimales con coma. */
export const textoDeValor = (v: number): string => String(Math.round(v * 100) / 100).replace(".", ",");
