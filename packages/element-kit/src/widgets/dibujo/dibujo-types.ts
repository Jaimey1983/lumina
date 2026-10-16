/**
 * Etapa W — Dibujo: lienzo libre de formas, líneas y texto. Nace como `ElementDefinition` y su
 * tipo vive aquí, no en el `Block` viejo de `@lumina/types` (Regla 3). El contenido es una
 * `Escena` de `@lumina/drawing`; `x/y/ancho/alto` son el bloque en el slide (% del lienzo),
 * distintos de las unidades de la escena.
 */
import type { Escena } from "@lumina/drawing";

export const DIBUJO_TIPO = "dibujo" as const;

export interface DibujoEstado {
  id?: string;
  tipo: typeof DIBUJO_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  /** Nombre del dibujo: rótulo accesible y nombre del archivo al exportar. */
  titulo?: string;
  /** Descripción para lectores de pantalla. */
  descripcionAccesible?: string;
  escena: Escena;
}
