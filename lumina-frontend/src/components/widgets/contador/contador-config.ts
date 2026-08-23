import type { ContadorWidget } from '@/types/widget.types';
import {
  DEFAULT_CONTADOR_ACENTO,
  DEFAULT_CONTADOR_AL_TERMINAR,
  DEFAULT_CONTADOR_FONDO,
  DEFAULT_CONTADOR_FORMATO,
  DEFAULT_CONTADOR_MODO,
  DEFAULT_CONTADOR_PASO,
  DEFAULT_CONTADOR_SEGUNDOS,
  DEFAULT_CONTADOR_TEXTO,
  DEFAULT_CONTADOR_VALOR,
  normalizeContadorWidget,
} from './contador-defaults';

export {
  DEFAULT_CONTADOR_ACENTO,
  DEFAULT_CONTADOR_AL_TERMINAR,
  DEFAULT_CONTADOR_FONDO,
  DEFAULT_CONTADOR_FORMATO,
  DEFAULT_CONTADOR_MODO,
  DEFAULT_CONTADOR_PASO,
  DEFAULT_CONTADOR_SEGUNDOS,
  DEFAULT_CONTADOR_TEXTO,
  DEFAULT_CONTADOR_VALOR,
  createDefaultContadorBlock,
  formatContadorTime,
  normalizeContadorWidget,
} from './contador-defaults';

export interface MergedContadorConfig {
  modo: NonNullable<ContadorWidget['modo']>;
  etiqueta: string;
  segundos: number;
  valorInicial: number;
  valorPaso: number;
  formato: NonNullable<ContadorWidget['formato']>;
  autoIniciar: boolean;
  mostrarControles: boolean;
  alTerminar: NonNullable<ContadorWidget['alTerminar']>;
  colorFondo: string;
  colorTexto: string;
  colorAcento: string;
}

export function mergedContadorConfig(block: ContadorWidget): MergedContadorConfig {
  const w = normalizeContadorWidget(block);
  return {
    modo: w.modo ?? DEFAULT_CONTADOR_MODO,
    etiqueta: w.etiqueta ?? '',
    segundos: w.segundos ?? DEFAULT_CONTADOR_SEGUNDOS,
    valorInicial: w.valorInicial ?? DEFAULT_CONTADOR_VALOR,
    valorPaso: w.valorPaso ?? DEFAULT_CONTADOR_PASO,
    formato: w.formato ?? DEFAULT_CONTADOR_FORMATO,
    autoIniciar: w.autoIniciar !== false,
    mostrarControles: w.mostrarControles !== false,
    alTerminar: w.alTerminar ?? DEFAULT_CONTADOR_AL_TERMINAR,
    colorFondo: w.colorFondo ?? DEFAULT_CONTADOR_FONDO,
    colorTexto: w.colorTexto ?? DEFAULT_CONTADOR_TEXTO,
    colorAcento: w.colorAcento ?? DEFAULT_CONTADOR_ACENTO,
  };
}
