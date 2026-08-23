import type {
  TimelineWidget,
  TimelineConfiguracion,
  TimelineNodo,
  TimelineIconoLucide,
  WidgetHeaderTextField,
} from '@/types/widget.types';
import { clampInt, stableWidgetChildId, type WidgetIdentity } from '@/components/widgets/shared/widget-identity';

export const TIMELINE_NODO_COUNT_MIN = 2;
export const TIMELINE_NODO_COUNT_MAX = 8;

export const TIMELINE_DEFAULT_ICONS: TimelineIconoLucide[] = [
  'star',
  'users',
  'lightbulb',
  'globe',
  'message-circle',
  'calendar',
  'zap',
  'target',
];

export const DEFAULT_TIMELINE_CONFIG: TimelineConfiguracion = {
  variante: 'tarjetas',
  disposicionNodos: 'alternado',
  mostrarHaloNodo: true,
  intensidadHaloNodo: 40,
  numeroNodos: 4,
  colorLinea: '#CBD5E1',
  grosorLinea: 4,
  colorNodo: '#3B82F6',
  radioNodo: 10,
  colorCardFondo: '#FFFFFF',
  colorCardBorde: '#E2E8F0',
  radioCard: 8,
  paddingCard: 16,
  colorEtiqueta: '#64748B',
  colorCuerpo: '#334155',
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  alineacionInstruccion: 'izquierda',
  colorFondoContenedor: '#F8FAFC',
  opacidadFondoContenedor: 100,
  paddingContenedor: 16,
  espacioContenido: 24,
  mostrarConectorVertical: true,
  colorConector: '#E2E8F0',
  grosorConector: 2,
};

export type TimelineInnerSelection =
  | { kind: 'widget' }
  | { kind: 'header' }
  | { kind: 'header-text'; field: WidgetHeaderTextField }
  | { kind: 'nodo'; index: number }
  | { kind: 'texto'; nodoIndex: number; field: 'etiqueta' | 'cuerpo' | 'titulo' }
  | { kind: 'imagen'; nodoIndex: number };

export function normalizeTimelineNodo(nodo: TimelineNodo, index: number): TimelineNodo {
  return {
    ...nodo,
    tituloNodo: nodo.tituloNodo ?? `Evento ${index + 1}`,
    mostrarTituloNodo: nodo.mostrarTituloNodo ?? true,
    iconoLucide: nodo.iconoLucide ?? TIMELINE_DEFAULT_ICONS[index % TIMELINE_DEFAULT_ICONS.length],
    mostrarIconoLucide: nodo.mostrarIconoLucide ?? false,
    numeroPaso: nodo.numeroPaso ?? String(index + 1).padStart(2, '0'),
    mostrarNumeroPaso: nodo.mostrarNumeroPaso ?? false,
  };
}

export function buildTimelineNodos(
  count: number,
  identity?: WidgetIdentity,
  startIndex = 0,
): TimelineNodo[] {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    return normalizeTimelineNodo(
      {
        id: identity
          ? stableWidgetChildId(identity, 'nodo', index + 1)
          : crypto.randomUUID(),
        etiqueta: `${2019 + index}`,
        tituloNodo: `Evento ${index + 1}`,
        cuerpo: 'Descripción del paso...',
        mostrarEtiqueta: true,
        mostrarTituloNodo: true,
        mostrarCuerpo: true,
        mostrarImagen: false,
        mostrarIconoLucide: false,
        iconoLucide: TIMELINE_DEFAULT_ICONS[index % TIMELINE_DEFAULT_ICONS.length],
        numeroPaso: String(index + 1).padStart(2, '0'),
        mostrarNumeroPaso: false,
      },
      index,
    );
  });
}

export function resizeTimelineNodos(
  nodos: TimelineNodo[],
  count: number,
  identity?: WidgetIdentity,
): TimelineNodo[] {
  if (nodos.length === count) return nodos;
  if (nodos.length > count) return nodos.slice(0, count);
  const extra = buildTimelineNodos(count - nodos.length, identity, nodos.length);
  return [...nodos, ...extra];
}

export function normalizeTimelineWidget(block: TimelineWidget): TimelineWidget {
  const merged = { ...DEFAULT_TIMELINE_CONFIG, ...block.configuracion };
  const numeroNodos = clampInt(
    merged.numeroNodos,
    TIMELINE_NODO_COUNT_MIN,
    TIMELINE_NODO_COUNT_MAX,
    DEFAULT_TIMELINE_CONFIG.numeroNodos,
  );
  const config: TimelineConfiguracion = {
    ...merged,
    numeroNodos,
    variante: merged.variante ?? 'tarjetas',
    disposicionNodos: merged.disposicionNodos ?? 'alternado',
    mostrarHaloNodo: merged.mostrarHaloNodo ?? true,
    intensidadHaloNodo: merged.intensidadHaloNodo ?? 40,
  };
  const rawNodos = resizeTimelineNodos(block.nodos ?? [], config.numeroNodos, block);
  const nodos = rawNodos.map((n, i) => normalizeTimelineNodo(n, i));
  return { ...block, configuracion: config, nodos };
}

export function mergedTimelineConfig(block: TimelineWidget): TimelineConfiguracion {
  return normalizeTimelineWidget(block).configuracion;
}
