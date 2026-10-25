// ─── Tamaños de página preestablecidos (Y25) ──────────────────────────────────
// Puro: la lista cerrada de tamaños (DY71) y cómo saber cuál es el de una escena. No sabe de React ni del panel.

import { LIMITES } from "@lumina/drawing";

export interface TamanoDePagina {
  id: string;
  etiqueta: string;
  ancho: number;
  alto: number;
}

export const ID_PERSONALIZADO = "personalizado";

/** A4 a 96 ppp (210 × 297 mm = 794 × 1123 px). */
export const TAMANOS_DE_PAGINA: readonly TamanoDePagina[] = [
  { id: "pantalla-16-9", etiqueta: "Pantalla 16:9", ancho: 1280, alto: 720 },
  { id: "pantalla-4-3", etiqueta: "Pantalla 4:3", ancho: 1024, alto: 768 },
  { id: "a4-horizontal", etiqueta: "A4 horizontal", ancho: 1123, alto: 794 },
  { id: "a4-vertical", etiqueta: "A4 vertical", ancho: 794, alto: 1123 },
  { id: "cuadrada", etiqueta: "Cuadrada", ancho: 1000, alto: 1000 },
];

/** El id del tamaño preestablecido que coincide **exactamente** con la página, o `personalizado`. */
export function tamanoDe(pagina: { ancho: number; alto: number }): string {
  return TAMANOS_DE_PAGINA.find((t) => t.ancho === pagina.ancho && t.alto === pagina.alto)?.id ?? ID_PERSONALIZADO;
}

/** Lo que el panel permite escribir en «Ancho» y «Alto». */
export const LIMITE_ANCHO = LIMITES.escenaAncho;
export const LIMITE_ALTO = LIMITES.escenaAlto;

/** «1 elemento queda fuera…» / «3 elementos quedan fuera…»: el texto del aviso y del anuncio. */
export function textoFuera(cantidad: number): string {
  return cantidad === 1 ? "1 elemento queda fuera o cortado por la página" : `${cantidad} elementos quedan fuera o cortados por la página`;
}
