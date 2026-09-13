import { describe, expect, it } from 'vitest';
import {
  createDefaultGraficoBlock,
  normalizeGraficoBlock,
  VALID_GRAFICO_CHART_TYPES,
} from './grafico-defaults.js';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

describe('grafico-defaults', () => {
  it('crea un bloque grafico por defecto con contratos v1 correctos', () => {
    const block = createDefaultGraficoBlock();

    expect(block.tipo).toBe('grafico');
    expect(block.modo).toBe('contenido');
    expect(block.soloLecturaEnViewer).toBe(true);
    expect(block.chartType).toBe('column');
    expect(block.categorias.length).toBeGreaterThan(0);
    expect(block.series.length).toBeGreaterThan(0);
    expect(block.series[0].valores.length).toBe(block.categorias.length);
    expect(block.mostrarLeyenda).toBe(true);
    expect(block.x).toBe(BLOCK_FALLBACKS.grafico.x);
    expect(block.y).toBe(BLOCK_FALLBACKS.grafico.y);
    expect(block.ancho).toBe(BLOCK_FALLBACKS.grafico.ancho);
    expect(block.alto).toBe(BLOCK_FALLBACKS.grafico.alto);
  });

  it('permite sobrescribir propiedades con partial y marco', () => {
    const block = createDefaultGraficoBlock(
      {
        chartType: 'pie',
        titulo: 'Distribución de Notas',
        categorias: ['Aprobado', 'Reprobado'],
        series: [{ nombre: 'Alumnos', valores: [25, 5] }],
      },
      {
        izquierdaPct: 10,
        arribaPct: 20,
        anchoPct: 50,
        altoPct: 40,
      },
    );

    expect(block.chartType).toBe('pie');
    expect(block.titulo).toBe('Distribución de Notas');
    expect(block.categorias).toEqual(['Aprobado', 'Reprobado']);
    expect(block.series[0].valores).toEqual([25, 5]);
    expect(block.x).toBe(10);
    expect(block.y).toBe(20);
    expect(block.ancho).toBe(50);
    expect(block.alto).toBe(40);
  });

  it('normalizeGraficoBlock sanitiza datos corruptos y fuerza modo contenido y soloLectura', () => {
    const corruptInput = {
      tipo: 'grafico',
      modo: 'otro_modo_invalido',
      soloLecturaEnViewer: false,
      chartType: 'invalido_xxx',
      categorias: [null, undefined, 123, '  '],
      series: [
        { nombre: '', valores: ['10', 'not_a_number', null] },
        null,
      ],
      x: 'not_a_number',
      y: null,
      ancho: NaN,
      alto: -10,
    };

    const normalized = normalizeGraficoBlock(corruptInput);

    expect(normalized.tipo).toBe('grafico');
    expect(normalized.modo).toBe('contenido');
    expect(normalized.soloLecturaEnViewer).toBe(true);
    expect(normalized.chartType).toBe('column');
    expect(normalized.categorias.length).toBeGreaterThan(0);
    expect(normalized.series.length).toBeGreaterThan(0);
    expect(typeof normalized.series[0].valores[0]).toBe('number');
    expect(normalized.x).toBe(BLOCK_FALLBACKS.grafico.x);
    expect(normalized.y).toBe(BLOCK_FALLBACKS.grafico.y);
  });

  it('soporta todos los tipos de gráfico válidos (18 tipos)', () => {
    expect(VALID_GRAFICO_CHART_TYPES).toHaveLength(18);
    for (const type of VALID_GRAFICO_CHART_TYPES) {
      const b = normalizeGraficoBlock({ tipo: 'grafico', chartType: type });
      expect(b.chartType).toBe(type);
    }
  });

  it('alinea la longitud de valores de las series con la cantidad de categorías', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      categorias: ['A', 'B', 'C', 'D'],
      series: [
        { nombre: 'S1', valores: [10, 20] }, // Faltan 2 valores
      ],
    });

    expect(normalized.series[0].valores).toEqual([10, 20, 0, 0]);
  });

  it('sanitiza campos de configuración fina de forma aditiva', () => {
    const raw = {
      tipo: 'grafico',
      chartType: 'combo',
      apilado: 'normal',
      ejeXTitulo: '  Trimestre  ',
      ejeYTitulo: '  Ventas  ',
      ejeYMin: 0,
      ejeYMax: 500,
      ejeYEscalaLog: true,
      mostrarEtiquetasDatos: true,
      lineaReferencia: { valor: 250, etiqueta: '  Meta  ' }, // formato legado (pre-I5) — sanitizeLineasReferencia lo migra
      animar: true,
      ordenDatos: 'descendente',
      exportarImagen: false,
      curva: 'escalon',
      modoSparkline: true,
      mostrarTotal: true,
      angulo: 'semicirculo',
      series: [
        {
          nombre: 'S1',
          valores: [100],
          tipoCombo: 'column',
          ejeCombo: 'primario',
        },
        {
          nombre: 'S2',
          valores: [200],
          tipoCombo: 'line',
          ejeCombo: 'secundario',
        },
      ],
      categorias: ['T1'],
    };

    const normalized = normalizeGraficoBlock(raw);

    expect(normalized.chartType).toBe('combo');
    expect(normalized.apilado).toBe('normal');
    expect(normalized.ejeXTitulo).toBe('Trimestre');
    expect(normalized.ejeYTitulo).toBe('Ventas');
    expect(normalized.ejeYMin).toBe(0);
    expect(normalized.ejeYMax).toBe(500);
    expect(normalized.ejeYEscalaLog).toBe(true);
    expect(normalized.mostrarEtiquetasDatos).toBe(true);
    expect(normalized.lineasReferencia).toEqual([{ valor: 250, etiqueta: 'Meta' }]);
    expect(normalized.animar).toBe(true);
    expect(normalized.ordenDatos).toBe('descendente');
    expect(normalized.exportarImagen).toBe(false);
    expect(normalized.curva).toBe('escalon');
    expect(normalized.modoSparkline).toBe(true);
    expect(normalized.mostrarTotal).toBe(true);
    expect(normalized.angulo).toBe('semicirculo');
    expect(normalized.series[0].tipoCombo).toBe('column');
    expect(normalized.series[0].ejeCombo).toBe('primario');
    expect(normalized.series[1].tipoCombo).toBe('line');
    expect(normalized.series[1].ejeCombo).toBe('secundario');
  });

  it('sanitiza y preserva puntos para scatter y bubble', () => {
    const raw = {
      tipo: 'grafico',
      chartType: 'bubble',
      series: [
        {
          nombre: 'Burbujas',
          valores: [],
          puntos: [
            { x: '10', y: '20', z: '30' },
            { x: 'invalid', y: 40, z: null },
          ],
        },
      ],
    };

    const normalized = normalizeGraficoBlock(raw);
    expect(normalized.series[0].puntos).toEqual([
      { x: 10, y: 20, z: 30 },
      { x: 0, y: 40, z: 0 },
    ]);
  });

  it('createDefaultGraficoBlock inicializa puntos al crear scatter o bubble', () => {
    const scatter = createDefaultGraficoBlock({ chartType: 'scatter' });
    expect(scatter.chartType).toBe('scatter');
    expect(scatter.series[0].puntos?.length).toBeGreaterThan(0);

    const bubble = createDefaultGraficoBlock({ chartType: 'bubble' });
    expect(bubble.chartType).toBe('bubble');
    expect(bubble.series[0].puntos?.[0].z).toBeDefined();
  });

  it('createDefaultGraficoBlock genera defaults apropiados para waterfall y polarArea', () => {
    const waterfall = createDefaultGraficoBlock({ chartType: 'waterfall' });
    expect(waterfall.chartType).toBe('waterfall');
    expect(waterfall.series[0].valores).toHaveLength(waterfall.categorias.length);
    expect(waterfall.series[0].valores).toEqual([100, 35, -20, 40, -15]);

    const polarArea = createDefaultGraficoBlock({ chartType: 'polarArea' });
    expect(polarArea.chartType).toBe('polarArea');
    expect(polarArea.series[0].valores).toHaveLength(polarArea.categorias.length);
  });

  it('createDefaultGraficoBlock genera defaults apropiados para boxPlot (cajas alineadas a categorías)', () => {
    const boxPlot = createDefaultGraficoBlock({ chartType: 'boxPlot' });
    expect(boxPlot.chartType).toBe('boxPlot');
    expect(boxPlot.categorias.length).toBeGreaterThan(1);
    expect(boxPlot.series[0].cajas).toHaveLength(boxPlot.categorias.length);
    for (const caja of boxPlot.series[0].cajas ?? []) {
      expect(caja.min).toBeLessThanOrEqual(caja.q1);
      expect(caja.q1).toBeLessThanOrEqual(caja.mediana);
      expect(caja.mediana).toBeLessThanOrEqual(caja.q3);
      expect(caja.q3).toBeLessThanOrEqual(caja.max);
    }
  });

  it('createDefaultGraficoBlock genera defaults apropiados para histogram (categorías = etiquetas de dato, no del eje)', () => {
    const histogram = createDefaultGraficoBlock({ chartType: 'histogram' });
    expect(histogram.chartType).toBe('histogram');
    expect(histogram.series[0].valores.length).toBeGreaterThan(1);
    expect(histogram.categorias).toHaveLength(histogram.series[0].valores.length);
  });

  it('normalizeGraficoBlock sanitiza `cajas` de boxPlot alineándolas a la cantidad de categorías', () => {
    const raw = {
      tipo: 'grafico',
      chartType: 'boxPlot',
      categorias: ['A', 'B', 'C'],
      series: [
        {
          nombre: 'Distribución',
          valores: [],
          cajas: [
            { min: '1', q1: 2, mediana: 3, q3: 4, max: '5' },
            { min: 'invalido', q1: null, mediana: 3, q3: 4, max: 5 },
          ],
        },
      ],
    };

    const normalized = normalizeGraficoBlock(raw);
    expect(normalized.series[0].cajas).toEqual([
      { min: 1, q1: 2, mediana: 3, q3: 4, max: 5 },
      { min: 0, q1: 0, mediana: 3, q3: 4, max: 5 },
      { min: 0, q1: 0, mediana: 0, q3: 0, max: 0 },
    ]);
  });

  it('normalizeGraficoBlock sanitiza `histogramBins` de forma aditiva y retrocompatible', () => {
    const withBins = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'histogram',
      histogramBins: '12.6',
    });
    expect(withBins.histogramBins).toBeUndefined();

    const withNumericBins = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'histogram',
      histogramBins: 12.6,
    });
    expect(withNumericBins.histogramBins).toBe(13);

    // Un bloque guardado antes de I3 (sin histogramBins) sigue abriendo igual.
    const legacyBlock = normalizeGraficoBlock({ tipo: 'grafico', chartType: 'column' });
    expect(legacyBlock.histogramBins).toBeUndefined();
  });

  it('normalizeGraficoBlock sanitiza los campos de ejes/formato/leyenda de la Etapa I4', () => {
    const raw = {
      tipo: 'grafico',
      chartType: 'line',
      formatoValor: 'porcentaje',
      ejeXRotacion: '-45',
      ejeXOculto: true,
      ejeYOculto: false,
      grillas: 'y',
      posicionLeyenda: 'izquierda',
    };

    const normalized = normalizeGraficoBlock(raw);
    // ejeXRotacion llega como string en `raw` (posible entrada corrupta) → no es number, se descarta.
    expect(normalized.ejeXRotacion).toBeUndefined();
    expect(normalized.formatoValor).toBe('porcentaje');
    expect(normalized.ejeXOculto).toBe(true);
    expect(normalized.ejeYOculto).toBe(false);
    expect(normalized.grillas).toBe('y');
    expect(normalized.posicionLeyenda).toBe('izquierda');

    const withNumericRotation = normalizeGraficoBlock({ ...raw, ejeXRotacion: -45 });
    expect(withNumericRotation.ejeXRotacion).toBe(-45);
  });

  it('normalizeGraficoBlock descarta valores inválidos de los campos I4 sin romper el resto', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'column',
      formatoValor: 'no_valido',
      grillas: 'no_valido',
      posicionLeyenda: 'no_valido',
    });
    expect(normalized.formatoValor).toBeUndefined();
    expect(normalized.grillas).toBeUndefined();
    expect(normalized.posicionLeyenda).toBeUndefined();

    // Un bloque guardado antes de I4 sigue abriendo igual.
    const legacyBlock = normalizeGraficoBlock({ tipo: 'grafico', chartType: 'column' });
    expect(legacyBlock.formatoValor).toBeUndefined();
    expect(legacyBlock.ejeXRotacion).toBeUndefined();
    expect(legacyBlock.ejeXOculto).toBeUndefined();
    expect(legacyBlock.ejeYOculto).toBeUndefined();
    expect(legacyBlock.grillas).toBeUndefined();
    expect(legacyBlock.posicionLeyenda).toBeUndefined();
  });

  it('normalizeGraficoBlock sanitiza el estilo por serie de la Etapa I4 (curvaLinea/grosorLinea/mostrarPuntos/opacidadRelleno)', () => {
    const raw = {
      tipo: 'grafico',
      chartType: 'line',
      categorias: ['A'],
      series: [
        {
          nombre: 'S1',
          valores: [1],
          curvaLinea: 'recta',
          grosorLinea: 4,
          mostrarPuntos: true,
          opacidadRelleno: 1.5, // fuera de rango, debe acotarse a 1
        },
        {
          nombre: 'S2',
          valores: [2],
          curvaLinea: 'no_valido',
          grosorLinea: 'no_numerico',
          opacidadRelleno: -1, // fuera de rango, debe acotarse a 0
        },
      ],
    };

    const normalized = normalizeGraficoBlock(raw);
    expect(normalized.series[0].curvaLinea).toBe('recta');
    expect(normalized.series[0].grosorLinea).toBe(4);
    expect(normalized.series[0].mostrarPuntos).toBe(true);
    expect(normalized.series[0].opacidadRelleno).toBe(1);
    expect(normalized.series[1].curvaLinea).toBeUndefined();
    expect(normalized.series[1].grosorLinea).toBeUndefined();
    expect(normalized.series[1].mostrarPuntos).toBeUndefined();
    expect(normalized.series[1].opacidadRelleno).toBe(0);
  });

  it('normalizeGraficoBlock: `lineasReferencia` (formato nuevo, Etapa I5) sanitiza cada elemento del arreglo', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'line',
      lineasReferencia: [
        { valor: 80, etiqueta: '  Meta  ', color: '#ff0000' },
        { valor: 'no_numerico' }, // se descarta
        { valor: 50 },
      ],
    });
    expect(normalized.lineasReferencia).toEqual([
      { valor: 80, etiqueta: 'Meta', color: '#ff0000' },
      { valor: 50 },
    ]);
  });

  it('normalizeGraficoBlock: sin lineasReferencia ni lineaReferencia legada, el campo queda undefined', () => {
    const normalized = normalizeGraficoBlock({ tipo: 'grafico', chartType: 'column' });
    expect(normalized.lineasReferencia).toBeUndefined();
  });

  it('normalizeGraficoBlock: sanitiza `bandas` (rango + etiqueta + color), descartando entradas inválidas', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'column',
      bandas: [
        { desde: 0, hasta: 30, etiqueta: '  Riesgo  ', color: '#ef4444' },
        { desde: 'no_numerico', hasta: 10 }, // se descarta
        { desde: 30, hasta: 60 },
      ],
    });
    expect(normalized.bandas).toEqual([
      { desde: 0, hasta: 30, etiqueta: 'Riesgo', color: '#ef4444' },
      { desde: 30, hasta: 60 },
    ]);

    const sinBandas = normalizeGraficoBlock({ tipo: 'grafico', chartType: 'column' });
    expect(sinBandas.bandas).toBeUndefined();
  });

  it('normalizeGraficoBlock: sanitiza `estilo` (esquinas/sombra/fuente/fondo/duracionAnimacion), descartando campos inválidos', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'column',
      estilo: {
        esquinas: 12,
        sombra: true,
        fuente: '  Georgia  ',
        fondo: 'tarjeta',
        duracionAnimacion: 500,
      },
    });
    expect(normalized.estilo).toEqual({
      esquinas: 12,
      sombra: true,
      fuente: 'Georgia',
      fondo: 'tarjeta',
      duracionAnimacion: 500,
    });

    const invalido = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'column',
      estilo: { fondo: 'no_valido', esquinas: 'no_numerico' },
    });
    expect(invalido.estilo).toBeUndefined();

    const sinEstilo = normalizeGraficoBlock({ tipo: 'grafico', chartType: 'column' });
    expect(sinEstilo.estilo).toBeUndefined();
  });

  it('normalizeGraficoBlock: sanitiza `paletaPersonalizada` (arreglo de strings no vacíos)', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      chartType: 'column',
      paletaPersonalizada: ['#111111', '  ', 42, '#222222'],
    });
    expect(normalized.paletaPersonalizada).toEqual(['#111111', '#222222']);

    const sinPaleta = normalizeGraficoBlock({ tipo: 'grafico', chartType: 'column' });
    expect(sinPaleta.paletaPersonalizada).toBeUndefined();
  });
});
