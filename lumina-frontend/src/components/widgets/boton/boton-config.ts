import type { BotonWidget } from '@/types/widget.types';
import {
  DEFAULT_BOTON_ACCION,
  DEFAULT_BOTON_FORMA,
  DEFAULT_BOTON_TAMANO,
  DEFAULT_BOTON_TEXTO,
  DEFAULT_BOTON_VARIANTE,
  normalizeBotonWidget,
} from './boton-defaults';

export {
  BOTON_VARIANTES,
  DEFAULT_BOTON_ACCION,
  DEFAULT_BOTON_FORMA,
  DEFAULT_BOTON_TAMANO,
  DEFAULT_BOTON_TEXTO,
  DEFAULT_BOTON_VARIANTE,
  botonFallbackSize,
  createDefaultBotonBlock,
  normalizeBotonWidget,
} from './boton-defaults';

export interface MergedBotonConfig {
  texto: string;
  variante: BotonWidget['variante'];
  outline: boolean;
  tamano: NonNullable<BotonWidget['tamano']>;
  forma: NonNullable<BotonWidget['forma']>;
  accion: NonNullable<BotonWidget['accion']>;
  url: string;
  slideIndex: number;
  deshabilitado: boolean;
}

export function mergedBotonConfig(block: BotonWidget): MergedBotonConfig {
  const w = normalizeBotonWidget(block);
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
  };
}
