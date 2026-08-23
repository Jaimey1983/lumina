import type { CSSProperties } from 'react';

import type { WidgetCampoEstilo } from '@/types/widget.types';
import { resolveFontFamily } from '@/lib/font-catalog';
import { typographyFromWidget, typographyToCss } from '@/lib/typography';

export function textStyleToCss(estilo?: WidgetCampoEstilo): CSSProperties {
  if (!estilo) return {};
  return {
    fontSize: estilo.fontSize ? `${estilo.fontSize}px` : undefined,
    color: estilo.color,
    textAlign: estilo.align,
    fontFamily: estilo.fontFamily ? resolveFontFamily(estilo.fontFamily) : undefined,
    fontWeight: estilo.fontWeight,
    fontStyle: estilo.fontStyle,
    textDecoration: estilo.underline ? 'underline' : undefined,
    lineHeight: estilo.lineHeight,
    letterSpacing: estilo.letterSpacing != null ? `${estilo.letterSpacing}px` : undefined,
    ...typographyToCss(typographyFromWidget(estilo)),
  };
}
