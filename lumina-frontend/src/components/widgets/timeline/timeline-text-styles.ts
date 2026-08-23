import type { CSSProperties } from 'react';

import type { TimelineConfiguracion, TimelineNodo } from '@/types/widget.types';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';

import { timelineNodeAccentColor } from './timeline-variant-meta';

/** Estilo de etiqueta / año del nodo (fallback: color global de etiqueta). */
export function timelineEtiquetaTextStyle(
  nodo: TimelineNodo,
  config: TimelineConfiguracion,
): CSSProperties {
  return {
    color: config.colorEtiqueta,
    ...textStyleToCss(nodo.estiloEtiqueta),
  };
}

/** Estilo del título del evento (fallback: acento del nodo). */
export function timelineTituloTextStyle(
  nodo: TimelineNodo,
  index: number,
  config: TimelineConfiguracion,
): CSSProperties {
  const accent = timelineNodeAccentColor(nodo, index, config.colorNodo);
  return {
    color: accent,
    ...textStyleToCss(nodo.estiloTituloNodo),
  };
}

/** Estilo del cuerpo / descripción (fallback: color global de cuerpo). */
export function timelineCuerpoTextStyle(
  nodo: TimelineNodo,
  config: TimelineConfiguracion,
): CSSProperties {
  return {
    color: config.colorCuerpo,
    ...textStyleToCss(nodo.estiloCuerpo),
  };
}
