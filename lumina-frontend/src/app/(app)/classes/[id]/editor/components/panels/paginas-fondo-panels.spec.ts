import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { DesignBackgroundPopover } from '../design-background-popover';
import { PaginasPanel } from './paginas-panel';

// Entorno node (sin DOM): render inicial en servidor. Un colapsable cerrado no
// monta su contenido (Radix Presence).

const slide = (content: Record<string, unknown>) => ({ id: 's1', content }) as unknown as ApiSlide;

function paginas(content: Record<string, unknown>) {
  return renderToStaticMarkup(
    createElement(PaginasPanel, {
      slides: [{ id: 's1', order: 0, title: 'Uno', type: 'content' }],
      activeSlideIndex: 0,
      onSelectSlide: () => {},
      apiSlide: slide(content),
      onCommitContent: () => {},
    }),
  );
}

describe('PaginasPanel (S5)', () => {
  it('«Temporizador (en vivo)» arranca cerrado: el selector no está en el DOM', () => {
    const out = paginas({});
    expect(out).toContain('Temporizador (en vivo)');
    expect(out).not.toContain('Tiempo del slide');
    expect(out).toContain('aria-expanded="false"');
  });

  it('sin tiempo configurado no hay badge; con tiempo muestra su etiqueta', () => {
    expect(paginas({})).not.toContain('rounded-full');
    expect(paginas({ timer: 0 })).toContain('Sin temporizador (este slide)');
  });

  it('la lista de slides sigue visible', () => {
    expect(paginas({})).toContain('1 slide en esta clase.');
  });
});

describe('DesignBackgroundPopover (S5)', () => {
  const out = renderToStaticMarkup(
    createElement(DesignBackgroundPopover, { onApply: () => {} }),
  );

  it('la pestaña activa (Sólido) muestra su sección «Presets» abierta', () => {
    expect(out).toContain('Presets');
    expect(out).toContain('Aplicar color');
    expect(out).toContain('aria-expanded="true"');
  });

  it('las secciones de otras pestañas no se montan', () => {
    expect(out).not.toContain('Colores del gradiente');
    expect(out).not.toContain('Ajuste al lienzo');
  });
});
