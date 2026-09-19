import { describe, expect, it } from 'vitest';
import { buildApexChart, type ApexCartesianSeries } from './build-apex-options.js';
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

  it('pie liso deja plotOptions como objeto vacío, nunca undefined (bug real: ApexCharts revienta leyendo plotOptions.line si la clave está presente con valor undefined)', () => {
    const built = buildApexChart(circularConfig, theme);
    expect(built.options.plotOptions).toBeDefined();
    expect(built.options.plotOptions).toEqual({});
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

  it('lineasReferencia: genera anotación horizontal con valor y etiqueta', () => {
    const built = buildApexChart(
      {
        ...baseConfig,
        lineasReferencia: [{ valor: 80, etiqueta: 'Aprobación' }],
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

describe('buildApexChart — Variantes y Configuración de Etapa I2', () => {
  it('polarArea: chartType "polarArea", series como array numérico, labels como categorías y plotOptions configurado', () => {
    const config: LuminaChartConfig = {
      type: 'polarArea',
      categorias: ['Norte', 'Sur', 'Este', 'Oeste'],
      series: [{ nombre: 'Regiones', valores: [40, 60, 80, 20] }],
      mostrarLeyenda: true,
    };
    const built = buildApexChart(config, theme);
    expect(built.chartType).toBe('polarArea');
    expect(built.series).toEqual([40, 60, 80, 20]);
    expect(built.options.labels).toEqual(['Norte', 'Sur', 'Este', 'Oeste']);
    expect(built.options.plotOptions?.polarArea?.rings).toBeDefined();
    expect(built.options.plotOptions?.polarArea?.spokes).toBeDefined();
    expect((built.options.yaxis as { show?: boolean })?.show).toBe(false);
  });

  it('waterfall: calcula deltas acumulativos con rangos [bottom, top] y colores semánticos', () => {
    const config: LuminaChartConfig = {
      type: 'waterfall',
      categorias: ['Inicio', 'Ventas', 'Gastos', 'Impuestos', 'Cierre'],
      series: [{ nombre: 'Flujo', valores: [100, 30, -20, -10, 0] }],
    };
    const built = buildApexChart(config, theme);
    expect(built.chartType).toBe('bar');
    expect(built.options.plotOptions?.bar?.horizontal).toBe(false);

    const seriesData = (built.series as ApexCartesianSeries)[0]?.data as Array<{
      x: string;
      y: [number, number];
      fillColor: string;
    }>;

    expect(seriesData).toHaveLength(5);
    // Inicio: 100 -> [0, 100]
    expect(seriesData[0]).toEqual(expect.objectContaining({ x: 'Inicio', y: [0, 100] }));
    // Ventas: +30 -> [100, 130] con color positivo (#10b981)
    expect(seriesData[1]).toEqual(expect.objectContaining({ x: 'Ventas', y: [100, 130], fillColor: '#10b981' }));
    // Gastos: -20 -> [110, 130] con color negativo (#ef4444)
    expect(seriesData[2]).toEqual(expect.objectContaining({ x: 'Gastos', y: [110, 130], fillColor: '#ef4444' }));
    // Impuestos: -10 -> [100, 110] con color negativo (#ef4444)
    expect(seriesData[3]).toEqual(expect.objectContaining({ x: 'Impuestos', y: [100, 110], fillColor: '#ef4444' }));
  });

  it('curva: aplica interpolación "straight", "stepline" o "smooth" en line/area', () => {
    const lineBase: LuminaChartConfig = {
      type: 'line',
      categorias: ['A', 'B', 'C'],
      series: [{ nombre: 'Serie', valores: [1, 5, 2] }],
    };

    const recta = buildApexChart({ ...lineBase, curva: 'recta' }, theme);
    expect(recta.options.stroke?.curve).toBe('straight');

    const escalon = buildApexChart({ ...lineBase, curva: 'escalon' }, theme);
    expect(escalon.options.stroke?.curve).toBe('stepline');

    const suave = buildApexChart({ ...lineBase, curva: 'suave' }, theme);
    expect(suave.options.stroke?.curve).toBe('smooth');

    const porDefecto = buildApexChart(lineBase, theme);
    expect(porDefecto.options.stroke?.curve).toBe('smooth');
  });

  it('modoSparkline: habilita sparkline y oculta toolbar, grilla y leyenda', () => {
    const sparkConfig: LuminaChartConfig = {
      ...baseConfig,
      modoSparkline: true,
    };
    const built = buildApexChart(sparkConfig, theme);
    expect(built.options.chart?.sparkline?.enabled).toBe(true);
    expect(built.options.chart?.toolbar?.show).toBe(false);
    expect(built.options.grid?.show).toBe(false);
    expect(built.options.legend?.show).toBe(false);
  });

  it('angulo: "semicirculo" configura startAngle -90 y endAngle 90 en pie, donut y radialBar', () => {
    const pieBuilt = buildApexChart(
      {
        type: 'pie',
        categorias: ['A', 'B'],
        series: [{ nombre: 'S', valores: [50, 50] }],
        angulo: 'semicirculo',
      },
      theme,
    );
    expect(pieBuilt.options.plotOptions?.pie?.startAngle).toBe(-90);
    expect(pieBuilt.options.plotOptions?.pie?.endAngle).toBe(90);

    const donutBuilt = buildApexChart(
      {
        type: 'donut',
        categorias: ['A', 'B'],
        series: [{ nombre: 'S', valores: [40, 60] }],
        angulo: 'semicirculo',
      },
      theme,
    );
    expect(donutBuilt.options.plotOptions?.pie?.startAngle).toBe(-90);
    expect(donutBuilt.options.plotOptions?.pie?.endAngle).toBe(90);

    const radialBuilt = buildApexChart(
      {
        type: 'radialBar',
        categorias: ['Progreso'],
        series: [{ nombre: 'Meta', valores: [75] }],
        angulo: 'semicirculo',
      },
      theme,
    );
    expect(radialBuilt.options.plotOptions?.radialBar?.startAngle).toBe(-90);
    expect(radialBuilt.options.plotOptions?.radialBar?.endAngle).toBe(90);
  });

  it('mostrarTotal: true en donut activa la etiqueta total en el centro con la suma', () => {
    const donutBuilt = buildApexChart(
      {
        type: 'donut',
        categorias: ['A', 'B', 'C'],
        series: [{ nombre: 'S', valores: [10, 20, 30] }],
        mostrarTotal: true,
      },
      theme,
    );
    const totalConfig = donutBuilt.options.plotOptions?.pie?.donut?.labels?.total;
    expect(totalConfig?.show).toBe(true);
    expect(totalConfig?.label).toBe('Total');
    expect(totalConfig?.formatter?.(undefined as never)).toBe('60');
  });
});

describe('buildApexChart — Estadística: boxPlot e histogram (Etapa I3)', () => {
  it('boxPlot: chartType "boxPlot" y cada serie mapea sus cajas a [min, q1, mediana, q3, max]', () => {
    const boxPlotConfig: LuminaChartConfig = {
      type: 'boxPlot',
      categorias: ['Grupo A', 'Grupo B'],
      series: [
        {
          nombre: 'Notas',
          valores: [],
          cajas: [
            { min: 2, q1: 3, mediana: 4, q3: 4.5, max: 5 },
            { min: 1, q1: 2, mediana: 3, q3: 4, max: 5 },
          ],
        },
      ],
    };
    const built = buildApexChart(boxPlotConfig, theme);
    expect(built.chartType).toBe('boxPlot');
    expect(built.series).toEqual([
      {
        name: 'Notas',
        data: [
          { x: 'Grupo A', y: [2, 3, 4, 4.5, 5] },
          { x: 'Grupo B', y: [1, 2, 3, 4, 5] },
        ],
      },
    ]);
    expect(built.options.chart?.type).toBe('boxPlot');
    expect(built.options.xaxis?.categories).toEqual(['Grupo A', 'Grupo B']);
  });

  it('boxPlot: una categoría sin caja correspondiente cae a [0,0,0,0,0]', () => {
    const built = buildApexChart(
      {
        type: 'boxPlot',
        categorias: ['A', 'B'],
        series: [{ nombre: 'S', valores: [], cajas: [{ min: 1, q1: 2, mediana: 3, q3: 4, max: 5 }] }],
      },
      theme,
    );
    expect(built.series).toEqual([
      {
        name: 'S',
        data: [
          { x: 'A', y: [1, 2, 3, 4, 5] },
          { x: 'B', y: [0, 0, 0, 0, 0] },
        ],
      },
    ]);
  });

  it('boxPlot: colorea el cuerpo superior/inferior a partir de la paleta', () => {
    const built = buildApexChart(
      {
        type: 'boxPlot',
        categorias: ['A'],
        series: [
          { nombre: 'S1', valores: [], cajas: [{ min: 0, q1: 1, mediana: 2, q3: 3, max: 4 }] },
          { nombre: 'S2', valores: [], cajas: [{ min: 0, q1: 1, mediana: 2, q3: 3, max: 4 }] },
        ],
      },
      theme,
    );
    expect(built.options.plotOptions?.boxPlot?.colors?.upper).toBe(built.options.colors?.[0]);
    expect(built.options.plotOptions?.boxPlot?.colors?.lower).toBe(built.options.colors?.[1]);
  });

  it('histogram: chartType "bar" y bina los valores de la primera serie en columnas de frecuencia', () => {
    const histogramConfig: LuminaChartConfig = {
      type: 'histogram',
      categorias: [],
      series: [{ nombre: 'Puntajes', valores: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
      histogramBins: 5,
    };
    const built = buildApexChart(histogramConfig, theme);
    expect(built.chartType).toBe('bar');
    expect(built.options.chart?.type).toBe('bar');
    const series = built.series as { name?: string; data: unknown[] }[];
    expect(series).toHaveLength(1);
    expect(series[0].data).toEqual([2, 2, 2, 2, 3]);
    expect((series[0].data as number[]).reduce((a, b) => a + b, 0)).toBe(11);
    expect(built.options.xaxis?.categories).toHaveLength(5);
  });

  it('histogram: usa 8 bins por defecto si no se especifica histogramBins', () => {
    const built = buildApexChart(
      {
        type: 'histogram',
        categorias: [],
        series: [{ nombre: 'Datos', valores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
      },
      theme,
    );
    expect((built.series as { data: unknown[] }[])[0].data).toHaveLength(8);
  });

  it('histogram: ignora `categorias` del bloque — el eje X sale de los bordes de los bins', () => {
    const built = buildApexChart(
      {
        type: 'histogram',
        categorias: ['esto', 'se', 'ignora'],
        series: [{ nombre: 'Datos', valores: [1, 2, 3], color: '#123456' }],
        histogramBins: 2,
      },
      theme,
    );
    expect(built.options.xaxis?.categories).not.toEqual(['esto', 'se', 'ignora']);
    expect(built.options.colors).toEqual(['#123456']);
  });

  it('ordenDatos no reordena boxPlot ni histogram (no operan sobre valores/categorías planas)', () => {
    const boxPlot = buildApexChart(
      {
        type: 'boxPlot',
        categorias: ['A', 'B'],
        series: [{ nombre: 'S', valores: [], cajas: [{ min: 0, q1: 1, mediana: 2, q3: 3, max: 4 }] }],
        ordenDatos: 'ascendente',
      },
      theme,
    );
    expect(boxPlot.options.xaxis?.categories).toEqual(['A', 'B']);

    const histogram = buildApexChart(
      {
        type: 'histogram',
        categorias: [],
        series: [{ nombre: 'S', valores: [1, 2, 3] }],
        ordenDatos: 'descendente',
        histogramBins: 3,
      },
      theme,
    );
    expect((histogram.series as { data: unknown[] }[])[0].data).toHaveLength(3);
  });
});

describe('buildApexChart — Ejes, Series y Etiquetas/Leyenda (Etapa I4)', () => {
  it('formatoValor: cablea formatChartValue en yaxis.labels.formatter y tooltip.y.formatter', () => {
    const built = buildApexChart(
      { ...baseConfig, formatoValor: 'porcentaje' },
      theme,
    );
    const yaxis = built.options.yaxis as { labels?: { formatter?: (v: number) => string } };
    expect(yaxis.labels?.formatter?.(0.5)).toBe('50%');
    const tooltipY = built.options.tooltip?.y as { formatter?: (v: number, o: unknown) => string };
    expect(tooltipY.formatter?.(0.5, {})).toBe('50%');
  });

  it('sin formatoValor: no agrega formatter (comportamiento previo intacto)', () => {
    const built = buildApexChart(baseConfig, theme);
    const yaxis = built.options.yaxis as { labels?: { formatter?: unknown } };
    expect(yaxis.labels?.formatter).toBeUndefined();
    const tooltipY = built.options.tooltip?.y as { formatter?: unknown } | undefined;
    expect(tooltipY?.formatter).toBeUndefined();
  });

  it('formatoValor en eje X: solo se aplica con eje numérico (scatter/bubble)', () => {
    const scatterBuilt = buildApexChart(
      {
        type: 'scatter',
        categorias: [],
        series: [{ nombre: 'S', valores: [], puntos: [{ x: 1000, y: 1 }] }],
        formatoValor: 'entero',
      },
      theme,
    );
    const xaxis = scatterBuilt.options.xaxis as { labels?: { formatter?: (v: string) => string } };
    expect(xaxis.labels?.formatter?.('1000')).toBe('1.000');

    // column (eje X categórico) no debe recibir un formatter numérico —
    // las categorías son strings arbitrarios, no números.
    const columnBuilt = buildApexChart({ ...baseConfig, formatoValor: 'entero' }, theme);
    expect(columnBuilt.options.xaxis?.labels?.formatter).toBeUndefined();
  });

  it('ejeXRotacion: fija xaxis.labels.rotate cuando se especifica', () => {
    const built = buildApexChart({ ...baseConfig, ejeXRotacion: -45 }, theme);
    expect(built.options.xaxis?.labels?.rotate).toBe(-45);

    const sinRotar = buildApexChart(baseConfig, theme);
    expect(sinRotar.options.xaxis?.labels?.rotate).toBeUndefined();
  });

  it('ejeXOculto: oculta labels, borde y marcas del eje X', () => {
    const built = buildApexChart({ ...baseConfig, ejeXOculto: true }, theme);
    expect(built.options.xaxis?.labels?.show).toBe(false);
    expect(built.options.xaxis?.axisBorder?.show).toBe(false);
    expect(built.options.xaxis?.axisTicks?.show).toBe(false);

    const visible = buildApexChart(baseConfig, theme);
    expect(visible.options.xaxis?.labels?.show).toBe(true);
  });

  it('ejeYOculto: oculta el eje Y primario (labels y el eje entero)', () => {
    const built = buildApexChart({ ...baseConfig, ejeYOculto: true }, theme);
    const yaxis = built.options.yaxis as { show?: boolean; labels?: { show?: boolean } };
    expect(yaxis.show).toBe(false);
    expect(yaxis.labels?.show).toBe(false);
  });

  it('grillas: "ninguna" oculta ambas líneas; "y" solo conserva la horizontal', () => {
    const ninguna = buildApexChart({ ...baseConfig, grillas: 'ninguna' }, theme);
    expect(ninguna.options.grid?.xaxis?.lines?.show).toBe(false);
    expect(ninguna.options.grid?.yaxis?.lines?.show).toBe(false);

    const soloY = buildApexChart({ ...baseConfig, grillas: 'y' }, theme);
    expect(soloY.options.grid?.xaxis?.lines?.show).toBe(false);
    expect(soloY.options.grid?.yaxis?.lines?.show).toBe(true);

    const ambas = buildApexChart(baseConfig, theme);
    expect(ambas.options.grid?.xaxis?.lines?.show).toBe(true);
    expect(ambas.options.grid?.yaxis?.lines?.show).toBe(true);
  });

  it('posicionLeyenda: sobreescribe la posición por defecto de cada tipo', () => {
    const arriba = buildApexChart({ ...baseConfig, posicionLeyenda: 'arriba' }, theme);
    expect(arriba.options.legend?.position).toBe('top');

    const izquierda = buildApexChart({ ...baseConfig, posicionLeyenda: 'izquierda' }, theme);
    expect(izquierda.options.legend?.position).toBe('left');

    // radialBar sin posicionLeyenda sigue cayendo a la derecha (default previo)
    const radial = buildApexChart(
      { type: 'radialBar', categorias: ['A'], series: [{ nombre: 'S', valores: [50] }] },
      theme,
    );
    expect(radial.options.legend?.position).toBe('right');

    // radialBar con posicionLeyenda explícito la respeta
    const radialAbajo = buildApexChart(
      { type: 'radialBar', categorias: ['A'], series: [{ nombre: 'S', valores: [50] }], posicionLeyenda: 'abajo' },
      theme,
    );
    expect(radialAbajo.options.legend?.position).toBe('bottom');
  });

  it('color por serie: sigue funcionando (ya existía, sin regresión de I4)', () => {
    const built = buildApexChart(
      { ...baseConfig, series: [{ nombre: 'A', valores: [1, 2, 3], color: '#FF00FF' }] },
      theme,
    );
    expect(built.options.colors).toEqual(['#FF00FF']);
  });

  it('curvaLinea por serie: cada serie de un combo puede pedir su propia curva', () => {
    const built = buildApexChart(
      {
        type: 'combo',
        categorias: ['A', 'B'],
        series: [
          { nombre: 'Recta', valores: [1, 2], tipoCombo: 'line', curvaLinea: 'recta' },
          { nombre: 'Suave', valores: [3, 4], tipoCombo: 'line', curvaLinea: 'suave' },
        ],
      },
      theme,
    );
    expect(built.options.stroke?.curve).toEqual(['straight', 'smooth']);
  });

  it('curvaLinea: sin overrides por serie, stroke.curve sigue siendo un escalar (paridad con I2)', () => {
    const built = buildApexChart(
      { type: 'line', categorias: ['A', 'B'], series: [{ nombre: 'S', valores: [1, 2] }], curva: 'escalon' },
      theme,
    );
    expect(built.options.stroke?.curve).toBe('stepline');
  });

  it('grosorLinea por serie: cambia el ancho de línea individual en line/area', () => {
    const built = buildApexChart(
      {
        type: 'line',
        categorias: ['A', 'B'],
        series: [
          { nombre: 'Fina', valores: [1, 2], grosorLinea: 1 },
          { nombre: 'Gruesa', valores: [3, 4], grosorLinea: 5 },
        ],
      },
      theme,
    );
    expect(built.options.stroke?.width).toEqual([1, 5]);

    const sinOverride = buildApexChart(
      { type: 'line', categorias: ['A'], series: [{ nombre: 'S', valores: [1] }] },
      theme,
    );
    expect(sinOverride.options.stroke?.width).toBe(2);
  });

  it('mostrarPuntos por serie: agrega markers solo cuando alguna serie lo pide', () => {
    const built = buildApexChart(
      {
        type: 'line',
        categorias: ['A', 'B'],
        series: [
          { nombre: 'Con puntos', valores: [1, 2], mostrarPuntos: true },
          { nombre: 'Sin puntos', valores: [3, 4] },
        ],
      },
      theme,
    );
    expect(built.options.markers?.size).toEqual([4, 0]);

    const sinPuntos = buildApexChart(
      { type: 'line', categorias: ['A'], series: [{ nombre: 'S', valores: [1] }] },
      theme,
    );
    expect(sinPuntos.options.markers).toBeUndefined();
  });

  it('opacidadRelleno por serie: en area reemplaza el gradiente por opacidad plana cuando se pide', () => {
    const conOverride = buildApexChart(
      {
        type: 'area',
        categorias: ['A'],
        series: [{ nombre: 'S', valores: [1], opacidadRelleno: 0.7 }],
      },
      theme,
    );
    expect(conOverride.options.fill?.opacity).toEqual([0.7]);
    expect(conOverride.options.fill?.type).not.toBe('gradient');

    const sinOverride = buildApexChart(
      { type: 'area', categorias: ['A'], series: [{ nombre: 'S', valores: [1] }] },
      theme,
    );
    expect(sinOverride.options.fill?.type).toBe('gradient');
  });
});

describe('buildApexChart — Estilo y Anotaciones múltiples (Etapa I5)', () => {
  it('lineasReferencia: soporta múltiples líneas, cada una con su propio color', () => {
    const built = buildApexChart(
      {
        ...baseConfig,
        lineasReferencia: [
          { valor: 80, etiqueta: 'Meta' },
          { valor: 50, etiqueta: 'Mínimo', color: '#ff0000' },
        ],
      },
      theme,
    );
    const yaxis = built.options.annotations?.yaxis ?? [];
    expect(yaxis).toHaveLength(2);
    expect(yaxis[0]).toMatchObject({ y: 80, label: { text: 'Meta' } });
    expect(yaxis[1]).toMatchObject({ y: 50, borderColor: '#ff0000', label: { text: 'Mínimo' } });
  });

  it('bandas: genera anotaciones de rango [desde, hasta] con color y etiqueta', () => {
    const built = buildApexChart(
      {
        ...baseConfig,
        bandas: [{ desde: 0, hasta: 30, etiqueta: 'Riesgo', color: '#ef4444' }],
      },
      theme,
    );
    const yaxis = built.options.annotations?.yaxis ?? [];
    expect(yaxis).toHaveLength(1);
    expect(yaxis[0]).toMatchObject({ y: 0, y2: 30, fillColor: '#ef4444', label: { text: 'Riesgo' } });
  });

  it('bandas + lineasReferencia combinadas: las bandas van primero, ambas conviven', () => {
    const built = buildApexChart(
      {
        ...baseConfig,
        bandas: [{ desde: 0, hasta: 30 }],
        lineasReferencia: [{ valor: 80 }],
      },
      theme,
    );
    const yaxis = built.options.annotations?.yaxis ?? [];
    expect(yaxis).toHaveLength(2);
    expect(yaxis[0]).toMatchObject({ y: 0, y2: 30 });
    expect(yaxis[1]).toMatchObject({ y: 80 });
  });

  it('sin lineasReferencia ni bandas: annotations queda undefined (paridad previa a I5)', () => {
    const built = buildApexChart(baseConfig, theme);
    expect(built.options.annotations).toBeUndefined();
  });

  it('paletaPersonalizada: sobreescribe la paleta por índice, salvo color explícito de serie', () => {
    const built = buildApexChart(
      {
        type: 'column',
        categorias: ['A', 'B'],
        series: [
          { nombre: 'S1', valores: [1, 2] },
          { nombre: 'S2', valores: [3, 4], color: '#00ff00' },
        ],
        paletaPersonalizada: ['#111111', '#222222'],
      },
      theme,
    );
    expect(built.options.colors).toEqual(['#111111', '#00ff00']);
  });

  it('paletaPersonalizada: recicla el arreglo si hay más series que colores', () => {
    const built = buildApexChart(
      {
        type: 'column',
        categorias: ['A'],
        series: [
          { nombre: 'S1', valores: [1] },
          { nombre: 'S2', valores: [2] },
          { nombre: 'S3', valores: [3] },
        ],
        paletaPersonalizada: ['#aaa', '#bbb'],
      },
      theme,
    );
    expect(built.options.colors).toEqual(['#aaa', '#bbb', '#aaa']);
  });

  it('estilo.esquinas: sobreescribe el borderRadius por defecto de barras/columnas', () => {
    const built = buildApexChart({ ...baseConfig, estilo: { esquinas: 12 } }, theme);
    expect(built.options.plotOptions?.bar?.borderRadius).toBe(12);

    const sinEstilo = buildApexChart(baseConfig, theme);
    expect(sinEstilo.options.plotOptions?.bar?.borderRadius).toBe(4);
  });

  it('estilo.sombra: activa dropShadow', () => {
    const conSombra = buildApexChart({ ...baseConfig, estilo: { sombra: true } }, theme);
    expect(conSombra.options.chart?.dropShadow?.enabled).toBe(true);

    const sinSombra = buildApexChart(baseConfig, theme);
    expect(sinSombra.options.chart?.dropShadow?.enabled).toBe(false);
  });

  it('estilo.fuente: sobreescribe fontFamily; sin especificar usa "inherit"', () => {
    const built = buildApexChart({ ...baseConfig, estilo: { fuente: 'Georgia' } }, theme);
    expect(built.options.chart?.fontFamily).toBe('Georgia');

    const sinFuente = buildApexChart(baseConfig, theme);
    expect(sinFuente.options.chart?.fontFamily).toBe('inherit');
  });

  it('estilo.fondo: "tarjeta" usa el color de superficie del tema; sin especificar es transparente', () => {
    const conFondo = buildApexChart({ ...baseConfig, estilo: { fondo: 'tarjeta' } }, theme);
    expect(conFondo.options.chart?.background).toBe(theme.surfaceColor);

    const sinFondo = buildApexChart(baseConfig, theme);
    expect(sinFondo.options.chart?.background).toBe('transparent');
  });

  it('estilo.duracionAnimacion: solo aplica cuando animar está activo', () => {
    const conAnimar = buildApexChart({ ...baseConfig, animar: true, estilo: { duracionAnimacion: 500 } }, theme);
    expect(conAnimar.options.chart?.animations?.speed).toBe(500);

    const sinAnimar = buildApexChart({ ...baseConfig, estilo: { duracionAnimacion: 500 } }, theme);
    expect(sinAnimar.options.chart?.animations?.enabled).toBe(false);
    expect(sinAnimar.options.chart?.animations?.speed).toBeUndefined();
  });

  it('estilo.grosorAnillo: controla plotOptions.radialBar.hollow.size (%); ignorado fuera de radialBar', () => {
    const radialConfig: LuminaChartConfig = {
      type: 'radialBar',
      categorias: ['Progreso'],
      series: [{ nombre: 'Progreso', valores: [72] }],
    };

    const conGrosor = buildApexChart({ ...radialConfig, estilo: { grosorAnillo: 55 } }, theme);
    expect(conGrosor.options.plotOptions?.radialBar?.hollow?.size).toBe('55%');

    const sinGrosor = buildApexChart(radialConfig, theme);
    expect(sinGrosor.options.plotOptions?.radialBar?.hollow?.size).toBe('30%');

    // Se acota a [0, 100] contra valores fuera de rango.
    const fueraDeRango = buildApexChart({ ...radialConfig, estilo: { grosorAnillo: 150 } }, theme);
    expect(fueraDeRango.options.plotOptions?.radialBar?.hollow?.size).toBe('100%');

    // No aplica a otros tipos circulares (pie no tiene plotOptions.radialBar).
    const enPie = buildApexChart({ ...baseConfig, type: 'pie', estilo: { grosorAnillo: 55 } }, theme);
    expect(enPie.options.plotOptions?.radialBar).toBeUndefined();
  });

  it('estilo.puntasRedondeadas: activa stroke.lineCap "round" solo en radialBar', () => {
    const radialConfig: LuminaChartConfig = {
      type: 'radialBar',
      categorias: ['Progreso'],
      series: [{ nombre: 'Progreso', valores: [72] }],
    };

    const redondeado = buildApexChart({ ...radialConfig, estilo: { puntasRedondeadas: true } }, theme);
    expect(redondeado.options.stroke?.lineCap).toBe('round');

    // Por defecto no se setea `stroke` (ApexCharts usa su default 'butt').
    const sinRedondear = buildApexChart(radialConfig, theme);
    expect(sinRedondear.options.stroke).toBeUndefined();

    // No aplica fuera de radialBar, aunque se pida.
    const enPie = buildApexChart({ ...baseConfig, type: 'pie', estilo: { puntasRedondeadas: true } }, theme);
    expect(enPie.options.stroke).toBeUndefined();
  });

  it('angulo "semicirculo" en radialBar mueve el fallback de leyenda a "bottom" (evita el achicamiento de Dimensions.js con legend a la derecha + chart.height:"auto")', () => {
    const radialConfig: LuminaChartConfig = {
      type: 'radialBar',
      categorias: ['Progreso'],
      series: [{ nombre: 'Progreso', valores: [72] }],
      mostrarLeyenda: true,
    };

    const circuloCompleto = buildApexChart(radialConfig, theme);
    expect(circuloCompleto.options.legend?.position).toBe('right');

    const semicirculo = buildApexChart({ ...radialConfig, angulo: 'semicirculo' }, theme);
    expect(semicirculo.options.legend?.position).toBe('bottom');

    // Un `posicionLeyenda` explícito del docente sigue ganando sobre el fallback.
    const semicirculoConPosicionExplicita = buildApexChart(
      { ...radialConfig, angulo: 'semicirculo', posicionLeyenda: 'derecha' },
      theme,
    );
    expect(semicirculoConPosicionExplicita.options.legend?.position).toBe('right');
  });
});

