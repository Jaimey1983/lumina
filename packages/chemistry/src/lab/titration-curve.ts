/**
 * Titulación ácido fuerte + base fuerte (simplificada).
 * `addedBaseL` = volumen de base añadido (L); `Ca` mol/L del ácido, `Va` L, `Cb` mol/L de la base.
 */
export function titrationPh(
  addedBaseL: number,
  Ca: number,
  Va: number,
  Cb: number,
): number {
  if (
    ![addedBaseL, Ca, Va, Cb].every((x) => Number.isFinite(x) && x >= 0) ||
    Ca <= 0 ||
    Va <= 0 ||
    Cb <= 0
  ) {
    return NaN;
  }
  const molesAcid = Ca * Va;
  const molesBase = Cb * addedBaseL;
  const totalVol = Va + addedBaseL;
  if (totalVol <= 0) return NaN;

  if (molesBase < molesAcid) {
    const h = (molesAcid - molesBase) / totalVol;
    return -Math.log10(h);
  }
  if (Math.abs(molesBase - molesAcid) < 1e-12) {
    return 7;
  }
  const oh = (molesBase - molesAcid) / totalVol;
  const pOh = -Math.log10(oh);
  return 14 - pOh;
}

export interface TitrationPoint {
  vol: number;
  ph: number;
}

export function titrationCurve(
  Ca: number,
  Va: number,
  Cb: number,
  maxVolumeL: number,
  steps = 40,
): TitrationPoint[] {
  if (steps < 2 || maxVolumeL <= 0) return [];
  const out: TitrationPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const vol = (maxVolumeL * i) / (steps - 1);
    const ph = titrationPh(vol, Ca, Va, Cb);
    if (Number.isFinite(ph)) out.push({ vol, ph });
  }
  return out;
}
