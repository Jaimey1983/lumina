import type { TextBlock } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

/**
 * Presets de inserción de texto — **datos, no ramas de código**. Cada sitio que
 * inserta un `TextBlock` (barra flotante, plantillas, columnas, preview legado)
 * pasa por `createTextBlock`; los estilos por defecto viven aquí, no repartidos
 * en literales `{ tipo: 'texto', ... }` divergentes.
 */
export type TextInsertPreset = 'titulo' | 'subtitulo' | 'cuerpo' | 'pie' | 'cita';

export const TEXT_INSERT_PRESETS: Record<TextInsertPreset, Partial<TextBlock>> = {
  // `tamanoFuenteManual: false` — el tamaño lo pone el preset, no el docente:
  // un cambio de nivel de encabezado (P/H1…H6) sí puede reescalarlo. Sin esto
  // "pie" (13px) y "cita" (20px) no coinciden con ningún tamaño de la escala
  // de encabezados ni tienen `nivel` previo — la heurística numérica de
  // `isDerivedHeadingSize` los trataba como "el docente lo fijó a mano" desde
  // el primer clic, y el tamaño nunca cambiaba entre niveles (ver heading-scale.ts).
  titulo: { tamanoFuente: '40px', negrita: true, nivel: 1, tamanoFuenteManual: false },
  subtitulo: { tamanoFuente: '26px', negrita: true, nivel: 3, tamanoFuenteManual: false },
  cuerpo: { tamanoFuente: '18px', tamanoFuenteManual: false },
  pie: { tamanoFuente: '13px', color: '#6b7280', tamanoFuenteManual: false },
  cita: { tamanoFuente: '20px', cursiva: true, tamanoFuenteManual: false },
};

export interface CreateTextBlockOptions {
  preset?: TextInsertPreset;
  /** Overrides sobre el preset (contenido, posición, color puntual…). */
  extra?: Partial<TextBlock>;
  /** Omite `x/y/ancho/alto` — para texto hijo de columnas u otros contenedores. */
  omitPosition?: boolean;
}

/**
 * Fábrica única de bloques de texto. Base = `BLOCK_FALLBACKS.text` + preset + extra.
 */
export function createTextBlock(opts: CreateTextBlockOptions = {}): TextBlock {
  const fb = BLOCK_FALLBACKS.text;
  const presetStyle = opts.preset ? TEXT_INSERT_PRESETS[opts.preset] : {};
  const base: TextBlock = { tipo: 'texto', contenido: '', ...presetStyle };
  if (!opts.omitPosition) {
    base.x = fb.x;
    base.y = fb.y;
    base.ancho = fb.ancho;
    base.alto = fb.alto;
  }
  return { ...base, ...opts.extra };
}

/** Bloque de texto vacío por defecto (el que suelta `crearPorDefecto` en el canvas). */
export function createDefaultTextBlock(extra?: Partial<TextBlock>): TextBlock {
  return createTextBlock({ extra });
}
