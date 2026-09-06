import { describe, expect, it } from 'vitest';

import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';

import {
  buildSlideContentPayload,
  parseContentVersion,
  parseSlideVersionConflict,
} from './build-slide-content-payload';
import { createInitialEditorSlideState } from './editor-slide-state';

function slideConTexto() {
  return {
    id: 's1',
    order: 0,
    type: 'CONTENT' as const,
    title: 'T',
    bloques: [
      { tipo: 'texto' as const, contenido: 'hola', x: 10, y: 8, ancho: 20, alto: 10 },
    ],
    fondo: { tipo: 'color' as const, valor: '#ffffff' },
    guias: EMPTY_SLIDE_GUIAS,
    diseno: { columnas: 1 as const, brecha: 12, relleno: 24 },
    transicion: { tipo: 'fade' as const, duracion: 300 },
  };
}

describe('buildSlideContentPayload', () => {
  it('serializa solo campos persistibles del reducer (sin selección ni UI)', () => {
    const slide = slideConTexto();
    const state = createInitialEditorSlideState(slide);
    state.selectedBlockId = '0';
    state.layersPanelOpen = true;

    const payload = buildSlideContentPayload(state, { diseno: slide.diseno });

    expect(payload).toEqual({
      bloques: slide.bloques,
      fondo: slide.fondo,
      guias: EMPTY_SLIDE_GUIAS,
      diseno: slide.diseno,
      transicion: slide.transicion,
    });
    expect(payload).not.toHaveProperty('selectedBlockId');
    expect(payload).not.toHaveProperty('layersPanelOpen');
  });

  it('omite fondo/diseño/transición si no hay valor', () => {
    const state = createInitialEditorSlideState(null);
    expect(buildSlideContentPayload(state)).toEqual({
      bloques: [],
      guias: EMPTY_SLIDE_GUIAS,
    });
  });
});

describe('parseContentVersion / parseSlideVersionConflict', () => {
  it('lee contentVersion entero del slide devuelto por PATCH', () => {
    expect(parseContentVersion({ id: 's1', contentVersion: 4 })).toBe(4);
    expect(parseContentVersion({ contentVersion: 1.5 })).toBeUndefined();
    expect(parseContentVersion(null)).toBeUndefined();
  });

  it('acepta el body Nest de ConflictException (message anidado o plano)', () => {
    expect(
      parseSlideVersionConflict({
        statusCode: 409,
        message: {
          message: 'Conflicto de versión',
          currentVersion: 7,
          expectedVersion: 3,
        },
      }),
    ).toEqual({ currentVersion: 7 });

    expect(
      parseSlideVersionConflict({
        currentVersion: 2,
        expectedVersion: 1,
      }),
    ).toEqual({ currentVersion: 2 });

    expect(parseSlideVersionConflict({ statusCode: 409 })).toBeNull();
  });
});
