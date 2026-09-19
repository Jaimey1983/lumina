// ─── Regresión: "Posición de la Leyenda" para arcos parciales ───
// Con `angulo: 'semicirculo'` o `'personalizado'` en pie/donut/radialBar,
// build-apex-options.ts apaga la leyenda nativa de ApexCharts por completo
// (su cálculo de posición no es confiable ahí, ver PartialArcLegend en
// chart-container.tsx) y dibuja una propia siempre debajo del gráfico —
// "Posición de la Leyenda" no tiene ningún efecto en ese caso y no debe
// mostrarse (control fantasma).

import { render, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GraficoProperties } from './grafico-properties.js';
import { createDefaultGraficoBlock } from './grafico-defaults.js';
import type { Block, GraficoDatosBlock } from '@lumina/types/slide';

afterEach(() => {
  cleanup();
});

function renderProperties(overrides: Partial<GraficoDatosBlock>) {
  const block = { ...createDefaultGraficoBlock({ chartType: 'radialBar' }), ...overrides };
  const applyNow = vi.fn(async (fn: (b: Block) => Block) => {
    fn(block);
  });
  render(<GraficoProperties block={block} applyNow={applyNow} />);
}

describe('GraficoProperties — "Posición de la Leyenda" oculta para arcos parciales (regresión)', () => {
  it('se muestra en un radialBar de círculo completo', () => {
    renderProperties({ angulo: undefined });
    screen.getByText('Posición de la Leyenda');
  });

  it('NO se muestra con angulo "semicirculo"', () => {
    renderProperties({ angulo: 'semicirculo' });
    expect(screen.queryByText('Posición de la Leyenda')).toBeNull();
  });

  it('NO se muestra con angulo "personalizado"', () => {
    renderProperties({ angulo: 'personalizado', anguloInicio: -90, anguloFin: 90 });
    expect(screen.queryByText('Posición de la Leyenda')).toBeNull();
  });
});
