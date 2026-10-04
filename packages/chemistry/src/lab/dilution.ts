/** C₂ = C₁·V₁ / V₂ (mismas unidades de volumen). */
export function dilutionC2(C1: number, V1: number, V2: number): number {
  if (![C1, V1, V2].every((x) => Number.isFinite(x) && x > 0)) {
    return NaN;
  }
  return (C1 * V1) / V2;
}

export interface DilutionPoint {
  V2: number;
  C2: number;
}

export function dilutionSeries(
  C1: number,
  V1: number,
  v2Min: number,
  v2Max: number,
  steps = 24,
): DilutionPoint[] {
  if (steps < 2 || v2Max <= v2Min) return [];
  const out: DilutionPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const V2 = v2Min + (v2Max - v2Min) * t;
    const C2 = dilutionC2(C1, V1, V2);
    if (Number.isFinite(C2)) out.push({ V2, C2 });
  }
  return out;
}
