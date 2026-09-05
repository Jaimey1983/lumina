import type {
  ClickRevealConfiguracion,
  ClickRevealInnerSelection,
  ClickRevealOverlayVisibilidad,
  ClickRevealTrigger,
  ClickRevealTriggerVisibilidad,
  ClickRevealWidget,
  WidgetLayoutId,
  WidgetSlideContent,
  WidgetSlideCount,
  WidgetSlideInnerSelection,
  WidgetSlidePanelConfig,
} from '@/types/widget.types';
import {
  DEFAULT_CLICK_REVEAL_OVERLAY_VISIBILIDAD,
  DEFAULT_CLICK_REVEAL_TRIGGER_VISIBILIDAD,
} from '@/types/widget.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';
import {
  coerceWidgetLayoutId,
  resolveSlideLayoutId,
} from '@/components/widgets/shared/widget-layouts';
import {
  clampWidgetSlideCount,
  stableWidgetChildId,
  type WidgetIdentity,
} from '@/components/widgets/shared/widget-identity';

export { alineacionToCss };

export type ClickRevealAlineacion = 'izquierda' | 'centro' | 'derecha';

export const DEFAULT_TRIGGER_COLORS = [
  '#2563EB',
  '#93C5FD',
  '#FACC15',
  '#D97706',
  '#10B981',
  '#8B5CF6',
] as const;

export const DEFAULT_CLICK_REVEAL_CONFIG: ClickRevealConfiguracion = {
  numeroElementos: 4,
  overlayActivo: 0,
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  alineacionInstruccion: 'izquierda',
  mostrarBotonAnterior: true,
  mostrarBotonSiguiente: true,
  colorFondoContenedor: '#F8FAFC',
  opacidadFondoContenedor: 100,
  paddingContenedor: 16,
  espacioContenido: 12,
  layoutId: 'imagen-izq-texto-der',
  colorBordeContenido: '#93C5FD',
  efectoApertura: 'fade',
  colorBackdrop: '#1E293B',
  opacidadBackdrop: 45,
  colorFondoModal: '#FFFFFF',
  paddingModal: 20,
  radioModal: 8,
  mostrarBotonCerrar: true,
  defaultsTrigger: { ...DEFAULT_CLICK_REVEAL_TRIGGER_VISIBILIDAD },
  defaultsOverlay: { ...DEFAULT_CLICK_REVEAL_OVERLAY_VISIBILIDAD },
  colorTriggerActivo: '#2563EB',
  colorTriggerInactivo: '#CBD5E1',
};

function padElementLabel(index: number): string {
  return String(index).padStart(2, '0');
}

export function createDefaultClickRevealTrigger(
  index: number,
  partial?: Partial<ClickRevealTrigger>,
): ClickRevealTrigger {
  const color = DEFAULT_TRIGGER_COLORS[(index - 1) % DEFAULT_TRIGGER_COLORS.length];
  return {
    id: crypto.randomUUID(),
    etiqueta: padElementLabel(index),
    titulo: '',
    colorFondo: color,
    ...partial,
  };
}

export function createDefaultClickRevealOverlay(
  index: number,
  layoutId?: WidgetLayoutId,
  id?: string,
): WidgetSlideContent {
  return {
    id: id ?? crypto.randomUUID(),
    etiqueta: padElementLabel(index),
    encabezado: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    subtitulo: '',
    cuerpo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    ...(layoutId ? { layoutId } : {}),
  };
}

export function buildClickRevealElements(
  count: WidgetSlideCount,
  layoutId?: WidgetLayoutId,
  identity?: WidgetIdentity,
): { triggers: ClickRevealTrigger[]; overlays: WidgetSlideContent[] } {
  const triggers = Array.from({ length: count }, (_, i) =>
    createDefaultClickRevealTrigger(
      i + 1,
      identity ? { id: stableWidgetChildId(identity, 'trigger', i + 1) } : undefined,
    ),
  );
  const overlays = Array.from({ length: count }, (_, i) =>
    createDefaultClickRevealOverlay(
      i + 1,
      layoutId,
      identity ? stableWidgetChildId(identity, 'overlay', i + 1) : undefined,
    ),
  );
  return { triggers, overlays };
}

/** Migra bloques antiguos (base/overlay) al modelo triggers + overlays. */
function migrateLegacyClickReveal(block: ClickRevealWidget & Record<string, unknown>): ClickRevealWidget {
  const count = clampWidgetSlideCount(
    (block.configuracion as ClickRevealConfiguracion | undefined)?.numeroElementos,
    DEFAULT_CLICK_REVEAL_CONFIG.numeroElementos,
  );
  const { triggers, overlays } = buildClickRevealElements(
    count,
    coerceWidgetLayoutId(
      (block.configuracion as ClickRevealConfiguracion | undefined)?.layoutId,
    ),
    block,
  );
  const legacyBase = block.base as
    | { encabezado?: string; subtitulo?: string; cuerpo?: string; imagen?: string; imagenAlt?: string }
    | undefined;
  if (legacyBase && typeof legacyBase === 'object') {
    overlays[0] = {
      ...overlays[0],
      encabezado: legacyBase.encabezado ?? overlays[0].encabezado,
      subtitulo: legacyBase.subtitulo ?? overlays[0].subtitulo,
      cuerpo: legacyBase.cuerpo ?? overlays[0].cuerpo,
      imagen: legacyBase.imagen,
      imagenAlt: legacyBase.imagenAlt,
    };
  }
  const rest = { ...block };
  delete (rest as { base?: unknown }).base;
  delete (rest as { overlay?: unknown }).overlay;
  return { ...rest, triggers, overlays } as ClickRevealWidget;
}

export function resizeClickRevealElements(
  widget: ClickRevealWidget,
  newCount: WidgetSlideCount,
): { triggers: ClickRevealTrigger[]; overlays: WidgetSlideContent[] } {
  const currentTriggers = widget.triggers ?? [];
  const currentOverlays = widget.overlays ?? [];
  const layoutId = coerceWidgetLayoutId(widget.configuracion?.layoutId);

  if (currentTriggers.length === newCount && currentOverlays.length === newCount) {
    return { triggers: currentTriggers, overlays: currentOverlays };
  }
  if (currentTriggers.length > newCount) {
    return {
      triggers: currentTriggers.slice(0, newCount),
      overlays: currentOverlays.slice(0, newCount),
    };
  }

  const extraTriggers = Array.from({ length: newCount - currentTriggers.length }, (_, i) => {
    const index = currentTriggers.length + i + 1;
    return createDefaultClickRevealTrigger(index, {
      id: stableWidgetChildId(widget, 'trigger', index),
    });
  });
  const extraOverlays = Array.from({ length: newCount - currentOverlays.length }, (_, i) => {
    const index = currentOverlays.length + i + 1;
    return createDefaultClickRevealOverlay(
      index,
      layoutId,
      stableWidgetChildId(widget, 'overlay', index),
    );
  });

  return {
    triggers: [...currentTriggers, ...extraTriggers],
    overlays: [...currentOverlays, ...extraOverlays],
  };
}

export function normalizeClickRevealWidget(block: ClickRevealWidget): ClickRevealWidget {
  const current =
    !block.triggers?.length || !block.overlays?.length
      ? migrateLegacyClickReveal(block as ClickRevealWidget & Record<string, unknown>)
      : block;

  const raw = current.configuracion ?? ({} as ClickRevealWidget['configuracion']);
  const count = clampWidgetSlideCount(
    raw.numeroElementos,
    DEFAULT_CLICK_REVEAL_CONFIG.numeroElementos,
  );
  const resized = resizeClickRevealElements(current, count);

  return {
    ...current,
    triggers: resized.triggers,
    overlays: resized.overlays,
    configuracion: {
      ...DEFAULT_CLICK_REVEAL_CONFIG,
      ...raw,
      numeroElementos: count,
      layoutId: coerceWidgetLayoutId(raw.layoutId),
      overlayActivo: Math.min(
        raw.overlayActivo ?? 0,
        Math.max(0, count - 1),
      ),
      defaultsTrigger: {
        ...DEFAULT_CLICK_REVEAL_CONFIG.defaultsTrigger,
        ...raw.defaultsTrigger,
      },
      defaultsOverlay: {
        ...DEFAULT_CLICK_REVEAL_CONFIG.defaultsOverlay,
        ...raw.defaultsOverlay,
      },
    },
  };
}

export function mergedClickRevealConfig(block: ClickRevealWidget): ClickRevealConfiguracion {
  const w = normalizeClickRevealWidget(block);
  const raw = w.configuracion;
  return {
    ...DEFAULT_CLICK_REVEAL_CONFIG,
    ...raw,
    layoutId: coerceWidgetLayoutId(raw.layoutId),
    defaultsTrigger: {
      ...DEFAULT_CLICK_REVEAL_CONFIG.defaultsTrigger,
      ...raw.defaultsTrigger,
    },
    defaultsOverlay: {
      ...DEFAULT_CLICK_REVEAL_CONFIG.defaultsOverlay,
      ...raw.defaultsOverlay,
    },
  };
}

export function resolveClickRevealTriggerVisibilidad(
  defaults: ClickRevealTriggerVisibilidad,
  trigger: ClickRevealTrigger,
): ClickRevealTriggerVisibilidad {
  return {
    mostrarImagen: trigger.mostrarImagen ?? defaults.mostrarImagen,
    mostrarEtiqueta: trigger.mostrarEtiqueta ?? defaults.mostrarEtiqueta,
    mostrarTitulo: trigger.mostrarTitulo ?? defaults.mostrarTitulo,
  };
}

export function resolveClickRevealOverlayVisibilidad(
  defaults: ClickRevealOverlayVisibilidad,
  overlay: WidgetSlideContent,
): ClickRevealOverlayVisibilidad {
  return {
    mostrarEtiqueta: overlay.mostrarEtiqueta ?? defaults.mostrarEtiqueta,
    mostrarImagen: overlay.mostrarImagen ?? defaults.mostrarImagen,
    mostrarEncabezado: overlay.mostrarEncabezado ?? defaults.mostrarEncabezado,
    mostrarSubtitulo: overlay.mostrarSubtitulo ?? defaults.mostrarSubtitulo,
    mostrarCuerpo: overlay.mostrarCuerpo ?? defaults.mostrarCuerpo,
  };
}

export function toSlidePanelConfig(
  configuracion: ClickRevealConfiguracion,
  overlay: WidgetSlideContent,
): WidgetSlidePanelConfig {
  return {
    layoutId: resolveSlideLayoutId(overlay, configuracion.layoutId),
    colorBordeContenido: configuracion.colorBordeContenido,
    defaultsSlide: {
      mostrarImagen: true,
      mostrarTitulo: true,
      mostrarCuerpo: true,
      mostrarEncabezado: true,
      mostrarSubtitulo: true,
      mostrarTarjeta: false,
    },
  };
}

export function mapClickRevealInnerToSlide(
  inner: ClickRevealInnerSelection | null | undefined,
): WidgetSlideInnerSelection | null {
  if (!inner) return null;
  if (inner.kind === 'overlay-text') {
    return { kind: 'slide-text', slideId: inner.overlayId, field: inner.field };
  }
  if (inner.kind === 'overlay-image') {
    return { kind: 'slide-image', slideId: inner.overlayId };
  }
  return null;
}

export function clickRevealPanelOverlayId(
  inner: ClickRevealInnerSelection | null | undefined,
): string | null {
  if (!inner) return null;
  if (inner.kind === 'overlay' || inner.kind === 'overlay-text' || inner.kind === 'overlay-image') {
    return inner.overlayId;
  }
  return null;
}

export function clickRevealPanelTriggerId(
  inner: ClickRevealInnerSelection | null | undefined,
): string | null {
  if (!inner) return null;
  if (
    inner.kind === 'trigger' ||
    inner.kind === 'trigger-text' ||
    inner.kind === 'trigger-image'
  ) {
    return inner.triggerId;
  }
  return null;
}
