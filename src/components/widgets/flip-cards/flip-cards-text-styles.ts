import type { FlipCardsCampoEstilo } from '@/types/slide.types';

export const FLIP_CARDS_FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Playfair Display", Georgia, serif', label: 'Playfair' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: '"Courier New", monospace', label: 'Courier' },
] as const;

export function textStyleToCss(estilo?: FlipCardsCampoEstilo): React.CSSProperties {
  if (!estilo) return {};
  return {
    fontSize: estilo.fontSize ? `${estilo.fontSize}px` : undefined,
    color: estilo.color,
    textAlign: estilo.align,
    fontFamily: estilo.fontFamily,
    fontWeight: estilo.fontWeight,
    fontStyle: estilo.fontStyle,
    lineHeight: estilo.lineHeight,
    letterSpacing: estilo.letterSpacing != null ? `${estilo.letterSpacing}px` : undefined,
  };
}
