/**
 * Escala de z-index del editor de canvas — fuente única.
 *
 * Dos mundos que NO se mezclan:
 *
 * 1. Bloques del usuario: `zIndex` 1..N (N = nº de bloques de primer nivel),
 *    renumerado por `applyLayerReorderAction` (frontend `lib/canvas-layers`).
 *    Cada bloque es `position:absolute` con z definido, o sea, su propio
 *    contexto de apilamiento: los z internos de un widget/actividad (botones
 *    `z-[2]`, burbujas, etc.) compiten solo dentro de su bloque.
 *
 * 2. Cromo del editor (esta tabla): controles que deben quedar por encima de
 *    cualquier bloque, sea cual sea N. Tienen que ser > cualquier z de bloque
 *    realista, por eso arrancan en 1000.
 *
 * Los z fuera del lienzo principal (p. ej. el editor de Escape Room, popovers de
 * Radix) tienen su propia escala y no se rigen por esta tabla.
 */
export const EDITOR_Z = {
  /** Guía vertical que une el borde del bloque con el tirador de rotación. */
  resizeGuide: 1049,
  /** Tiradores de resize/rotación (`ResizeHandles`). */
  resizeHandle: 1050,
  /** Barra flotante de acciones del bloque seleccionado. */
  blockActionsBar: 1050,
  /** Mini-toolbar en portal (`position: fixed`) sobre el bloque. */
  blockToolbarPortal: 1100,
} as const;
