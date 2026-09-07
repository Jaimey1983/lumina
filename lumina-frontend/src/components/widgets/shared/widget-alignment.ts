import type { WidgetAlineacion } from '@lumina/types/widget';

export function alineacionToCss(alineacion: WidgetAlineacion): 'left' | 'center' | 'right' {
  switch (alineacion) {
    case 'centro':
      return 'center';
    case 'derecha':
      return 'right';
    default:
      return 'left';
  }
}
