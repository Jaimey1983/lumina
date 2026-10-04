import { ChemistryParseError } from '../errors.js';

/** Ácido o base fuerte monoprótica (concentración molar del electrolito). */
export function phStrong(
  concentrationM: number,
  kind: 'acid' | 'base',
): number {
  if (!Number.isFinite(concentrationM) || concentrationM <= 0) {
    throw new ChemistryParseError('La concentración debe ser un número positivo');
  }
  const p = -Math.log10(concentrationM);
  if (kind === 'acid') return p;
  return 14 - p;
}
