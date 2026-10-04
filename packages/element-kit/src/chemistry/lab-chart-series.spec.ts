import { describe, expect, it } from 'vitest';
import { createDefaultGraficoBlock } from '../blocks/grafico/grafico-defaults.js';
import { Q7_LAB_VAR_IDS } from './chemistry-lab-templates.js';
import { graficoConSimulacionQuimica } from './lab-chart-series.js';

describe('graficoConSimulacionQuimica', () => {
  it('recalcula P–V al cambiar V', () => {
    const block = createDefaultGraficoBlock({
      simulacionQuimica: {
        simulacion: 'idealGas_P_vs_V',
        variablesIds: [
          Q7_LAB_VAR_IDS.gasN,
          Q7_LAB_VAR_IDS.gasT,
          Q7_LAB_VAR_IDS.gasV,
        ],
        constantes: { vMin: 1, vMax: 10 },
      },
    });
    const a = graficoConSimulacionQuimica(block, {
      [Q7_LAB_VAR_IDS.gasN]: 1,
      [Q7_LAB_VAR_IDS.gasT]: 300,
      [Q7_LAB_VAR_IDS.gasV]: 2,
    });
    const b = graficoConSimulacionQuimica(block, {
      [Q7_LAB_VAR_IDS.gasN]: 2,
      [Q7_LAB_VAR_IDS.gasT]: 300,
      [Q7_LAB_VAR_IDS.gasV]: 4,
    });
    expect(b.series[0]?.valores[0]).toBeGreaterThan(a.series[0]?.valores[0] ?? 0);
  });
});
