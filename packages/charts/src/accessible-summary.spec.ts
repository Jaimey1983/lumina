import { describe, expect, it } from 'vitest';
import { generarResumenAccesible } from './accessible-summary.js';
import type { LuminaChartConfig } from './types.js';

describe('generarResumenAccesible — cartesianos (column/bar/line/area/combo/waterfall)', () => {
  it('column: resume rango por serie y la categoría del máximo global (ejemplo del plan)', () => {
    const config: LuminaChartConfig = {
      type: 'column',
      categorias: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
      series: [
        { nombre: 'Grupo A', valores: [65, 59, 80, 81, 56] },
        { nombre: 'Grupo B', valores: [28, 48, 40, 19, 86] },
      ],
    };
    const resumen = generarResumenAccesible(config);
    expect(resumen).toBe(
      'Gráfico de columnas: Grupo A varía entre 56 y 81, Grupo B varía entre 19 y 86, con el valor máximo en May.',
    );
  });

  it('bar/line/area/combo/waterfall: cada uno con su propia etiqueta de tipo', () => {
    const base = { categorias: ['A', 'B'], series: [{ nombre: 'S', valores: [1, 2] }] };
    expect(generarResumenAccesible({ ...base, type: 'bar' })).toContain('Gráfico de barras');
    expect(generarResumenAccesible({ ...base, type: 'line' })).toContain('Gráfico de líneas');
    expect(generarResumenAccesible({ ...base, type: 'area' })).toContain('Gráfico de área');
    expect(generarResumenAccesible({ ...base, type: 'combo' })).toContain('Gráfico combinado');
    expect(generarResumenAccesible({ ...base, type: 'waterfall' })).toContain('Gráfico de cascada');
  });

  it('serie con un único valor constante: "en X" en vez de "varía entre X y X"', () => {
    const resumen = generarResumenAccesible({
      type: 'column',
      categorias: ['Ene'],
      series: [{ nombre: 'Constante', valores: [42] }],
    });
    expect(resumen).toBe('Gráfico de columnas: Constante en 42, con el valor máximo en Ene.');
  });

  it('sin categorías o sin series: mensaje de "sin datos disponibles"', () => {
    expect(generarResumenAccesible({ type: 'column', categorias: [], series: [] })).toBe(
      'Gráfico de columnas sin datos disponibles.',
    );
  });

  it('decimales: se formatean con 1 decimal (es-CO, coma decimal); enteros sin decimales', () => {
    const resumen = generarResumenAccesible({
      type: 'line',
      categorias: ['A', 'B'],
      series: [{ nombre: 'S', valores: [1.25, 2] }],
    });
    expect(resumen).toBe('Gráfico de líneas: S varía entre 1,3 y 2, con el valor máximo en B.');
  });
});

describe('generarResumenAccesible — circulares (pie/donut/radialBar/polarArea)', () => {
  it('pie: reporta la categoría mayor y su porcentaje del total', () => {
    const resumen = generarResumenAccesible({
      type: 'pie',
      categorias: ['Bajo', 'Alto'],
      series: [{ nombre: 'S', valores: [30, 70] }],
    });
    expect(resumen).toBe('Gráfico circular con 2 categorías: la mayor es Alto con 70 (70% del total).');
  });

  it('donut/radialBar/polarArea: etiquetas propias', () => {
    const base = { categorias: ['A'], series: [{ nombre: 'S', valores: [10] }] };
    expect(generarResumenAccesible({ ...base, type: 'donut' })).toContain('Gráfico de dona');
    expect(generarResumenAccesible({ ...base, type: 'radialBar' })).toContain('Gráfico radial');
    expect(generarResumenAccesible({ ...base, type: 'polarArea' })).toContain('Gráfico de área polar');
  });

  it('total 0: omite el porcentaje sin reventar', () => {
    const resumen = generarResumenAccesible({
      type: 'pie',
      categorias: ['A', 'B'],
      series: [{ nombre: 'S', valores: [0, 0] }],
    });
    expect(resumen).not.toContain('%');
  });
});

describe('generarResumenAccesible — dispersión (scatter/bubble)', () => {
  it('scatter: reporta cantidad de puntos y rango de X/Y', () => {
    const resumen = generarResumenAccesible({
      type: 'scatter',
      categorias: [],
      series: [
        { nombre: 'S', valores: [], puntos: [{ x: 1, y: 10 }, { x: 5, y: 2 }] },
      ],
    });
    expect(resumen).toBe('Gráfico de dispersión con 2 puntos en 1 serie: eje X entre 1 y 5, eje Y entre 2 y 10.');
  });

  it('bubble: usa su propia etiqueta', () => {
    const resumen = generarResumenAccesible({
      type: 'bubble',
      categorias: [],
      series: [{ nombre: 'S', valores: [], puntos: [{ x: 1, y: 1, z: 5 }] }],
    });
    expect(resumen).toContain('Gráfico de burbujas');
  });

  it('sin puntos: "sin datos disponibles"', () => {
    expect(
      generarResumenAccesible({ type: 'scatter', categorias: [], series: [{ nombre: 'S', valores: [] }] }),
    ).toBe('Gráfico de dispersión sin datos disponibles.');
  });
});

describe('generarResumenAccesible — boxPlot', () => {
  it('reporta cantidad de grupos y rango [min global, max global]', () => {
    const resumen = generarResumenAccesible({
      type: 'boxPlot',
      categorias: ['Grupo A', 'Grupo B'],
      series: [
        {
          nombre: 'Distribución',
          valores: [],
          cajas: [
            { min: 60, q1: 70, mediana: 75, q3: 82, max: 95 },
            { min: 50, q1: 65, mediana: 72, q3: 80, max: 90 },
          ],
        },
      ],
    });
    expect(resumen).toBe('Diagrama de cajas con 2 grupos: valores entre 50 y 95.');
  });

  it('sin cajas: "sin datos numéricos"', () => {
    const resumen = generarResumenAccesible({
      type: 'boxPlot',
      categorias: ['A'],
      series: [{ nombre: 'S', valores: [] }],
    });
    expect(resumen).toBe('Diagrama de cajas con 1 grupo, sin datos numéricos.');
  });
});

describe('generarResumenAccesible — histogram', () => {
  it('reporta cantidad de datos, número de bins y rango', () => {
    const resumen = generarResumenAccesible({
      type: 'histogram',
      categorias: [],
      series: [{ nombre: 'Puntajes', valores: [1, 2, 3, 4, 5] }],
      histogramBins: 4,
    });
    expect(resumen).toBe('Histograma de 5 datos agrupados en 4 intervalos, entre 1 y 5.');
  });

  it('sin valores: "sin datos disponibles"', () => {
    expect(
      generarResumenAccesible({ type: 'histogram', categorias: [], series: [{ nombre: 'S', valores: [] }] }),
    ).toBe('Histograma sin datos disponibles.');
  });
});

describe('generarResumenAccesible — treemap/funnel', () => {
  it('treemap: reporta la mayor área', () => {
    const resumen = generarResumenAccesible({
      type: 'treemap',
      categorias: ['Matemáticas', 'Lenguaje'],
      series: [{ nombre: 'S', valores: [40, 35] }],
    });
    expect(resumen).toBe('Treemap con 2 áreas: la más grande es Matemáticas con 40.');
  });

  it('funnel: reporta la etapa más grande', () => {
    const resumen = generarResumenAccesible({
      type: 'funnel',
      categorias: ['Vistas', 'Clics', 'Compras'],
      series: [{ nombre: 'S', valores: [1000, 200, 50] }],
    });
    expect(resumen).toBe('Embudo con 3 etapas: la más grande es Vistas con 1000.');
  });
});

describe('generarResumenAccesible — heatmap y radar', () => {
  it('heatmap: reporta filas × columnas y rango de intensidad', () => {
    const resumen = generarResumenAccesible({
      type: 'heatmap',
      categorias: ['Lunes', 'Martes'],
      series: [
        { nombre: 'Mañana', valores: [5, 8] },
        { nombre: 'Tarde', valores: [12, 15] },
      ],
    });
    expect(resumen).toBe('Mapa de calor con 2 filas y 2 columnas: intensidad entre 5 y 15.');
  });

  it('radar: reporta ejes y perfiles con sus nombres', () => {
    const resumen = generarResumenAccesible({
      type: 'radar',
      categorias: ['Fuerza', 'Agilidad', 'Inteligencia'],
      series: [{ nombre: 'Personaje A', valores: [80, 90, 70] }],
    });
    expect(resumen).toBe('Gráfico de radar con 3 ejes y 1 perfil (Personaje A).');
  });
});
