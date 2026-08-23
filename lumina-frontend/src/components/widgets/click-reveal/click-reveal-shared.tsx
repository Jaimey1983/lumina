'use client';

import type { ClickRevealWidget } from '@/types/widget.types';
import {
  widgetBodyPadding,
  widgetContainerBackgroundStyle,
  widgetHeaderPadding,
} from '@/components/widgets/shared/widget-container-styles';
import { WidgetHeaderViewer } from '@/components/widgets/shared/widget-header-viewer';

import { alineacionToCss, mergedClickRevealConfig, normalizeClickRevealWidget } from './click-reveal-config';

export { mergedClickRevealConfig, normalizeClickRevealWidget, alineacionToCss };
export { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';

export function clickRevealContainerStyle(block: ClickRevealWidget): React.CSSProperties {
  const configuracion = mergedClickRevealConfig(block);
  return widgetContainerBackgroundStyle(
    configuracion.colorFondoContenedor,
    configuracion.opacidadFondoContenedor,
  );
}

export function clickRevealHeaderPadding(
  configuracion: ReturnType<typeof mergedClickRevealConfig>,
): React.CSSProperties {
  return widgetHeaderPadding(configuracion.paddingContenedor);
}

export function clickRevealBodyPadding(
  configuracion: ReturnType<typeof mergedClickRevealConfig>,
): React.CSSProperties {
  return widgetBodyPadding(configuracion.paddingContenedor);
}

export function ClickRevealHeader({
  block,
  textColor = '#0f172a',
  secondaryColor = '#64748b',
}: {
  block: ClickRevealWidget;
  textColor?: string;
  secondaryColor?: string;
}) {
  const widget = normalizeClickRevealWidget(block);
  const cfg = mergedClickRevealConfig(block);

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
