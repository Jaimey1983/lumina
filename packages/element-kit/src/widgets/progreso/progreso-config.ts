import type { ProgresoWidget } from '@lumina/types/widget';
import {
  DEFAULT_PROGRESO_BARRA,
  DEFAULT_PROGRESO_FONDO,
  DEFAULT_PROGRESO_MODO,
  DEFAULT_PROGRESO_PORCENTAJE,
  DEFAULT_PROGRESO_TEXTO,
  DEFAULT_PROGRESO_PASOS,
  normalizeProgresoWidget,
  resolveProgresoObjetivo,
  resolveProgresoPercent,
  type ProgresoHito,
  type ProgresoVariante,
  type ProgresoWidgetT9,
} from './progreso-defaults.js';

export {
  DEFAULT_PROGRESO_BARRA,
  DEFAULT_PROGRESO_FONDO,
  DEFAULT_PROGRESO_MODO,
  DEFAULT_PROGRESO_PORCENTAJE,
  DEFAULT_PROGRESO_TEXTO,
  createDefaultProgresoBlock,
  normalizeProgresoWidget,
  resolveProgresoObjetivo,
  resolveProgresoPercent,
  PROGRESO_MAX_HITOS,
  PROGRESO_MAX_PASOS,
  PROGRESO_VARIANTES,
  type ProgresoHito,
  type ProgresoT9,
  type ProgresoVariante,
  type ProgresoWidgetT9,
} from './progreso-defaults.js';

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
  /** T9 */
  variante: ProgresoVariante;
  hitos: ProgresoHito[];
  numeroPasos: number;
  modoObjetivo: boolean;
  valorActual: number;
  meta: number;
  unidad: string;
}

export function mergedProgresoConfig(block: ProgresoWidget): MergedProgresoConfig {
  const w = normalizeProgresoWidget(block) as ProgresoWidgetT9;
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
    variante: w.variante ?? 'lineal',
    hitos: w.hitos ?? [],
    numeroPasos: w.numeroPasos ?? DEFAULT_PROGRESO_PASOS,
    modoObjetivo: w.modoObjetivo === true,
    valorActual: w.valorActual ?? 0,
    meta: w.meta ?? 100,
    unidad: w.unidad ?? '',
  };
}

/**
 * Porcentaje y rótulo secundario del progreso. En modo diapositiva y manual es el cálculo de
 * siempre (`resolveProgresoPercent`); solo el modo objetivo (manual + `modoObjetivo`) lo
 * reemplaza por `valorActual / meta`.
 */
export function resolveProgresoValor(
  cfg: MergedProgresoConfig,
  slideIndex: number,
  slideCount: number,
): { percent: number; rotulo?: string } {
  if (cfg.modo === 'manual' && cfg.modoObjetivo) {
    return {
      percent: resolveProgresoObjetivo(cfg.valorActual, cfg.meta),
      rotulo: `${cfg.valorActual} / ${cfg.meta}${cfg.unidad ? ` ${cfg.unidad}` : ''}`,
    };
  }
  return { percent: resolveProgresoPercent(cfg.porcentaje, cfg.modo, slideIndex, slideCount) };
}
