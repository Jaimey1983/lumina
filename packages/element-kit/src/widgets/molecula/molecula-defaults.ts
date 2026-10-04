import type { BlockMarco } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';
import type { MoleculaWidget } from '@lumina/types/widget';

import {
  DEFAULT_MOLECULA_CONFIG,
  normalizeMoleculaWidget,
} from './molecula-config.js';

export const DEFAULT_MOLECULA_CONTENT: Omit<
  MoleculaWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: 'Estructura molecular',
  subtituloWidget: 'Representación 2D a partir de SMILES',
  instruccion: 'Observa la fórmula desarrollada de la molécula.',
  smiles: 'O',
  nombreComun: 'agua',
  formulaMolecular: 'H2O',
  configuracion: { ...DEFAULT_MOLECULA_CONFIG },
};

export function createDefaultMoleculaBlock(marco?: BlockMarco): MoleculaWidget {
  const fb = BLOCK_FALLBACKS.molecula;
  const base = {
    tipo: 'molecula' as const,
    ...DEFAULT_MOLECULA_CONTENT,
  };
  const pos = marco
    ? {
        x: marco.izquierdaPct,
        y: marco.arribaPct,
        ancho: marco.anchoPct,
        alto: marco.altoPct,
      }
    : { x: fb.x, y: fb.y, ancho: fb.ancho, alto: fb.alto };
  return normalizeMoleculaWidget({ ...base, ...pos });
}

export { normalizeMoleculaWidget };
