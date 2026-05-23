'use client';

import type { TabsWidget } from '@/types/widget.types';
import {
  widgetBodyPadding,
  widgetContainerBackgroundStyle,
  widgetHeaderPadding,
} from '@/components/widgets/shared/widget-container-styles';
import { WidgetHeaderViewer } from '@/components/widgets/shared/widget-header-viewer';

import { alineacionToCss, mergedTabsConfig, normalizeTabsWidget } from './tabs-config';

export { mergedTabsConfig, normalizeTabsWidget, alineacionToCss };
export { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';

export function tabsContainerStyle(block: TabsWidget): React.CSSProperties {
  const configuracion = mergedTabsConfig(block);
  return widgetContainerBackgroundStyle(
    configuracion.colorFondoContenedor,
    configuracion.opacidadFondoContenedor,
  );
}

export function tabsHeaderPadding(
  configuracion: ReturnType<typeof mergedTabsConfig>,
): React.CSSProperties {
  return widgetHeaderPadding(configuracion.paddingContenedor);
}

export function tabsBodyPadding(
  configuracion: ReturnType<typeof mergedTabsConfig>,
): React.CSSProperties {
  return widgetBodyPadding(configuracion.paddingContenedor);
}

export function TabsHeader({
  block,
  textColor = '#0f172a',
  secondaryColor = '#64748b',
}: {
  block: TabsWidget;
  textColor?: string;
  secondaryColor?: string;
}) {
  const widget = normalizeTabsWidget(block);
  const cfg = mergedTabsConfig(block);

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
