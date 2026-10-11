import type { BotonWidget } from '@lumina/types/widget';
import type { BotonIconoId } from './boton-iconos.js';
import {
  DEFAULT_BOTON_ACCION,
  DEFAULT_BOTON_FORMA,
  DEFAULT_BOTON_TAMANO,
  DEFAULT_BOTON_TEXTO,
  DEFAULT_BOTON_VARIANTE,
  normalizeBotonWidget,
  type BotonAccionT8,
  type BotonDensidad,
  type BotonEstilo,
  type BotonIconoPosicion,
  type BotonWidgetT8,
} from './boton-defaults.js';

export {
  BOTON_DENSIDADES,
  BOTON_ESTILOS,
  BOTON_VARIANTES,
  DEFAULT_BOTON_ACCION,
  DEFAULT_BOTON_FORMA,
  DEFAULT_BOTON_TAMANO,
  DEFAULT_BOTON_TEXTO,
  DEFAULT_BOTON_VARIANTE,
  botonFallbackSize,
  createDefaultBotonBlock,
  normalizeBotonWidget,
  type BotonAccionT8,
  type BotonDensidad,
  type BotonEstilo,
  type BotonIconoPosicion,
  type BotonT8,
  type BotonWidgetT8,
} from './boton-defaults.js';

export interface MergedBotonConfig {
  texto: string;
  variante: BotonWidget['variante'];
  outline: boolean;
  tamano: NonNullable<BotonWidget['tamano']>;
  forma: NonNullable<BotonWidget['forma']>;
  accion: BotonAccionT8;
  url: string;
  slideIndex: number;
  deshabilitado: boolean;
  /** T8 — estilo efectivo (deducido de `variante`/`outline` si no está guardado). */
  estilo: BotonEstilo;
  icono: BotonIconoId | null;
  iconoPosicion: BotonIconoPosicion;
  cargando: boolean;
  densidad: BotonDensidad;
  archivoNombre: string;
}

export function mergedBotonConfig(block: BotonWidget): MergedBotonConfig {
  const w = normalizeBotonWidget(block) as BotonWidgetT8;
  const variante = w.variante ?? DEFAULT_BOTON_VARIANTE;
  return {
    texto: w.texto || DEFAULT_BOTON_TEXTO,
    variante: w.variante ?? DEFAULT_BOTON_VARIANTE,
    outline: Boolean(w.outline),
    tamano: w.tamano ?? DEFAULT_BOTON_TAMANO,
    forma: w.forma ?? DEFAULT_BOTON_FORMA,
    accion: w.accion ?? DEFAULT_BOTON_ACCION,
    url: w.url ?? '',
    slideIndex: w.slideIndex ?? 0,
    deshabilitado: Boolean(w.deshabilitado),
    estilo: w.estilo ?? (variante === 'link' ? 'link' : w.outline ? 'outline' : 'solid'),
    icono: w.icono ?? null,
    iconoPosicion: w.iconoPosicion ?? 'izquierda',
    cargando: Boolean(w.cargando),
    densidad: w.densidad ?? 'normal',
    archivoNombre: w.archivoNombre ?? '',
  };
}
