import type { TablaPeriodicaWidget } from '@lumina/types/widget';

const FILTROS_CATEGORIA = new Set([
  'todos',
  'metal',
  'no_metal',
  'metaloide',
  'gas_noble',
] as const);

const FILTROS_BLOQUE = new Set(['todos', 's', 'p', 'd', 'f'] as const);

const HEATMAP_PROPS = new Set([
  'ninguna',
  'masa_atomica',
  'grupo',
  'periodo',
] as const);

export const DEFAULT_TABLA_PERIODICA_CONFIG: TablaPeriodicaWidget['configuracion'] = {
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  alineacionInstruccion: 'izquierda',
  colorFondoContenedor: '#f8fafc',
  opacidadFondoContenedor: 100,
  paddingContenedor: 12,
  filtroCategoria: 'todos',
  filtroBloque: 'todos',
  heatmapPropiedad: 'ninguna',
  mostrarLeyendaHeatmap: true,
};

export function normalizeTablaPeriodicaWidget(
  block: TablaPeriodicaWidget,
): TablaPeriodicaWidget {
  const cfg = block.configuracion ?? DEFAULT_TABLA_PERIODICA_CONFIG;
  const op = Number(cfg.opacidadFondoContenedor);
  const pad = Number(cfg.paddingContenedor);
  return {
    ...block,
    tipo: 'tabla_periodica',
    tituloWidget:
      typeof block.tituloWidget === 'string'
        ? block.tituloWidget
        : 'Tabla periódica de los elementos',
    subtituloWidget:
      typeof block.subtituloWidget === 'string'
        ? block.subtituloWidget
        : 'Selecciona un elemento para ver su ficha.',
    instruccion:
      typeof block.instruccion === 'string'
        ? block.instruccion
        : 'Usa las flechas del teclado para moverte entre celdas.',
    seleccionado:
      typeof block.seleccionado === 'string' && block.seleccionado.length > 0
        ? block.seleccionado
        : null,
    configuracion: {
      ...DEFAULT_TABLA_PERIODICA_CONFIG,
      ...cfg,
      filtroCategoria: FILTROS_CATEGORIA.has(cfg.filtroCategoria)
        ? cfg.filtroCategoria
        : 'todos',
      filtroBloque: FILTROS_BLOQUE.has(cfg.filtroBloque) ? cfg.filtroBloque : 'todos',
      heatmapPropiedad: HEATMAP_PROPS.has(cfg.heatmapPropiedad)
        ? cfg.heatmapPropiedad
        : 'ninguna',
      mostrarLeyendaHeatmap: cfg.mostrarLeyendaHeatmap !== false,
      opacidadFondoContenedor:
        Number.isFinite(op) && op >= 0 && op <= 100 ? op : 100,
      paddingContenedor:
        Number.isFinite(pad) && pad >= 0 && pad <= 48 ? pad : 12,
    },
  };
}
