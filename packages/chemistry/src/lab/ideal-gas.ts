/** Constante R en L·atm·mol⁻¹·K⁻¹ (bachillerato / atm-L). */
export const R_ATM_L_PER_MOL_K = 0.082057;

export interface IdealGasInput {
  n: number;
  T: number;
  V: number;
  R?: number;
}

export function idealGasPressure(input: IdealGasInput): number {
  const { n, T, V, R = R_ATM_L_PER_MOL_K } = input;
  if (![n, T, V, R].every((x) => Number.isFinite(x) && x > 0)) {
    return NaN;
  }
  return (n * R * T) / V;
}

export interface IdealGasPoint {
  V: number;
  P: number;
}

export function idealGasSeries(
  n: number,
  T: number,
  vMin: number,
  vMax: number,
  steps = 24,
): IdealGasPoint[] {
  if (steps < 2 || vMax <= vMin) return [];
  const out: IdealGasPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const V = vMin + (vMax - vMin) * t;
    const P = idealGasPressure({ n, T, V });
    if (Number.isFinite(P)) out.push({ V, P });
  }
  return out;
}
