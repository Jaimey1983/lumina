import { describe, expect, it } from 'vitest';
import { buildApexChart } from './build-apex-options.js';
import { resolveChartTheme } from '../chart-theme.js';
import { getSeriesColor } from '../palettes.js';
import type { LuminaChartConfig } from '../types.js';

const theme = resolveChartTheme();

const baseConfig: LuminaChartConfig = {
  type: 'column',
  categorias: ['Ene', 'Feb', 'Mar'],
  series: [
    { nombre: 'Grupo A', valores: [1, 2, 3] },
    { nombre: 'Grupo B', valores: [4, 5, 6] },
  ],
  mostrarLeyenda: true,
};

describe('buildApexChart — tipos cartesianos (column/bar/line/area)', () => {
  it('column: type "bar" con horizontal: false', () => {
    const built = buildApexChart(baseConfig, theme);
    expect(built.chartType).toBe('bar');
    expect(built.options.plotOptions?.bar?.horizontal).toBe(false);
  });

  it('bar: type "bar" con horizontal: true', () => {
    const built = buildApexChart({ ...baseConfig, type: 'bar' }, theme);
    expect(built.chartType).toBe('bar');
    expect(built.options.plotOptions?.bar?.horizontal).toBe(true);
  });

  it('line/area conservan su propio chartType', () => {
    expect(buildApexChart({ ...baseConfig, type: 'line' }, theme).chartType).toBe('line');
    expect(buildApexChart({ ...baseConfig, type: 'area' }, theme).chartType).toBe('area');
  });

  it('arma una serie por cada serie de entrada, con nombre y valores intactos', () => {
    const built = buildApexChart(baseConfig, theme);
    expect(built.series).toEqual([
      { name: 'Grupo A', data: [1, 2, 3] },
      { name: 'Grupo B', data: [4, 5, 6] },
    ]);
  });

  it('las categorías van al eje X', () => {
    const built = buildApexChart(baseConfig, theme);
    expect(built.options.xaxis?.categories).toEqual(baseConfig.categorias);
  });

  it('colorea cada serie por índice contra la paleta pedida', () => {
    const built = buildApexChart({ ...baseConfig, paletaId: 'oceano' }, theme);
    expect(built.options.colors).toEqual([getSeriesColor(0, 'oceano'), getSeriesColor(1, 'oceano')]);
  });

  it('respeta el color explícito de una serie', () => {
    const config: LuminaChartConfig = {
      ...baseConfig,
      series: [{ nombre: 'A', valores: [1], color: '#ABCDEF' }],
    };
    const built = buildApexChart(config, theme);
    expect(built.options.colors).toEqual(['#ABCDEF']);
  });

  it('oculta leyenda/tooltip/toolbar/animación en miniatura', () => {
    const built = buildApexChart({ ...baseConfig, isThumbnail: true }, theme);
    expect(built.options.legend?.show).toBe(false);
    expect(built.options.tooltip?.enabled).toBe(false);
    expect(built.options.chart?.toolbar).toEqual({ show: false });
    expect(built.options.chart?.animations).toEqual({ enabled: false });
  });

  it('mostrarLeyenda: false oculta la leyenda aunque no sea miniatura', () => {
    const built = buildApexChart({ ...baseConfig, mostrarLeyenda: false }, theme);
    expect(built.options.legend?.show).toBe(false);
  });
});

describe('buildApexChart — tipos circulares (pie/donut/radialBar)', () => {
  const circularConfig: LuminaChartConfig = {
    type: 'pie',
    categorias: ['Bajo', 'Alto'],
    series: [{ nombre: 'Serie', valores: [30, 70] }],
    mostrarLeyenda: true,
  };

  it('pie/donut/radialBar usan las categorías como labels', () => {
    const built = buildApexChart(circularConfig, theme);
    expect(built.options.labels).toEqual(['Bajo', 'Alto']);
  });

  it('la serie es un array plano de valores (primera serie), alineado a categorías', () => {
    const built = buildApexChart(circularConfig, theme);
    expect(built.series).toEqual([30, 70]);
  });

  it('categoría sin valor correspondiente cae a 0', () => {
    const built = buildApexChart(
      { ...circularConfig, categorias: ['Bajo', 'Alto', 'Extra'] },
      theme,
    );
    expect(built.series).toEqual([30, 70, 0]);
  });

  it('donut usa plotOptions.pie.donut', () => {
    const built = buildApexChart({ ...circularConfig, type: 'donut' }, theme);
    expect(built.options.plotOptions?.pie?.donut).toBeDefined();
  });

  it('radialBar usa plotOptions.radialBar y leyenda a la derecha', () => {
    const built = buildApexChart({ ...circularConfig, type: 'radialBar' }, theme);
    expect(built.options.plotOptions?.radialBar).toBeDefined();
    expect(built.options.legend?.position).toBe('right');
  });

  it('radialBar nunca muestra dataLabels (paridad con el radialBar viejo de Recharts)', () => {
    const built = buildApexChart({ ...circularConfig, type: 'radialBar' }, theme);
    expect(built.options.dataLabels?.enabled).toBe(false);
  });
});
