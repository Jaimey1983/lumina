'use client';

import type { CarouselWidget } from '@lumina/types/widget';
import {
  widgetBodyPadding,
  widgetContainerBackgroundStyle,
  widgetHeaderPadding,
} from '@lumina/editor-shared/widget-container-styles';
import { WidgetHeaderViewer } from '@lumina/editor-shared/widget-header-viewer';

import { alineacionToCss, mergedCarouselConfig, normalizeCarouselWidget } from './carousel-config';

export { mergedCarouselConfig, normalizeCarouselWidget, alineacionToCss };
export { textStyleToCss } from '@lumina/editor-shared/widget-text-styles';

export function carouselContainerStyle(block: CarouselWidget): React.CSSProperties {
  const configuracion = mergedCarouselConfig(block);
  return widgetContainerBackgroundStyle(
    configuracion.colorFondoContenedor,
    configuracion.opacidadFondoContenedor,
  );
}

export function carouselHeaderPadding(
  configuracion: ReturnType<typeof mergedCarouselConfig>,
): React.CSSProperties {
  return widgetHeaderPadding(configuracion.paddingContenedor);
}

export function carouselBodyPadding(
  configuracion: ReturnType<typeof mergedCarouselConfig>,
): React.CSSProperties {
  return widgetBodyPadding(configuracion.paddingContenedor);
}

export function CarouselHeader({
  block,
  textColor = '#0f172a',
  secondaryColor = '#64748b',
}: {
  block: CarouselWidget;
  textColor?: string;
  secondaryColor?: string;
}) {
  const widget = normalizeCarouselWidget(block);
  const cfg = mergedCarouselConfig(block);

  return (
    <WidgetHeaderViewer
      tituloWidget={widget.tituloWidget}
      subtituloWidget={widget.subtituloWidget}
      instruccion={widget.instruccion}
      estilosHeader={widget.estilosHeader}
      config={cfg}
      textColor={textColor}
      secondaryColor={secondaryColor}
    />
  );
}
