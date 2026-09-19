// ─── Normalizador y Fábrica por Defecto para Bloque Gráfico ───────────────────
// Un solo writer canónico para el bloque `grafico` (Recharts v1).

import {
  BLOCK_FALLBACKS,
  type BlockMarco,
  type GraficoBanda,
  type GraficoChartType,
  type GraficoDatosBlock,
  type GraficoEstilo,
  type GraficoLineaReferencia,
  type GraficoSerie,
} from '@lumina/types/slide';
import { DEFAULT_LUMINA_PALETTE_ID as DEFAULT_GRAFICO_PALETA_ID } from '@lumina/charts';

export const VALID_GRAFICO_CHART_TYPES: readonly GraficoChartType[] = [
  'column',
  'bar',
  'line',
  'area',
  'pie',
  'donut',
  'radialBar',
  'combo',
  'scatter',
  'bubble',
  'radar',
  'treemap',
  'funnel',
  'heatmap',
  'polarArea',
  'waterfall',
  'boxPlot',
  'histogram',
] as const;

export const DEFAULT_GRAFICO_CATEGORIAS: string[] = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
];

export const DEFAULT_GRAFICO_SERIES: GraficoSerie[] = [
  {
    nombre: 'Grupo A',
    valores: [65, 59, 80, 81, 56],
  },
  {
    nombre: 'Grupo B',
    valores: [28, 48, 40, 19, 86],
  },
];

function sanitizeChartType(type: unknown): GraficoChartType {
  if (typeof type === 'string' && (VALID_GRAFICO_CHART_TYPES as readonly string[]).includes(type)) {
    return type as GraficoChartType;
  }
  return 'column';
}

function sanitizeCategorias(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [...DEFAULT_GRAFICO_CATEGORIAS];
  }
  const cleaned = raw
    .map((item, index) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'number') return String(item);
      return `Cat ${index + 1}`;
    })
    .filter((cat) => cat.length > 0);

  return cleaned.length > 0 ? cleaned : ['Categoría 1'];
}

function sanitizeSeries(raw: unknown, expectedLength: number): GraficoSerie[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      {
        nombre: 'Serie 1',
        valores: Array.from({ length: expectedLength }, () => 0),
      },
    ];
  }

  const cleaned: GraficoSerie[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const nombre =
      typeof (item as { nombre?: unknown }).nombre === 'string' &&
      (item as { nombre: string }).nombre.trim().length > 0
        ? (item as { nombre: string }).nombre.trim()
        : `Serie ${i + 1}`;

    const rawValores = Array.isArray((item as { valores?: unknown }).valores)
      ? (item as { valores: unknown[] }).valores
      : [];

    const valores: number[] = [];
    for (let j = 0; j < expectedLength; j++) {
      const v = Number(rawValores[j]);
      valores.push(Number.isFinite(v) ? v : 0);
    }

    const color =
      typeof (item as { color?: unknown }).color === 'string' &&
      (item as { color: string }).color.trim().length > 0
        ? (item as { color: string }).color.trim()
        : undefined;

    const rawTipoCombo = (item as { tipoCombo?: unknown }).tipoCombo;
    const tipoCombo =
      rawTipoCombo === 'column' || rawTipoCombo === 'line' || rawTipoCombo === 'area'
        ? rawTipoCombo
        : undefined;

    const rawEjeCombo = (item as { ejeCombo?: unknown }).ejeCombo;
    const ejeCombo =
      rawEjeCombo === 'primario' || rawEjeCombo === 'secundario'
        ? rawEjeCombo
        : undefined;

    const rawPuntos = (item as { puntos?: unknown }).puntos;
    const puntos = Array.isArray(rawPuntos)
      ? rawPuntos
          .filter((p) => p && typeof p === 'object')
          .map((p) => {
            const px = Number((p as { x?: unknown }).x);
            const py = Number((p as { y?: unknown }).y);
            const rawZ = (p as { z?: unknown }).z;
            const pz = rawZ !== undefined ? Number(rawZ) : undefined;
            return {
              x: Number.isFinite(px) ? px : 0,
              y: Number.isFinite(py) ? py : 0,
              ...(pz !== undefined && Number.isFinite(pz) ? { z: pz } : {}),
            };
          })
      : undefined;

    // `cajas` (chartType `boxPlot`, Etapa I3): un resumen de cinco números por
    // categoría. Se acota a `expectedLength` (igual que `valores`) para que la
    // grilla categoría↔caja siempre esté alineada.
    const rawCajas = Array.isArray((item as { cajas?: unknown }).cajas)
      ? (item as { cajas: unknown[] }).cajas
      : undefined;
    const cajas = rawCajas
      ? Array.from({ length: expectedLength }, (_, j) => {
          const c = rawCajas[j];
          const co = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
          const num = (key: string) => {
            const v = Number(co[key]);
            return Number.isFinite(v) ? v : 0;
          };
          return { min: num('min'), q1: num('q1'), mediana: num('mediana'), q3: num('q3'), max: num('max') };
        })
      : undefined;

    // Estilo por serie (Etapa I4) — solo aplican en line/area/combo, pero se
    // sanitizan igual para cualquier tipo (el adapter/build-options decide si
    // los usa).
    const rawCurvaLinea = (item as { curvaLinea?: unknown }).curvaLinea;
    const curvaLinea =
      rawCurvaLinea === 'recta' || rawCurvaLinea === 'suave' || rawCurvaLinea === 'escalon'
        ? rawCurvaLinea
        : undefined;

    const rawGrosorLinea = (item as { grosorLinea?: unknown }).grosorLinea;
    const grosorLinea =
      typeof rawGrosorLinea === 'number' && Number.isFinite(rawGrosorLinea) ? rawGrosorLinea : undefined;

    const mostrarPuntos =
      typeof (item as { mostrarPuntos?: unknown }).mostrarPuntos === 'boolean'
        ? (item as { mostrarPuntos: boolean }).mostrarPuntos
        : undefined;

    const rawOpacidadRelleno = (item as { opacidadRelleno?: unknown }).opacidadRelleno;
    const opacidadRelleno =
      typeof rawOpacidadRelleno === 'number' && Number.isFinite(rawOpacidadRelleno)
        ? Math.min(1, Math.max(0, rawOpacidadRelleno))
        : undefined;

    cleaned.push({
      nombre,
      valores,
      ...(color ? { color } : {}),
      ...(tipoCombo ? { tipoCombo } : {}),
      ...(ejeCombo ? { ejeCombo } : {}),
      ...(puntos ? { puntos } : {}),
      ...(cajas ? { cajas } : {}),
      ...(curvaLinea ? { curvaLinea } : {}),
      ...(grosorLinea !== undefined ? { grosorLinea } : {}),
      ...(mostrarPuntos !== undefined ? { mostrarPuntos } : {}),
      ...(opacidadRelleno !== undefined ? { opacidadRelleno } : {}),
    });
  }

  return cleaned.length > 0
    ? cleaned
    : [
        {
          nombre: 'Serie 1',
          valores: Array.from({ length: expectedLength }, () => 0),
        },
      ];
}

function sanitizeLineaReferenciaItem(item: unknown): GraficoLineaReferencia | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const valor = (item as { valor?: unknown }).valor;
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return undefined;

  const etiquetaRaw = (item as { etiqueta?: unknown }).etiqueta;
  const colorRaw = (item as { color?: unknown }).color;

  return {
    valor,
    etiqueta: typeof etiquetaRaw === 'string' && etiquetaRaw.trim().length > 0 ? etiquetaRaw.trim() : undefined,
    color: typeof colorRaw === 'string' && colorRaw.trim().length > 0 ? colorRaw.trim() : undefined,
  };
}

/**
 * `lineasReferencia` (Etapa I5) reemplaza al `lineaReferencia` singular de
 * H6. Acepta el formato nuevo (arreglo) y migra el formato legado (un solo
 * objeto) para que un bloque guardado antes de I5 siga abriendo igual.
 */
function sanitizeLineasReferencia(raw: Record<string, unknown>): GraficoLineaReferencia[] | undefined {
  if (Array.isArray(raw.lineasReferencia)) {
    const cleaned = raw.lineasReferencia
      .map(sanitizeLineaReferenciaItem)
      .filter((l): l is GraficoLineaReferencia => l !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  const legacy = sanitizeLineaReferenciaItem(raw.lineaReferencia);
  return legacy ? [legacy] : undefined;
}

function sanitizeBandaItem(item: unknown): GraficoBanda | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const desde = (item as { desde?: unknown }).desde;
  const hasta = (item as { hasta?: unknown }).hasta;
  if (typeof desde !== 'number' || !Number.isFinite(desde)) return undefined;
  if (typeof hasta !== 'number' || !Number.isFinite(hasta)) return undefined;

  const etiquetaRaw = (item as { etiqueta?: unknown }).etiqueta;
  const colorRaw = (item as { color?: unknown }).color;

  return {
    desde,
    hasta,
    etiqueta: typeof etiquetaRaw === 'string' && etiquetaRaw.trim().length > 0 ? etiquetaRaw.trim() : undefined,
    color: typeof colorRaw === 'string' && colorRaw.trim().length > 0 ? colorRaw.trim() : undefined,
  };
}

function sanitizeBandas(raw: unknown): GraficoBanda[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw.map(sanitizeBandaItem).filter((b): b is GraficoBanda => b !== undefined);
  return cleaned.length > 0 ? cleaned : undefined;
}

function sanitizeEstilo(raw: unknown): GraficoEstilo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;

  const esquinas = typeof r.esquinas === 'number' && Number.isFinite(r.esquinas) ? r.esquinas : undefined;
  const sombra = typeof r.sombra === 'boolean' ? r.sombra : undefined;
  const fuente = typeof r.fuente === 'string' && r.fuente.trim().length > 0 ? r.fuente.trim() : undefined;
  const fondo = r.fondo === 'transparente' || r.fondo === 'tarjeta' ? r.fondo : undefined;
  const duracionAnimacion =
    typeof r.duracionAnimacion === 'number' && Number.isFinite(r.duracionAnimacion) ? r.duracionAnimacion : undefined;
  const grosorAnillo =
    typeof r.grosorAnillo === 'number' && Number.isFinite(r.grosorAnillo)
      ? Math.min(Math.max(r.grosorAnillo, 0), 100)
      : undefined;
  const puntasRedondeadas = typeof r.puntasRedondeadas === 'boolean' ? r.puntasRedondeadas : undefined;

  const result: GraficoEstilo = {
    ...(esquinas !== undefined ? { esquinas } : {}),
    ...(sombra !== undefined ? { sombra } : {}),
    ...(fuente ? { fuente } : {}),
    ...(fondo ? { fondo } : {}),
    ...(duracionAnimacion !== undefined ? { duracionAnimacion } : {}),
    ...(grosorAnillo !== undefined ? { grosorAnillo } : {}),
    ...(puntasRedondeadas !== undefined ? { puntasRedondeadas } : {}),
  };

  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizePaletaPersonalizada(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .map((c) => c.trim());
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Sanitiza e hidrata cualquier entrada para garantizar un `GraficoDatosBlock` válido.
 * Garantiza `modo: 'contenido'`, `soloLecturaEnViewer: true` y estructura consistente.
 */
export function normalizeGraficoBlock(input: unknown): GraficoDatosBlock {
  const fb = BLOCK_FALLBACKS.grafico;
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<GraficoDatosBlock>;
  // Acceso sin tipar para leer campos legados (`lineaReferencia` singular,
  // Etapa I5) que ya no forman parte de `GraficoDatosBlock`.
  const rawAny = raw as unknown as Record<string, unknown>;

  const id = typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id : `grafico-${Date.now()}`;
  const chartType = sanitizeChartType(raw.chartType);
  const categorias = sanitizeCategorias(raw.categorias);
  const series = sanitizeSeries(raw.series, categorias.length);

  const apilado =
    raw.apilado === 'normal' || raw.apilado === 'porcentaje' || raw.apilado === 'ninguno'
      ? raw.apilado
      : undefined;

  const ordenDatos =
    raw.ordenDatos === 'como-esta' || raw.ordenDatos === 'ascendente' || raw.ordenDatos === 'descendente'
      ? raw.ordenDatos
      : undefined;

  const lineasReferencia = sanitizeLineasReferencia(rawAny);

  return {
    id,
    tipo: 'grafico',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    chartType,
    categorias,
    series,
    colorPaleta:
      typeof raw.colorPaleta === 'string' && raw.colorPaleta.trim().length > 0
        ? raw.colorPaleta.trim()
        : DEFAULT_GRAFICO_PALETA_ID,
    titulo: typeof raw.titulo === 'string' ? raw.titulo : 'Gráfico de datos',
    descripcionAccesible:
      typeof raw.descripcionAccesible === 'string' ? raw.descripcionAccesible : undefined,
    mostrarLeyenda: raw.mostrarLeyenda !== false,
    x: typeof raw.x === 'number' && Number.isFinite(raw.x) ? raw.x : fb.x,
    y: typeof raw.y === 'number' && Number.isFinite(raw.y) ? raw.y : fb.y,
    ancho: typeof raw.ancho === 'number' && Number.isFinite(raw.ancho) ? raw.ancho : fb.ancho,
    alto: typeof raw.alto === 'number' && Number.isFinite(raw.alto) ? raw.alto : fb.alto,
    zIndex: typeof raw.zIndex === 'number' && Number.isFinite(raw.zIndex) ? raw.zIndex : undefined,

    // Configuración fina (H6)
    apilado,
    ejeXTitulo: typeof raw.ejeXTitulo === 'string' && raw.ejeXTitulo.trim().length > 0 ? raw.ejeXTitulo.trim() : undefined,
    ejeYTitulo: typeof raw.ejeYTitulo === 'string' && raw.ejeYTitulo.trim().length > 0 ? raw.ejeYTitulo.trim() : undefined,
    ejeYMin: typeof raw.ejeYMin === 'number' && Number.isFinite(raw.ejeYMin) ? raw.ejeYMin : undefined,
    ejeYMax: typeof raw.ejeYMax === 'number' && Number.isFinite(raw.ejeYMax) ? raw.ejeYMax : undefined,
    ejeYEscalaLog: typeof raw.ejeYEscalaLog === 'boolean' ? raw.ejeYEscalaLog : undefined,
    mostrarEtiquetasDatos: typeof raw.mostrarEtiquetasDatos === 'boolean' ? raw.mostrarEtiquetasDatos : undefined,
    lineasReferencia,
    animar: typeof raw.animar === 'boolean' ? raw.animar : undefined,
    ordenDatos,
    exportarImagen: typeof raw.exportarImagen === 'boolean' ? raw.exportarImagen : undefined,

    // Variantes y Opciones Adicionales (Etapa I2)
    curva:
      raw.curva === 'recta' || raw.curva === 'suave' || raw.curva === 'escalon'
        ? raw.curva
        : undefined,
    modoSparkline: typeof raw.modoSparkline === 'boolean' ? raw.modoSparkline : undefined,
    mostrarTotal: typeof raw.mostrarTotal === 'boolean' ? raw.mostrarTotal : undefined,
    angulo:
      raw.angulo === 'completo' || raw.angulo === 'semicirculo' || raw.angulo === 'personalizado'
        ? raw.angulo
        : undefined,
    anguloInicio: typeof raw.anguloInicio === 'number' && Number.isFinite(raw.anguloInicio) ? raw.anguloInicio : undefined,
    anguloFin: typeof raw.anguloFin === 'number' && Number.isFinite(raw.anguloFin) ? raw.anguloFin : undefined,

    // Estadística (Etapa I3)
    histogramBins:
      typeof raw.histogramBins === 'number' && Number.isFinite(raw.histogramBins)
        ? Math.round(raw.histogramBins)
        : undefined,

    // Ejes, formato y leyenda (Etapa I4)
    formatoValor:
      raw.formatoValor === 'entero' ||
      raw.formatoValor === 'decimal' ||
      raw.formatoValor === 'porcentaje' ||
      raw.formatoValor === 'moneda' ||
      raw.formatoValor === 'escala0a5'
        ? raw.formatoValor
        : undefined,
    ejeXRotacion:
      typeof raw.ejeXRotacion === 'number' && Number.isFinite(raw.ejeXRotacion) ? raw.ejeXRotacion : undefined,
    ejeXOculto: typeof raw.ejeXOculto === 'boolean' ? raw.ejeXOculto : undefined,
    ejeYOculto: typeof raw.ejeYOculto === 'boolean' ? raw.ejeYOculto : undefined,
    grillas:
      raw.grillas === 'ambas' || raw.grillas === 'y' || raw.grillas === 'ninguna' ? raw.grillas : undefined,
    posicionLeyenda:
      raw.posicionLeyenda === 'arriba' ||
      raw.posicionLeyenda === 'abajo' ||
      raw.posicionLeyenda === 'izquierda' ||
      raw.posicionLeyenda === 'derecha'
        ? raw.posicionLeyenda
        : undefined,

    // Estilo y anotaciones (Etapa I5)
    bandas: sanitizeBandas(rawAny.bandas),
    estilo: sanitizeEstilo(rawAny.estilo),
    paletaPersonalizada: sanitizePaletaPersonalizada(rawAny.paletaPersonalizada),
  };
}

/**
 * Crea un nuevo bloque `GraficoDatosBlock` con valores predeterminados.
 */
export function createDefaultGraficoBlock(
  partial?: Partial<GraficoDatosBlock>,
  marco?: BlockMarco,
): GraficoDatosBlock {
  const fb = BLOCK_FALLBACKS.grafico;
  const isScatterOrBubble = partial?.chartType === 'scatter' || partial?.chartType === 'bubble';
  const isWaterfall = partial?.chartType === 'waterfall';
  const isPolarArea = partial?.chartType === 'polarArea';
  const isBoxPlot = partial?.chartType === 'boxPlot';
  const isHistogram = partial?.chartType === 'histogram';
  const isRadialBar = partial?.chartType === 'radialBar';

  let defaultCategorias = [...DEFAULT_GRAFICO_CATEGORIAS];
  let defaultSeries: GraficoSerie[] = [
    {
      nombre: 'Grupo A',
      valores: [65, 59, 80, 81, 56],
    },
    {
      nombre: 'Grupo B',
      valores: [28, 48, 40, 19, 86],
    },
  ];

  if (isScatterOrBubble) {
    defaultSeries = [
      {
        nombre: 'Serie 1',
        valores: [20, 45, 30, 70],
        puntos: [
          { x: 10, y: 20, ...(partial?.chartType === 'bubble' ? { z: 15 } : {}) },
          { x: 20, y: 45, ...(partial?.chartType === 'bubble' ? { z: 25 } : {}) },
          { x: 30, y: 30, ...(partial?.chartType === 'bubble' ? { z: 10 } : {}) },
          { x: 40, y: 70, ...(partial?.chartType === 'bubble' ? { z: 35 } : {}) },
        ],
      },
    ];
  } else if (isWaterfall) {
    defaultCategorias = ['Inicio', 'Ventas', 'Costos', 'Nuevos', 'Ajuste'];
    defaultSeries = [
      {
        nombre: 'Flujo',
        valores: [100, 35, -20, 40, -15],
      },
    ];
  } else if (isPolarArea) {
    defaultCategorias = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
    defaultSeries = [
      {
        nombre: 'Regiones',
        valores: [45, 75, 60, 30, 85],
      },
    ];
  } else if (isBoxPlot) {
    defaultCategorias = ['Grupo A', 'Grupo B', 'Grupo C'];
    defaultSeries = [
      {
        nombre: 'Distribución',
        valores: [],
        cajas: [
          { min: 60, q1: 70, mediana: 75, q3: 82, max: 95 },
          { min: 50, q1: 65, mediana: 72, q3: 80, max: 90 },
          { min: 55, q1: 68, mediana: 74, q3: 79, max: 88 },
        ],
      },
    ];
  } else if (isHistogram) {
    // `histogram` bina los valores de la primera serie — cada "categoría" es
    // solo la etiqueta de fila de un dato crudo en el editor de datos, no una
    // categoría del eje X (que en el chart final son los bordes de los bins).
    const sampleValues = [55, 60, 62, 65, 68, 70, 72, 74, 75, 76, 78, 80, 82, 85, 88, 90, 92, 95];
    defaultCategorias = sampleValues.map((_, i) => `Dato ${i + 1}`);
    defaultSeries = [
      {
        nombre: 'Puntajes',
        valores: sampleValues,
      },
    ];
  } else if (isRadialBar) {
    // Un solo anillo por defecto — un medidor de progreso claro, no la
    // plantilla genérica de 5 categorías/2 series (que producía un
    // `radialBar` de 5 anillos confuso al insertar desde "Progreso / KPI").
    // Se pueden agregar más anillos añadiendo categorías desde el editor de
    // datos — cada categoría es un anillo, tomado de la primera serie.
    defaultCategorias = ['Progreso'];
    defaultSeries = [
      {
        nombre: 'Progreso',
        valores: [72],
      },
    ];
  }

  const base: Partial<GraficoDatosBlock> = {
    id: `grafico-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'grafico',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    chartType: 'column',
    categorias: defaultCategorias,
    series: defaultSeries,
    colorPaleta: DEFAULT_GRAFICO_PALETA_ID,
    titulo: 'Gráfico de datos',
    descripcionAccesible: 'Gráfico de datos comparativos por categorías',
    mostrarLeyenda: true,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeGraficoBlock(base);
}
