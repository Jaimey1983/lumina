import { describe, expect, it } from 'vitest';

import type { Block, Slide } from '@/types/slide.types';

import { resolveCanvasBlockOverlayLabel } from './editor-dnd-overlay';

function slideWith(bloques: Block[]): Slide {
  return {
    id: 's1',
    order: 0,
    type: 'CONTENT',
    title: 'T',
    bloques,
  } as Slide;
}

describe('resolveCanvasBlockOverlayLabel', () => {
  it('devuelve etiqueta del tipo para un drag de bloque de lienzo', () => {
    const slide = slideWith([
      { tipo: 'texto', contenido: 'Hola', x: 10, y: 10, ancho: 20, alto: 10 },
    ]);
    expect(resolveCanvasBlockOverlayLabel(slide, 'block-0')).toBe('Texto');
  });

  it('no inventa overlay si no hay drag o el id no es de bloque', () => {
    const slide = slideWith([
      { tipo: 'imagen', url: '', x: 10, y: 10, ancho: 20, alto: 20 },
    ]);
    expect(resolveCanvasBlockOverlayLabel(slide, null)).toBeNull();
    expect(resolveCanvasBlockOverlayLabel(slide, 'activity-panel-quiz_multiple')).toBeNull();
  });
});
