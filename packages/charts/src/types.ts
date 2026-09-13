// ─── Contrato público de @lumina/charts ────────────────────────────────────
// Vocabulario propio, agnóstico del motor de render. Ningún consumidor debe
// referenciar tipos de `apexcharts`/`react-apexcharts` directamente — ver el
// comentario de package.json y la decisión de motor en AGENTS.md (Etapa H).

/**
 * Tipos de gráfico soportados por el contrato (catálogo completo de 14 tipos, H6).
 */
export type LuminaChartType =
  | 'column'
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'combo'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'treemap'
  | 'funnel'
  | 'heatmap';

export const LUMINA_CHART_TYPES: readonly LuminaChartType[] = [
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

/**
 * Familias pedagógicas y conceptuales de gráficos (Etapa I).
 */
export type LuminaChartFamily =
  | 'comparar'
  | 'evolucion'
  | 'proporcion'
  | 'relacion'
  | 'estadistica'
  | 'kpi'
  | 'especiales';

export interface LuminaChartFamilyMeta {
  id: LuminaChartFamily;
  label: string;
  descripcion: string;
  defaultType: LuminaChartType;
  types: readonly LuminaChartType[];
}

export interface LuminaChartTypeMeta {
  type: LuminaChartType;
  familia: LuminaChartFamily;
  label: string;
  descripcion: string;
}

export const LUMINA_CHART_FAMILIES: readonly LuminaChartFamilyMeta[] = [
  {
    id: 'comparar',
    label: 'Comparación',
    descripcion: 'Comparar magnitudes entre categorías o grupos',
    defaultType: 'column',
    types: ['column', 'bar', 'combo'],
  },
  {
    id: 'evolucion',
    label: 'Evolución',
    descripcion: 'Visualizar cambios y series temporales continuas',
    defaultType: 'line',
    types: ['line', 'area'],
  },
  {
    id: 'proporcion',
    label: 'Proporción',
    descripcion: 'Representar partes de un todo y composiciones',
    defaultType: 'donut',
    types: ['donut', 'pie', 'radialBar', 'treemap', 'funnel'],
  },
  {
    id: 'relacion',
    label: 'Relación',
    descripcion: 'Correlación y distribución entre dos o tres variables',
    defaultType: 'scatter',
    types: ['scatter', 'bubble'],
  },
  {
    id: 'estadistica',
    label: 'Estadística',
    descripcion: 'Distribución de frecuencias y rangos de datos',
    defaultType: 'column',
    types: ['column', 'bar'],
  },
  {
    id: 'kpi',
    label: 'Progreso / KPI',
    descripcion: 'Indicadores de avance hacia metas y métricas clave',
    defaultType: 'radialBar',
    types: ['radialBar'],
  },
  {
    id: 'especiales',
    label: 'Especiales',
    descripcion: 'Matrices bidimensionales de calor y perfiles radar',
    defaultType: 'heatmap',
    types: ['heatmap', 'radar'],
  },
] as const;

export const LUMINA_CHART_TYPE_META: Record<LuminaChartType, LuminaChartTypeMeta> = {
  column: { type: 'column', familia: 'comparar', label: 'Columnas', descripcion: 'Barras verticales por categoría' },
  bar: { type: 'bar', familia: 'comparar', label: 'Barras', descripcion: 'Barras horizontales' },
  combo: { type: 'combo', familia: 'comparar', label: 'Combinado', descripcion: 'Columnas y líneas combinadas' },
  line: { type: 'line', familia: 'evolucion', label: 'Líneas', descripcion: 'Tendencias y series de tiempo' },
  area: { type: 'area', familia: 'evolucion', label: 'Área', descripcion: 'Volumen y evolución temporal' },
  donut: { type: 'donut', familia: 'proporcion', label: 'Dona', descripcion: 'Proporciones con centro hueco' },
  pie: { type: 'pie', familia: 'proporcion', label: 'Circular', descripcion: 'Distribución porcentual de un total' },
  radialBar: { type: 'radialBar', familia: 'kpi', label: 'Radial (progreso)', descripcion: 'Medidor circular de progreso' },
  treemap: { type: 'treemap', familia: 'proporcion', label: 'Treemap', descripcion: 'Jerarquía y áreas proporcionales' },
  funnel: { type: 'funnel', familia: 'proporcion', label: 'Embudo', descripcion: 'Etapas de conversión descendentes' },
  scatter: { type: 'scatter', familia: 'relacion', label: 'Dispersión', descripcion: 'Correlación entre dos variables (X, Y)' },
  bubble: { type: 'bubble', familia: 'relacion', label: 'Burbujas', descripcion: 'Tres variables (X, Y, Tamaño Z)' },
  heatmap: { type: 'heatmap', familia: 'especiales', label: 'Mapa de calor', descripcion: 'Matriz bidimensional de intensidad' },
  radar: { type: 'radar', familia: 'especiales', label: 'Radar', descripcion: 'Perfil multidimensional' },
};

export function getChartFamily(type: LuminaChartType): LuminaChartFamily {
  return LUMINA_CHART_TYPE_META[type]?.familia ?? 'comparar';
}

export function getChartTypesByFamily(family: LuminaChartFamily): LuminaChartType[] {
  const fam = LUMINA_CHART_FAMILIES.find((f) => f.id === family);
  return fam ? [...fam.types] : [];
}

export interface LuminaChartPoint {
  x: number;
  y: number;
  z?: number;
}

export interface LuminaChartSeries {
  nombre: string;
  valores: number[];
  /** Color explícito para esta serie; si no está, se resuelve por índice contra la paleta. */
  color?: string;
  /** Tipo de render para esta serie en un gráfico combo. Ignorado si type !== 'combo'. */
  tipoCombo?: 'column' | 'line' | 'area';
  /** Asignación de eje Y en un gráfico combo con eje dual. Ignorado si type !== 'combo'. */
  ejeCombo?: 'primario' | 'secundario';
  /** Puntos (x, y, z) para tipos scatter/bubble. Ignorado en otros tipos. */
  puntos?: LuminaChartPoint[];
}

export interface LuminaChartReferenceLine {
  valor: number;
  etiqueta?: string;
}

/**
 * Configuración de un gráfico, independiente de quién lo consuma
 * (autoría manual en el editor de canvas, o datos de API en analíticas).
 */
export interface LuminaChartConfig {
  type: LuminaChartType;
  categorias: string[];
  series: LuminaChartSeries[];
  /** Id de paleta (ver `palettes.ts`). Por defecto `DEFAULT_LUMINA_PALETTE_ID`. */
  paletaId?: string;
  mostrarLeyenda?: boolean;
  titulo?: string;
  /** Texto para lectores de pantalla (se anuncia vía `aria-live`, no reemplaza la tabla de datos). */
  descripcionAccesible?: string;
  /** Render reducido para miniaturas (panel de slides, tarjetas de listado): sin tooltip/leyenda/ejes densos. */
  isThumbnail?: boolean;

  // ─── Configuración fina (H6) ───
  /** Modo de apilado para column/bar/area/combo. */
  apilado?: 'ninguno' | 'normal' | 'porcentaje';
  /** Título visible del eje horizontal (X). */
  ejeXTitulo?: string;
  /** Título visible del eje vertical (Y). */
  ejeYTitulo?: string;
  /** Límite mínimo manual para el eje Y. */
  ejeYMin?: number;
  /** Límite máximo manual para el eje Y. */
  ejeYMax?: number;
  /** Activar escala logarítmica en el eje Y. */
  ejeYEscalaLog?: boolean;
  /** Mostrar valores numéricos encima de barras/puntos. */
  mostrarEtiquetasDatos?: boolean;
  /** Línea horizontal de referencia / meta / umbral. */
  lineaReferencia?: LuminaChartReferenceLine;
  /** Activar animaciones de entrada (por defecto false para determinismo). */
  animar?: boolean;
  /** Ordenamiento automático por valor de la primera serie antes de graficar. */
  ordenDatos?: 'como-esta' | 'ascendente' | 'descendente';
  /** Controlar visibilidad del menú de exportación de imagen (PNG/SVG). */
  exportarImagen?: boolean;
}
