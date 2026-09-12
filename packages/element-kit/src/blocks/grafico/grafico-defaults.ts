// ─── Normalizador y Fábrica por Defecto para Bloque Gráfico ───────────────────
// Un solo writer canónico para el bloque `grafico` (Recharts v1).

import { BLOCK_FALLBACKS, type BlockMarco, type GraficoChartType, type GraficoDatosBlock, type GraficoSerie } from '@lumina/types/slide';
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

    cleaned.push({
      nombre,
      valores,
      ...(color ? { color } : {}),
      ...(tipoCombo ? { tipoCombo } : {}),
      ...(ejeCombo ? { ejeCombo } : {}),
      ...(puntos ? { puntos } : {}),
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

/**
 * Sanitiza e hidrata cualquier entrada para garantizar un `GraficoDatosBlock` válido.
 * Garantiza `modo: 'contenido'`, `soloLecturaEnViewer: true` y estructura consistente.
 */
export function normalizeGraficoBlock(input: unknown): GraficoDatosBlock {
  const fb = BLOCK_FALLBACKS.grafico;
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<GraficoDatosBlock>;

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

  const lineaReferencia =
    raw.lineaReferencia &&
    typeof raw.lineaReferencia === 'object' &&
    typeof raw.lineaReferencia.valor === 'number' &&
    Number.isFinite(raw.lineaReferencia.valor)
      ? {
          valor: raw.lineaReferencia.valor,
          etiqueta:
            typeof raw.lineaReferencia.etiqueta === 'string' && raw.lineaReferencia.etiqueta.trim().length > 0
              ? raw.lineaReferencia.etiqueta.trim()
              : undefined,
        }
      : undefined;

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
    lineaReferencia,
    animar: typeof raw.animar === 'boolean' ? raw.animar : undefined,
    ordenDatos,
    exportarImagen: typeof raw.exportarImagen === 'boolean' ? raw.exportarImagen : undefined,
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

  const defaultSeries: GraficoSerie[] = isScatterOrBubble
    ? [
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
      ]
    : [
        {
          nombre: 'Grupo A',
          valores: [65, 59, 80, 81, 56],
        },
        {
          nombre: 'Grupo B',
          valores: [28, 48, 40, 19, 86],
        },
      ];

  const base: Partial<GraficoDatosBlock> = {
    id: `grafico-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'grafico',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    chartType: 'column',
    categorias: [...DEFAULT_GRAFICO_CATEGORIAS],
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
