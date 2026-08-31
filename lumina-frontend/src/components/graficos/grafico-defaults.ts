// ─── Normalizador y Fábrica por Defecto para Bloque Gráfico ───────────────────
// Un solo writer canónico para el bloque `grafico` (Recharts v1).

import { BLOCK_FALLBACKS, type BlockMarco, type GraficoChartType, type GraficoDatosBlock, type GraficoSerie } from '@/types/slide.types';
import { DEFAULT_GRAFICO_PALETA_ID } from './grafico-color-palettes';

export const VALID_GRAFICO_CHART_TYPES: readonly GraficoChartType[] = [
  'column',
  'bar',
  'line',
  'area',
  'pie',
  'donut',
  'radialBar',
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

    cleaned.push({
      nombre,
      valores,
      ...(color ? { color } : {}),
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

  const base: Partial<GraficoDatosBlock> = {
    id: `grafico-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'grafico',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    chartType: 'column',
    categorias: [...DEFAULT_GRAFICO_CATEGORIAS],
    series: [
      {
        nombre: 'Grupo A',
        valores: [65, 59, 80, 81, 56],
      },
      {
        nombre: 'Grupo B',
        valores: [28, 48, 40, 19, 86],
      },
    ],
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
