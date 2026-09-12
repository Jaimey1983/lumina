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
