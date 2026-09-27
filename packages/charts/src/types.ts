// ─── Contrato público de @lumina/charts ────────────────────────────────────
// Vocabulario propio, agnóstico del motor de render. Ningún consumidor debe
// referenciar tipos de `apexcharts`/`react-apexcharts` directamente — ver el
// comentario de package.json y la decisión de motor en AGENTS.md (Etapa H).

import type { LuminaValueFormat } from './format.js';

/**
 * Tipos de gráfico soportados por el contrato (catálogo completo de 16 tipos, Etapa I2).
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
  | 'heatmap'
  | 'polarArea'
  | 'waterfall'
  | 'boxPlot'
  | 'histogram';

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
  'polarArea',
  'waterfall',
  'boxPlot',
  'histogram',
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
    types: ['column', 'bar', 'combo', 'waterfall'],
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
    types: ['donut', 'pie', 'polarArea', 'radialBar', 'treemap', 'funnel'],
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
    defaultType: 'histogram',
    types: ['column', 'bar', 'boxPlot', 'histogram'],
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
  waterfall: { type: 'waterfall', familia: 'comparar', label: 'Cascada', descripcion: 'Flujo acumulativo y variaciones (deltas)' },
  line: { type: 'line', familia: 'evolucion', label: 'Líneas', descripcion: 'Tendencias y series de tiempo' },
  area: { type: 'area', familia: 'evolucion', label: 'Área', descripcion: 'Volumen y evolución temporal' },
  donut: { type: 'donut', familia: 'proporcion', label: 'Dona', descripcion: 'Proporciones con centro hueco' },
  pie: { type: 'pie', familia: 'proporcion', label: 'Circular', descripcion: 'Distribución porcentual de un total' },
  polarArea: { type: 'polarArea', familia: 'proporcion', label: 'Área Polar', descripcion: 'Sectores con radio proporcional a los valores' },
  radialBar: { type: 'radialBar', familia: 'kpi', label: 'Radial (progreso)', descripcion: 'Medidor circular de progreso' },
  treemap: { type: 'treemap', familia: 'proporcion', label: 'Treemap', descripcion: 'Jerarquía y áreas proporcionales' },
  funnel: { type: 'funnel', familia: 'proporcion', label: 'Embudo', descripcion: 'Etapas de conversión descendentes' },
  scatter: { type: 'scatter', familia: 'relacion', label: 'Dispersión', descripcion: 'Correlación entre dos variables (X, Y)' },
  bubble: { type: 'bubble', familia: 'relacion', label: 'Burbujas', descripcion: 'Tres variables (X, Y, Tamaño Z)' },
  heatmap: { type: 'heatmap', familia: 'especiales', label: 'Mapa de calor', descripcion: 'Matriz bidimensional de intensidad' },
  radar: { type: 'radar', familia: 'especiales', label: 'Radar', descripcion: 'Perfil multidimensional' },
  boxPlot: { type: 'boxPlot', familia: 'estadistica', label: 'Diagrama de cajas', descripcion: 'Mínimo, cuartiles y máximo por grupo' },
  histogram: { type: 'histogram', familia: 'estadistica', label: 'Histograma', descripcion: 'Frecuencia de valores agrupados en intervalos' },
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

/**
 * Resumen de cinco números (mínimo, cuartiles, máximo) de un grupo del tipo
 * `boxPlot`. Ignorado en cualquier otro tipo de gráfico (Etapa I, I3).
 */
export interface LuminaChartBoxPlotPoint {
  min: number;
  q1: number;
  mediana: number;
  q3: number;
  max: number;
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
  /** Un resumen de cinco números por categoría, para type `boxPlot`. Ignorado en otros tipos. */
  cajas?: LuminaChartBoxPlotPoint[];

  // ─── Estilo por serie (Etapa I4) — solo aplican en line/area/combo ───
  /** Interpolación de curva de esta serie. Sin especificar, usa `LuminaChartConfig.curva` (o `'suave'`). */
  curvaLinea?: 'recta' | 'suave' | 'escalon';
  /** Grosor de línea en px de esta serie. Sin especificar, usa el default del tipo (2px en line/area, 2px si es línea dentro de un combo). */
  grosorLinea?: number;
  /** Mostrar marcadores (puntos) sobre esta serie. */
  mostrarPuntos?: boolean;
  /** Opacidad de relleno (0–1) de esta serie, para line/area. */
  opacidadRelleno?: number;
}

export interface LuminaChartReferenceLine {
  valor: number;
  etiqueta?: string;
  /** Color explícito de la línea. Sin especificar, usa el color mutado del tema. */
  color?: string;
}

/** Banda horizontal de referencia (rango sombreado en el eje Y), p. ej. "zona de riesgo". */
export interface LuminaChartBand {
  desde: number;
  hasta: number;
  etiqueta?: string;
  color?: string;
}

/** Estilo visual general del gráfico (Etapa I5). Todos los campos opcionales, con default el look actual. */
export interface LuminaChartStyle {
  /** Radio de esquina en px para barras/columnas y celdas de heatmap. */
  esquinas?: number;
  /** Sombra sutil bajo el gráfico (`chart.dropShadow`). */
  sombra?: boolean;
  /** Familia tipográfica CSS. Por defecto `'inherit'`. */
  fuente?: string;
  /** Fondo del gráfico: transparente (por defecto) o color de tarjeta del tema. */
  fondo?: 'transparente' | 'tarjeta';
  /** Duración de la animación de entrada en ms. Solo aplica si `animar: true`. */
  duracionAnimacion?: number;
  /** Grosor del anillo (0-100, % del radio) en gráficos `radialBar`. Ignorado en otros tipos. Por defecto 30. */
  grosorAnillo?: number;
  /** Puntas del arco redondeadas (`stroke.lineCap: 'round'`) en `radialBar`. Ignorado en otros tipos. Por defecto `false` (puntas rectas, el default de ApexCharts). */
  puntasRedondeadas?: boolean;
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
  /**
   * Líneas horizontales de referencia / meta / umbral (Etapa I5 — antes un
   * solo objeto `lineaReferencia`; ahora un arreglo, cero o más).
   */
  lineasReferencia?: LuminaChartReferenceLine[];
  /** Activar animaciones de entrada (por defecto false para determinismo). */
  animar?: boolean;
  /** Ordenamiento automático por valor de la primera serie antes de graficar. */
  ordenDatos?: 'como-esta' | 'ascendente' | 'descendente';
  /** Controlar visibilidad del menú de exportación de imagen (PNG/SVG). */
  exportarImagen?: boolean;

  // ─── Variantes y Opciones Adicionales (Etapa I2) ───
  /** Tipo de interpolación de curva para gráficos cartesianos continuos (line/area/combo). */
  curva?: 'recta' | 'suave' | 'escalon';
  /** Modo sparkline minimalista (oculta ejes, grillas y controles para tarjetas KPI). */
  modoSparkline?: boolean;
  /** Mostrar la suma total en el centro del gráfico donut. */
  mostrarTotal?: boolean;
  /** Apertura angular para gráficos circulares (pie/donut/radialBar: 'completo' = 360°, 'semicirculo' = 180°, 'personalizado' = `anguloInicio`/`anguloFin`). */
  angulo?: 'completo' | 'semicirculo' | 'personalizado';
  /** Ángulo de inicio en grados (-360 a 360). Solo aplica con `angulo: 'personalizado'`. Por defecto -90. */
  anguloInicio?: number;
  /** Ángulo de fin en grados (-360 a 360). Solo aplica con `angulo: 'personalizado'`. Por defecto 90. */
  anguloFin?: number;

  // ─── Estadística (Etapa I3) ───
  /** Número de intervalos (bins) para type `histogram`. Ignorado en otros tipos; por defecto 8. */
  histogramBins?: number;

  // ─── Ejes, formato y leyenda (Etapa I4) ───
  /** Formato numérico de eje Y / tooltip (ver `format.ts`). Por defecto `'decimal'`. */
  formatoValor?: LuminaValueFormat;
  /** Rotación en grados de las etiquetas del eje X. Sin especificar, usa el comportamiento por defecto de ApexCharts. */
  ejeXRotacion?: number;
  /** Ocultar por completo el eje X (etiquetas, borde y marcas). */
  ejeXOculto?: boolean;
  /** Ocultar por completo el eje Y (primario). */
  ejeYOculto?: boolean;
  /** Qué líneas de grilla mostrar. Por defecto `'ambas'`. */
  grillas?: 'ambas' | 'y' | 'ninguna';
  /** Posición de la leyenda. Por defecto `'abajo'` (`'derecha'` en radialBar). */
  posicionLeyenda?: 'arriba' | 'abajo' | 'izquierda' | 'derecha';

  // ─── Estilo y anotaciones (Etapa I5) ───
  /** Bandas horizontales de referencia (rangos sombreados en el eje Y), p. ej. "zona de riesgo". */
  bandas?: LuminaChartBand[];
  /** Estilo visual general (esquinas, sombra, fuente, fondo, duración de animación). */
  estilo?: LuminaChartStyle;
  /** Paleta de colores hexadecimales explícita, indexada por serie/categoría. Sin especificar, usa `paletaId`. */
  paletaPersonalizada?: string[];
}
