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

  it('la animación está siempre deshabilitada (determinismo de render, no ligado a isThumbnail)', () => {
    expect(buildApexChart(baseConfig, theme).options.chart?.animations).toEqual({ enabled: false });
    expect(buildApexChart({ ...baseConfig, isThumbnail: true }, theme).options.chart?.animations).toEqual({
      enabled: false,
    });
  });

  it('oculta leyenda/tooltip/toolbar en miniatura', () => {
    const built = buildApexChart({ ...baseConfig, isThumbnail: true }, theme);
    expect(built.options.legend?.show).toBe(false);
    expect(built.options.tooltip?.enabled).toBe(false);
    expect(built.options.chart?.toolbar).toEqual({ show: false });
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

describe('buildApexChart — tipos nuevos de catálogo (H6)', () => {
  it('combo: genera chartType "line" y preserva tipoCombo por serie', () => {
    const comboConfig: LuminaChartConfig = {
      type: 'combo',
      categorias: ['Ene', 'Feb', 'Mar'],
      series: [
        { nombre: 'Barras', valores: [10, 20, 30], tipoCombo: 'column' },
        { nombre: 'Línea', valores: [5, 15, 25], tipoCombo: 'line', ejeCombo: 'secundario' },
      ],
    };
    const built = buildApexChart(comboConfig, theme);
    expect(built.chartType).toBe('line');
    expect(built.series).toEqual([
      { name: 'Barras', type: 'column', data: [10, 20, 30] },
      { name: 'Línea', type: 'line', data: [5, 15, 25] },
    ]);
    // Eje dual
    expect(Array.isArray(built.options.yaxis)).toBe(true);
    expect((built.options.yaxis as unknown[])[1]).toMatchObject({ opposite: true });
  });

  it('scatter: chartType "scatter", eje X numérico y datos mapeados a [x, y]', () => {
    const scatterConfig: LuminaChartConfig = {
      type: 'scatter',
      categorias: [],
      series: [
        {
          nombre: 'Muestra',
          valores: [],
          puntos: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
          ],
        },
      ],
    };
    const built = buildApexChart(scatterConfig, theme);
    expect(built.chartType).toBe('scatter');
    expect(built.options.xaxis?.type).toBe('numeric');
    expect(built.series).toEqual([{ name: 'Muestra', data: [[1, 10], [2, 20]] }]);
  });

  it('bubble: chartType "bubble", eje X numérico y datos con tamaño z [x, y, z]', () => {
    const bubbleConfig: LuminaChartConfig = {
      type: 'bubble',
      categorias: [],
      series: [
        {
          nombre: 'Burbujas',
          valores: [],
          puntos: [
            { x: 5, y: 15, z: 25 },
            { x: 10, y: 30, z: 40 },
          ],
        },
      ],
    };
    const built = buildApexChart(bubbleConfig, theme);
    expect(built.chartType).toBe('bubble');
    expect(built.options.xaxis?.type).toBe('numeric');
    expect(built.series).toEqual([{ name: 'Burbujas', data: [[5, 15, 25], [10, 30, 40]] }]);
  });

  it('radar: chartType "radar", categorías en eje X y series con datos', () => {
    const radarConfig: LuminaChartConfig = {
      type: 'radar',
      categorias: ['Fuerza', 'Agilidad', 'Inteligencia'],
      series: [{ nombre: 'Personaje A', valores: [80, 90, 70] }],
    };
    const built = buildApexChart(radarConfig, theme);
    expect(built.chartType).toBe('radar');
    expect(built.options.xaxis?.categories).toEqual(['Fuerza', 'Agilidad', 'Inteligencia']);
    expect(built.series).toEqual([{ name: 'Personaje A', data: [80, 90, 70] }]);
  });

  it('treemap: chartType "treemap", usa primera serie y categorías como etiquetas', () => {
    const treemapConfig: LuminaChartConfig = {
      type: 'treemap',
      categorias: ['Matemáticas', 'Lenguaje', 'Ciencias'],
      series: [{ nombre: 'Asignaturas', valores: [40, 35, 25] }],
    };
    const built = buildApexChart(treemapConfig, theme);
    expect(built.chartType).toBe('treemap');
    expect(built.series).toEqual([
      {
        data: [
          { x: 'Matemáticas', y: 40 },
          { x: 'Lenguaje', y: 35 },
          { x: 'Ciencias', y: 25 },
        ],
      },
    ]);
  });

  it('funnel: chartType "bar" con plotOptions.bar.isFunnel: true', () => {
    const funnelConfig: LuminaChartConfig = {
      type: 'funnel',
      categorias: ['Vistas', 'Clics', 'Compras'],
      series: [{ nombre: 'Embudo', valores: [1000, 200, 50] }],
    };
    const built = buildApexChart(funnelConfig, theme);
    expect(built.chartType).toBe('bar');
    expect(built.options.plotOptions?.bar?.isFunnel).toBe(true);
    expect(built.options.plotOptions?.bar?.horizontal).toBe(true);
    expect(built.series).toEqual([{ name: 'Embudo', data: [1000, 200, 50] }]);
  });

  it('heatmap: chartType "heatmap", mapea cada serie a celdas { x, y }', () => {
    const heatmapConfig: LuminaChartConfig = {
      type: 'heatmap',
      categorias: ['Lunes', 'Martes'],
      series: [
        { nombre: 'Mañana', valores: [5, 8] },
        { nombre: 'Tarde', valores: [12, 15] },
      ],
    };
    const built = buildApexChart(heatmapConfig, theme);
    expect(built.chartType).toBe('heatmap');
    expect(built.series).toEqual([
      {
        name: 'Mañana',
        data: [
          { x: 'Lunes', y: 5 },
          { x: 'Martes', y: 8 },
        ],
      },
      {
        name: 'Tarde',
        data: [
          { x: 'Lunes', y: 12 },
          { x: 'Martes', y: 15 },
        ],
      },
    ]);
  });
});

describe('buildApexChart — configuración fina (H6)', () => {
  it('apilado: normal y porcentaje activan stacked en ApexCharts', () => {
    const normal = buildApexChart({ ...baseConfig, apilado: 'normal' }, theme);
    expect(normal.options.chart?.stacked).toBe(true);
    expect(normal.options.chart?.stackType).toBe('normal');

    const pct = buildApexChart({ ...baseConfig, apilado: 'porcentaje' }, theme);
    expect(pct.options.chart?.stacked).toBe(true);
    expect(pct.options.chart?.stackType).toBe('100%');

    const none = buildApexChart({ ...baseConfig, apilado: 'ninguno' }, theme);
    expect(none.options.chart?.stacked).toBe(false);
  });

  it('títulos y límites de ejes X e Y', () => {
    const built = buildApexChart(
      {
        ...baseConfig,
        ejeXTitulo: 'Meses',
        ejeYTitulo: 'Puntaje',
        ejeYMin: 0,
        ejeYMax: 100,
        ejeYEscalaLog: true,
      },
      theme,
    );
    expect(built.options.xaxis?.title?.text).toBe('Meses');
    const yaxis = built.options.yaxis as { title?: { text?: string }; min?: number; max?: number; logarithmic?: boolean };
    expect(yaxis.title?.text).toBe('Puntaje');
    expect(yaxis.min).toBe(0);
    expect(yaxis.max).toBe(100);
    expect(yaxis.logarithmic).toBe(true);
  });

  it('mostrarEtiquetasDatos: true habilita dataLabels en el gráfico', () => {
    const built = buildApexChart({ ...baseConfig, mostrarEtiquetasDatos: true }, theme);
    expect(built.options.dataLabels?.enabled).toBe(true);
  });

  it('lineaReferencia: genera anotación horizontal con valor y etiqueta', () => {
    const built = buildApexChart(
      {
        ...baseConfig,
        lineaReferencia: { valor: 80, etiqueta: 'Aprobación' },
      },
      theme,
    );
    expect(built.options.annotations?.yaxis).toBeDefined();
    expect(built.options.annotations?.yaxis?.[0]?.y).toBe(80);
    expect(built.options.annotations?.yaxis?.[0]?.label?.text).toBe('Aprobación');
  });

  it('animar: opt-in explícito habilita animations.enabled', () => {
    const disabled = buildApexChart(baseConfig, theme);
    expect(disabled.options.chart?.animations?.enabled).toBe(false);

    const enabled = buildApexChart({ ...baseConfig, animar: true }, theme);
    expect(enabled.options.chart?.animations?.enabled).toBe(true);
  });

  it('ordenDatos: ascendente y descendente ordenan por primera serie', () => {
    const unsortedConfig: LuminaChartConfig = {
      type: 'column',
      categorias: ['Media', 'Baja', 'Alta'],
      series: [
        { nombre: 'Valores', valores: [50, 10, 90] },
        { nombre: 'Secundario', valores: [5, 1, 9] },
      ],
    };

    const asc = buildApexChart({ ...unsortedConfig, ordenDatos: 'ascendente' }, theme);
    expect(asc.options.xaxis?.categories).toEqual(['Baja', 'Media', 'Alta']);
    expect(asc.series).toEqual([
      { name: 'Valores', data: [10, 50, 90] },
      { name: 'Secundario', data: [1, 5, 9] },
    ]);

    const desc = buildApexChart({ ...unsortedConfig, ordenDatos: 'descendente' }, theme);
    expect(desc.options.xaxis?.categories).toEqual(['Alta', 'Media', 'Baja']);
    expect(desc.series).toEqual([
      { name: 'Valores', data: [90, 50, 10] },
      { name: 'Secundario', data: [9, 5, 1] },
    ]);
  });

  it('exportarImagen: controla toolbar.show', () => {
    const explicitFalse = buildApexChart({ ...baseConfig, exportarImagen: false }, theme);
    expect(explicitFalse.options.chart?.toolbar?.show).toBe(false);

    const explicitTrue = buildApexChart({ ...baseConfig, exportarImagen: true }, theme);
    expect(explicitTrue.options.chart?.toolbar?.show).toBe(true);
  });
});
