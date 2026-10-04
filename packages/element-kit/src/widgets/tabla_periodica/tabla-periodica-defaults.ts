import type { BlockMarco } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';
import type { TablaPeriodicaWidget } from '@lumina/types/widget';

import {
  DEFAULT_TABLA_PERIODICA_CONFIG,
  normalizeTablaPeriodicaWidget,
} from './tabla-periodica-config.js';

export const DEFAULT_TABLA_PERIODICA_CONTENT: Omit<
  TablaPeriodicaWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: 'Tabla periódica de los elementos',
  subtituloWidget: 'Explora símbolos, masa atómica y tendencias por grupo y período.',
  instruccion: 'Haz clic en un elemento o navega con las flechas del teclado.',
  configuracion: { ...DEFAULT_TABLA_PERIODICA_CONFIG },
  seleccionado: null,
};

export function createDefaultTablaPeriodicaBlock(
  marco?: BlockMarco,
): TablaPeriodicaWidget {
  const fb = BLOCK_FALLBACKS.tablaPeriodica;
  const base = {
    tipo: 'tabla_periodica' as const,
    ...DEFAULT_TABLA_PERIODICA_CONTENT,
  };
  const pos = marco
    ? {
        x: marco.izquierdaPct,
        y: marco.arribaPct,
        ancho: marco.anchoPct,
        alto: marco.altoPct,
      }
    : { x: fb.x, y: fb.y, ancho: fb.ancho, alto: fb.alto };
  return normalizeTablaPeriodicaWidget({ ...base, ...pos });
}

export { normalizeTablaPeriodicaWidget };
