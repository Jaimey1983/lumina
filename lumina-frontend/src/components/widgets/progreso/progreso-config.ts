import type { ProgresoWidget } from '@/types/widget.types';
import {
  DEFAULT_PROGRESO_BARRA,
  DEFAULT_PROGRESO_FONDO,
  DEFAULT_PROGRESO_MODO,
  DEFAULT_PROGRESO_PORCENTAJE,
  DEFAULT_PROGRESO_TEXTO,
  normalizeProgresoWidget,
} from './progreso-defaults';

export {
  DEFAULT_PROGRESO_BARRA,
  DEFAULT_PROGRESO_FONDO,
  DEFAULT_PROGRESO_MODO,
  DEFAULT_PROGRESO_PORCENTAJE,
  DEFAULT_PROGRESO_TEXTO,
  createDefaultProgresoBlock,
  normalizeProgresoWidget,
  resolveProgresoPercent,
} from './progreso-defaults';

export interface MergedProgresoConfig {
  modo: NonNullable<ProgresoWidget['modo']>;
  porcentaje: number;
  etiqueta: string;
  mostrarPorcentaje: boolean;
  striped: boolean;
  animated: boolean;
  colorBarra: string;
  colorFondo: string;
  colorTexto: string;
}

export function mergedProgresoConfig(block: ProgresoWidget): MergedProgresoConfig {
  const w = normalizeProgresoWidget(block);
  return {
    modo: w.modo ?? DEFAULT_PROGRESO_MODO,
    porcentaje: w.porcentaje ?? DEFAULT_PROGRESO_PORCENTAJE,
    etiqueta: w.etiqueta ?? '',
    mostrarPorcentaje: w.mostrarPorcentaje !== false,
    striped: Boolean(w.striped),
    animated: Boolean(w.animated),
    colorBarra: w.colorBarra ?? DEFAULT_PROGRESO_BARRA,
    colorFondo: w.colorFondo ?? DEFAULT_PROGRESO_FONDO,
    colorTexto: w.colorTexto ?? DEFAULT_PROGRESO_TEXTO,
  };
}
