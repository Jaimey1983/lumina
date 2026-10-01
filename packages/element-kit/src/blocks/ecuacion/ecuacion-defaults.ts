import { BLOCK_FALLBACKS, type EquationBlock } from '@lumina/types/slide';

export const ECUACION_TAMANO_MIN = 12;
export const ECUACION_TAMANO_MAX = 160;
export const ECUACION_TAMANO_DEFAULT = 36;
export const ECUACION_LATEX_EJEMPLO = 'ax^{2} + bx + c = 0';

export function createDefaultEcuacionBlock(extra?: Partial<EquationBlock>): EquationBlock {
  const fb = BLOCK_FALLBACKS.ecuacion;
  return {
    tipo: 'ecuacion',
    id: crypto.randomUUID(),
    latex: ECUACION_LATEX_EJEMPLO,
    tamano: ECUACION_TAMANO_DEFAULT,
    alineacion: 'centro',
    ajustar: true,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
    ...extra,
  };
}

/** Tamaño efectivo en px, acotado al rango permitido. */
export function ecuacionTamano(block: EquationBlock): number {
  const n = block.tamano;
  if (typeof n !== 'number' || !Number.isFinite(n)) return ECUACION_TAMANO_DEFAULT;
  return Math.min(ECUACION_TAMANO_MAX, Math.max(ECUACION_TAMANO_MIN, n));
}
