import {
  dilutionSeries,
  idealGasSeries,
  titrationCurve,
} from '@lumina/chemistry';
import type {
  GraficoDatosBlock,
  GraficoSimulacionQuimicaVinculo,
} from '@lumina/types/slide';

function num(
  variables: Readonly<Record<string, unknown>> | undefined,
  id: string,
  fallback: number,
): number {
  const v = variables?.[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function numConst(
  vinculo: GraficoSimulacionQuimicaVinculo,
  key: string,
  fallback: number,
): number {
  const c = vinculo.constantes?.[key];
  return typeof c === 'number' && Number.isFinite(c) ? c : fallback;
}

/**
 * Recalcula categorías y series del gráfico cuando hay `simulacionQuimica` y
 * variables de runtime (Q7).
 */
export function graficoConSimulacionQuimica(
  block: GraficoDatosBlock,
  variables?: Readonly<Record<string, unknown>>,
): GraficoDatosBlock {
  const vinculo = block.simulacionQuimica;
  if (!vinculo || !variables) return block;

  const ids = vinculo.variablesIds;

  switch (vinculo.simulacion) {
    case 'idealGas_P_vs_V': {
      const n = num(variables, ids[0], 1);
      const T = num(variables, ids[1], 298);
      const vMin = numConst(vinculo, 'vMin', 1);
      const vMax = numConst(vinculo, 'vMax', 12);
      const points = idealGasSeries(n, T, vMin, vMax, 28);
      const currentV = num(variables, ids[2], vMin);
      return {
        ...block,
        chartType: 'line',
        ejeXTitulo: 'Volumen (L)',
        ejeYTitulo: 'Presión (atm)',
        categorias: points.map((p) => p.V.toFixed(2)),
        series: [
          {
            nombre: 'P (gas ideal)',
            valores: points.map((p) => Math.round(p.P * 1000) / 1000),
          },
        ],
        descripcionAccesible: `Curva P frente a V con n=${n} mol y T=${T} K. Volumen actual ${currentV} L.`,
      };
    }
    case 'dilution_C2_vs_V2': {
      const C1 = num(variables, ids[0], 2);
      const V1 = num(variables, ids[1], 0.05);
      const v2Min = numConst(vinculo, 'v2Min', 0.05);
      const v2Max = numConst(vinculo, 'v2Max', 0.5);
      const points = dilutionSeries(C1, V1, v2Min, v2Max, 28);
      const currentV2 = num(variables, ids[2], 0.1);
      return {
        ...block,
        chartType: 'line',
        ejeXTitulo: 'V₂ (L)',
        ejeYTitulo: 'C₂ (mol/L)',
        categorias: points.map((p) => p.V2.toFixed(3)),
        series: [
          {
            nombre: 'C₂',
            valores: points.map((p) => Math.round(p.C2 * 1000) / 1000),
          },
        ],
        descripcionAccesible: `Dilución: C₁=${C1} mol/L, V₁=${V1} L. V₂ actual ${currentV2} L.`,
      };
    }
    case 'titration_ph_vs_vol': {
      const Ca = numConst(vinculo, 'Ca', 0.1);
      const Va = numConst(vinculo, 'Va', 0.05);
      const Cb = numConst(vinculo, 'Cb', 0.1);
      const maxVol = numConst(vinculo, 'maxVol', 0.12);
      const points = titrationCurve(Ca, Va, Cb, maxVol, 36);
      const added = num(variables, ids[0], 0);
      return {
        ...block,
        chartType: 'line',
        ejeXTitulo: 'Volumen de base añadida (L)',
        ejeYTitulo: 'pH',
        ejeYMin: 0,
        ejeYMax: 14,
        categorias: points.map((p) => p.vol.toFixed(3)),
        series: [
          {
            nombre: 'pH',
            valores: points.map((p) => Math.round(p.ph * 100) / 100),
          },
        ],
        descripcionAccesible: `Curva de titulación ácido-base fuerte. Volumen añadido actual ${added} L.`,
      };
    }
    default:
      return block;
  }
}
