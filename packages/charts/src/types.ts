// ─── Contrato público de @lumina/charts ────────────────────────────────────
// Vocabulario propio, agnóstico del motor de render. Ningún consumidor debe
// referenciar tipos de `apexcharts`/`react-apexcharts` directamente — ver el
// comentario de package.json y la decisión de motor en AGENTS.md (Etapa H).

/**
 * Tipos de gráfico soportados por el contrato. H1 solo declara paridad con
 * los 7 tipos que ya existía en `GraficoDatosBlock` (swap de motor, sin
 * ampliar catálogo todavía — eso es H6).
 */
export type LuminaChartType =
  | 'column'
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'radialBar';

export const LUMINA_CHART_TYPES: readonly LuminaChartType[] = [
  'column',
  'bar',
  'line',
  'area',
  'pie',
  'donut',
  'radialBar',
] as const;

export interface LuminaChartSeries {
  nombre: string;
  valores: number[];
  /** Color explícito para esta serie; si no está, se resuelve por índice contra la paleta. */
  color?: string;
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
}
