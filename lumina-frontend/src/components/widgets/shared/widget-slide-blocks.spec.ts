import { describe, expect, it } from 'vitest';

import type { Block } from '@/types/slide.types';
import type { TabsWidget } from '@/types/widget.types';
import { DEFAULT_WIDGET_SLIDE_VISIBILIDAD } from '@/types/widget.types';

import { resolveWidgetSlideInsertTarget } from './widget-slide-blocks';

function tabsWithFichaActiva(fichaActiva: number): TabsWidget {
  return {
    tipo: 'tabs',
    tituloWidget: '',
    subtituloWidget: '',
    instruccion: '',
    configuracion: {
      numeroFichas: 3,
      fichaActiva,
      layoutId: 'solo-texto',
      colorFondoContenedor: '#fff',
      opacidadFondoContenedor: 1,
      paddingContenedor: 8,
      espacioContenido: 8,
      mostrarTituloWidget: false,
      mostrarSubtitulo: false,
      mostrarInstruccion: false,
      defaultsSlide: DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
    },
    fichas: [
      { id: 'ficha-0', etiqueta: 'FICHA 01', encabezado: 'Uno', cuerpo: '' },
      { id: 'ficha-1', etiqueta: 'FICHA 02', encabezado: 'Dos', cuerpo: '' },
      { id: 'ficha-2', etiqueta: 'FICHA 03', encabezado: 'Tres', cuerpo: '' },
    ],
  };
}

describe('resolveWidgetSlideInsertTarget', () => {
  it('sin inner selection inserta en la ficha 0, no en fichaActiva persistida', () => {
    const widget = tabsWithFichaActiva(2);
    const target = resolveWidgetSlideInsertTarget('0', [widget as Block], null, null);

    expect(target?.kind).toBe('tabs');
    expect(target?.slideId).toBe('ficha-0');
  });

  it('con inner selection usa esa ficha aunque fichaActiva sea otra', () => {
    const widget = tabsWithFichaActiva(0);
    const target = resolveWidgetSlideInsertTarget(
      '0',
      [widget as Block],
      { kind: 'slide', slideId: 'ficha-2' },
      null,
    );

    expect(target?.slideId).toBe('ficha-2');
  });
});
