// ─── Regresión: "Radio de Esquinas" se mostraba para todos los tipos, pero
// solo tiene efecto real en build-apex-options.ts para column/bar/combo
// (plotOptions.bar.borderRadius), heatmap (radius de celda), waterfall e
// histogram — pie/donut/radialBar/polarArea/treemap/radar/scatter/bubble/
// boxPlot no tienen ningún wiring, y funnel lo ignora a propósito (fuerza
// radius 0, es la forma del embudo). El control ahora se oculta donde no
// aplica, en vez de mostrarse sin ningún efecto.

import { render, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GraficoProperties } from './grafico-properties.js';
import { createDefaultGraficoBlock } from './grafico-defaults.js';
import type { Block, GraficoChartType } from '@lumina/types/slide';

afterEach(() => {
  cleanup();
});

function renderProperties(chartType: GraficoChartType) {
  const block = createDefaultGraficoBlock({ chartType });
  const applyNow = vi.fn(async (fn: (b: Block) => Block) => {
    fn(block);
  });
  render(<GraficoProperties block={block} applyNow={applyNow} />);
}

describe('GraficoProperties — "Radio de Esquinas" solo donde tiene efecto (regresión)', () => {
  it.each<GraficoChartType>(['column', 'bar', 'combo', 'heatmap', 'waterfall', 'histogram'])(
    'se muestra para %s (tiene wiring real en build-apex-options.ts)',
    (chartType) => {
      renderProperties(chartType);
      screen.getByText('Radio de Esquinas (px)');
    },
  );

  it.each<GraficoChartType>([
    'pie',
    'donut',
    'radialBar',
    'polarArea',
    'treemap',
    'radar',
    'scatter',
    'bubble',
    'boxPlot',
    'funnel',
  ])('NO se muestra para %s (sin efecto, o funnel que lo ignora a propósito)', (chartType) => {
    renderProperties(chartType);
    expect(screen.queryByText('Radio de Esquinas (px)')).toBeNull();
  });
});
