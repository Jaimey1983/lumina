// ─── Regresión: navegación de familia/variante del panel de propiedades ───
// Dos bugs reales, misma causa raíz: el panel derivaba la "familia activa"
// siempre de `getChartFamily(chartType)` — la familia CANÓNICA del tipo — en
// vez de la familia que el usuario está navegando. Como varios tipos están
// listados como variante de más de una familia (`radialBar` en Proporción,
// `column`/`bar` en Comparación y Estadística), eso expulsaba al usuario de
// la familia que eligió apenas seleccionaba una variante "prestada".

import { render, cleanup, screen, fireEvent, within } from '@testing-library/react';
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
  return { block, applyNow };
}

describe('GraficoProperties — navegación de familia (regresión)', () => {
  it('elegir una variante listada en Proporción pero "dueña" de KPI (radialBar) no cambia la familia mostrada', () => {
    renderProperties('donut');

    // Arranca en Proporción (familia canónica de "donut"). `getByText`
    // lanza si no lo encuentra — no hace falta un matcher extra.
    const grid = screen.getByText('Variantes de Proporción').closest('div')?.parentElement;
    expect(grid).toBeTruthy();

    const radialBtn = within(grid as HTMLElement).getByTitle(/Medidor circular de progreso/i);
    fireEvent.click(radialBtn);

    // Sigue mostrando Proporción — NO salta a "Progreso / KPI" aunque
    // `radialBar` pertenezca canónicamente a esa otra familia.
    screen.getByText('Variantes de Proporción');
    expect(screen.queryByText('Variantes de Progreso / KPI')).toBeNull();
  });

  it('un bloque nuevo insertado con un tipo compartido entre familias (column) arranca en la familia canónica de ese tipo', () => {
    renderProperties('column');
    // `column` es canónicamente de Comparación (no Estadística, aunque
    // también esté listado ahí) — así que un bloque insertado en frío con
    // `chartType: 'column'` debe mostrar Comparación desde el inicio.
    screen.getByText('Variantes de Comparación');
  });
});
