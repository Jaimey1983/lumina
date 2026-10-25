// ─── La página del dibujo (Y25) ───────────────────────────────────────────────
// Puro. Tamaño y fondo de la página: son campos de la escena que el normalizador ya acota. Cambiar la página nunca mueve ni escala
// los elementos (DY45): solo se puede preguntar cuáles quedan fuera o cortados.

import { esColorValido, LIMITES } from '../normalizar.js';
import type { Color, Escena } from '../tipos.js';
import { cajaDeElemento } from './geometria.js';

export interface CambioDePagina {
  ancho?: number;
  alto?: number;
  /** `null` = transparente. Un color inválido se ignora. */
  fondo?: Color | null;
}

const acotar = (valor: number, min: number, max: number): number => Math.min(max, Math.max(min, Math.round(valor)));

/**
 * Cambia el tamaño y/o el fondo de la página. El tamaño se redondea y se acota a los límites del modelo; un número que no es finito se
 * ignora. Devuelve la misma escena si nada cambia. No toca los elementos.
 */
export function fijarPagina(escena: Escena, cambio: CambioDePagina): Escena {
  const ancho = typeof cambio.ancho === 'number' && Number.isFinite(cambio.ancho) ? acotar(cambio.ancho, LIMITES.escenaAncho.min, LIMITES.escenaAncho.max) : escena.ancho;
  const alto = typeof cambio.alto === 'number' && Number.isFinite(cambio.alto) ? acotar(cambio.alto, LIMITES.escenaAlto.min, LIMITES.escenaAlto.max) : escena.alto;
  const fondo = cambio.fondo === undefined ? escena.fondo : cambio.fondo === null ? null : esColorValido(cambio.fondo) ? cambio.fondo : escena.fondo;
  if (ancho === escena.ancho && alto === escena.alto && fondo === escena.fondo) return escena;
  return { ...escena, ancho, alto, fondo };
}

/** Intercambia ancho y alto (vertical ↔ horizontal). En una página cuadrada devuelve la misma escena. */
export function girarPagina(escena: Escena): Escena {
  return fijarPagina(escena, { ancho: escena.alto, alto: escena.ancho });
}

/**
 * Los ids de lo que no está **entero** dentro de la página (cortado por algún borde o del todo afuera), en el orden de la escena. Cuenta las
 * formas, los textos y las líneas —también lo oculto y lo bloqueado—; un grupo no cuenta, sus hojas sí. Tocar el borde exacto es estar dentro.
 */
export function fueraDePagina(escena: Escena): string[] {
  const e = 1e-6;
  const ids: string[] = [];
  for (const el of escena.elementos) {
    if (el.tipo === 'grupo') continue;
    const caja = cajaDeElemento(escena, el);
    if (!caja) continue;
    if (caja.x < -e || caja.y < -e || caja.x + caja.ancho > escena.ancho + e || caja.y + caja.alto > escena.alto + e) ids.push(el.id);
  }
  return ids;
}
