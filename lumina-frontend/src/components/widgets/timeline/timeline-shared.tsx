import type { CSSProperties } from 'react';
import type { TimelineConfiguracion } from '@/types/widget.types';
import {
  widgetBodyPadding,
  widgetHeaderPadding,
} from '@/components/widgets/shared/widget-container-styles';

export function TimelineCSSVars(config: TimelineConfiguracion): CSSProperties {
  return {
    '--tl-color-linea': config.colorLinea,
    '--tl-grosor-linea': `${config.grosorLinea}px`,
    '--tl-color-nodo': config.colorNodo,
    '--tl-radio-nodo': `${config.radioNodo}px`,
    '--tl-color-card-fondo': config.colorCardFondo,
    '--tl-color-card-borde': config.colorCardBorde,
    '--tl-radio-card': `${config.radioCard}px`,
    '--tl-padding-card': `${config.paddingCard}px`,
    '--tl-color-etiqueta': config.colorEtiqueta,
    '--tl-color-cuerpo': config.colorCuerpo,
    '--tl-color-conector': config.colorConector ?? config.colorLinea,
    '--tl-grosor-conector': `${config.grosorConector ?? config.grosorLinea}px`,
    '--tl-halo-opacity': `${(config.intensidadHaloNodo ?? 40) / 100}`,
    /* Separación tarjeta ↔ línea */
    '--tl-card-line-gap': `${Math.max(20, Math.min(52, Math.round((config.espacioContenido ?? 24) * 0.95)))}px`,
    '--tl-card-pad-to-line': `${Math.max(12, Math.min(28, Math.round((config.espacioContenido ?? 24) * 0.45)))}px`,
    '--tl-connector-min': '8px',
    '--tl-connector-max': `${Math.max(24, Math.min(56, Math.round((config.espacioContenido ?? 24) * 1)))}px`,
  } as CSSProperties;
}

export function timelineHeaderPadding(config: TimelineConfiguracion): CSSProperties {
  return widgetHeaderPadding(config.paddingContenedor ?? 16);
}

export function timelineBodyPadding(config: TimelineConfiguracion): CSSProperties {
  return widgetBodyPadding(config.paddingContenedor ?? 16);
}

export function TimelineContainerStyle(config: TimelineConfiguracion): CSSProperties {
  // Si hubiera un colorFondoContenedor en el futuro, se inyectaría aquí usando
  // widgetContainerBackgroundStyle. Por ahora devolvemos el mapping de variables CSS.
  return TimelineCSSVars(config);
}

export function getTimelineCardStyle(config: TimelineConfiguracion): CSSProperties {
  return {
    backgroundColor: config.colorCardFondo,
    borderColor: config.colorCardBorde,
    borderRadius: config.radioCard,
    padding: config.paddingCard,
  };
}
