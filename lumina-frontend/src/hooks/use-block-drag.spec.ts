import { describe, expect, it } from 'vitest';

import type { Activity, Block } from '@/types/slide.types';

import {
  applyLiveDragPositions,
  applyNudgeToBlocks,
  clampAxisOrigin,
  CANVAS_OVERFLOW_ORIGIN_MIN,
  getBlockPos,
  MIN_VISIBLE_PCT,
  snapPositionToGuides,
  snapThresholdPct,
  withPosition,
} from './use-block-drag';

function texto(x: number, y: number, overrides?: Partial<Block>): Block {
  return {
    tipo: 'texto',
    contenido: 'Bloque',
    x,
    y,
    ancho: 20,
    alto: 10,
    ...overrides,
  };
}

function actividad(x: number, y: number): Block {
  return {
    tipo: 'actividad',
    actividad: {
      tipo: 'quiz_multiple',
      pregunta: '¿?',
      opciones: [],
    } satisfies Activity,
    marco: {
      izquierdaPct: x,
      arribaPct: y,
      anchoPct: 40,
      altoPct: 30,
    },
  };
}

describe('applyLiveDragPositions', () => {
  it('actualiza solo el índice arrastrado cuando no hay grupo', () => {
    const bloques = [texto(10, 20), texto(50, 20)];
    const next = applyLiveDragPositions({
      bloques,
      draggedIndex: 0,
      snapX: 18,
      snapY: 24,
      origin: { x: 10, y: 20 },
      groupOrigins: null,
    });

    expect(getBlockPos(next[0])).toMatchObject({ x: 18, y: 24 });
    expect(next[1]).toBe(bloques[1]);
  });

  it('desplaza todos los orígenes del grupo con el delta del líder y clamp interno', () => {
    const bloques = [texto(10, 10), texto(40, 10), texto(80, 80)];
    const next = applyLiveDragPositions({
      bloques,
      draggedIndex: 0,
      snapX: 25,
      snapY: 15,
      origin: { x: 10, y: 10 },
      groupOrigins: {
        '0': { x: 10, y: 10 },
        '1': { x: 40, y: 10 },
      },
    });

    expect(getBlockPos(next[0])).toMatchObject({ x: 25, y: 15 });
    expect(getBlockPos(next[1])).toMatchObject({ x: 55, y: 15 });
    expect(next[2]).toBe(bloques[2]);
  });

  it('en grupo no deja que un miembro se salga del lienzo', () => {
    const bloques = [texto(70, 10, { ancho: 40 }), texto(10, 10)];
    const next = applyLiveDragPositions({
      bloques,
      draggedIndex: 1,
      snapX: 50,
      snapY: 10,
      origin: { x: 10, y: 10 },
      groupOrigins: {
        '0': { x: 70, y: 10 },
        '1': { x: 10, y: 10 },
      },
    });

    expect(getBlockPos(next[0])).toMatchObject({ x: 60, y: 10 });
    expect(getBlockPos(next[1])).toMatchObject({ x: 50, y: 10 });
  });

  it('escribe marco de una actividad en drag simple', () => {
    const bloques = [actividad(5, 8), texto(60, 10)];
    const next = applyLiveDragPositions({
      bloques,
      draggedIndex: 0,
      snapX: 12,
      snapY: 16,
      origin: { x: 5, y: 8 },
      groupOrigins: null,
    });

    expect(next[0].tipo).toBe('actividad');
    if (next[0].tipo === 'actividad') {
      expect(next[0].marco).toMatchObject({
        izquierdaPct: 12,
        arribaPct: 16,
        anchoPct: 40,
        altoPct: 30,
      });
    }
    expect(next[1]).toBe(bloques[1]);
  });
});

describe('snapPositionToGuides', () => {
  it('imanta a una guía vertical del usuario', () => {
    const near = 25 + snapThresholdPct('x') * 0.5;
    const { x, y, lines } = snapPositionToGuides(
      near,
      10,
      10,
      10,
      0,
      [texto(80, 80)],
      { guias: { verticales: [320], horizontales: [] } },
    );
    expect(x).toBeCloseTo(25);
    expect(y).toBe(10);
    expect(lines).toEqual([
      { orientation: 'vertical', position: 25, kind: 'align' },
    ]);
  });

  it('el mismo 1% imanta en Y y no en X (umbral en px, no en %)', () => {
    const miss = 50 + 1;
    const { x, lines: linesX } = snapPositionToGuides(
      miss,
      10,
      10,
      10,
      0,
      [texto(80, 80)],
      { guias: { verticales: [640], horizontales: [] } },
    );
    expect(x).toBe(miss);
    expect(linesX).toEqual([]);

    const { y, lines: linesY } = snapPositionToGuides(
      10,
      miss,
      10,
      10,
      0,
      [texto(80, 80)],
      { guias: { verticales: [], horizontales: [360] } },
    );
    expect(y).toBeCloseTo(50);
    expect(linesY).toEqual([
      { orientation: 'horizontal', position: 50, kind: 'align' },
    ]);
  });

  it('si un par está más cerca que la guía, gana el par', () => {
    const { x, lines } = snapPositionToGuides(
      10.4,
      20,
      10,
      10,
      1,
      [texto(10, 50)],
      { guias: { verticales: [640], horizontales: [] } },
    );
    expect(x).toBeCloseTo(10);
    expect(lines.some((l) => l.orientation === 'vertical' && l.position === 10)).toBe(true);
  });

  it('en empate de distancia, la guía manual gana al par', () => {
    const { x, lines } = snapPositionToGuides(
      40,
      20,
      10,
      10,
      1,
      [texto(40, 70)],
      { guias: { verticales: [512], horizontales: [] } },
    );
    expect(x).toBeCloseTo(40);
    expect(lines).toContainEqual({
      orientation: 'vertical',
      position: 40,
      kind: 'align',
    });
  });

  it('imanta a un hueco igual entre dos vecinos', () => {
    const left = texto(5, 20, { ancho: 10, alto: 20 });
    const right = texto(30, 20, { ancho: 10, alto: 20 });
    const dragged = texto(16, 22, { ancho: 8, alto: 16 });
    const leftPx = (5 / 100) * 1280 + (10 / 100) * 1280;
    const rightPx = (30 / 100) * 1280;
    const draggedW = (8 / 100) * 1280;
    const gap = (rightPx - leftPx - draggedW) / 2;
    const expected = ((leftPx + gap) / 1280) * 100;
    const { x, lines } = snapPositionToGuides(
      expected + snapThresholdPct('x') * 0.4,
      22,
      8,
      16,
      2,
      [left, right, dragged],
    );
    expect(x).toBeCloseTo(expected, 5);
    expect(lines.some((l) => l.kind === 'gap' && l.orientation === 'vertical')).toBe(
      true,
    );
  });

  it('con enabled false no imanta ni pinta líneas', () => {
    const { x, y, lines } = snapPositionToGuides(
      26,
      10,
      10,
      10,
      0,
      [texto(80, 80)],
      { guias: { verticales: [320], horizontales: [] }, enabled: false },
    );
    expect(x).toBe(26);
    expect(y).toBe(10);
    expect(lines).toEqual([]);
  });

  it('con enabled false un pin 4 % no queda en -50', () => {
    const { x, y } = snapPositionToGuides(-40, -40, 4, 4, 0, [texto(80, 80)], {
      enabled: false,
    });
    expect(x).toBe(0);
    expect(y).toBe(0);
  });
});

describe('clampAxisOrigin', () => {
  it('un Hotspot 4 % no puede salir de 0–100 (C2)', () => {
    expect(clampAxisOrigin(-50, 4)).toBe(0);
    expect(clampAxisOrigin(150, 4)).toBe(96);
    expect(clampAxisOrigin(48, 4)).toBe(48);
  });

  it('Popup ~3.75 % tampoco desaparece', () => {
    expect(clampAxisOrigin(-50, 3.75)).toBe(0);
    expect(clampAxisOrigin(150, 3.75)).toBeCloseTo(96.25);
  });

  it('Progreso (alto 5 %) deja al menos 4 % visible; en X 80 % puede ir a -50', () => {
    expect(clampAxisOrigin(-50, 5)).toBeCloseTo(-1);
    expect(clampAxisOrigin(-50, 80)).toBe(CANVAS_OVERFLOW_ORIGIN_MIN);
    expect(80 + CANVAS_OVERFLOW_ORIGIN_MIN).toBeGreaterThanOrEqual(MIN_VISIBLE_PCT);
  });

  it('Flip Cards 90 % a la izquierda sigue pudiendo ir a -50 (40 % visible)', () => {
    expect(clampAxisOrigin(-80, 90)).toBe(CANVAS_OVERFLOW_ORIGIN_MIN);
    expect(clampAxisOrigin(150, 90)).toBe(100 - MIN_VISIBLE_PCT);
  });
});

describe('applyNudgeToBlocks', () => {
  it('mueve 1 px virtual en X solo el índice pedido', () => {
    const bloques = [texto(10, 20), texto(40, 20)];
    const next = applyNudgeToBlocks(bloques, [0], 1, 0);
    expect(getBlockPos(next[0]).x).toBeCloseTo(10 + 100 / 1280, 5);
    expect(next[1]).toBe(bloques[1]);
  });

  it('Shift 10 px mueve en Y', () => {
    const bloques = [texto(10, 20)];
    const next = applyNudgeToBlocks(bloques, [0], 0, -10);
    expect(getBlockPos(next[0]).y).toBeCloseTo(20 - 1000 / 720, 5);
  });

  it('un pin 4×4 no se puede nudgear fuera del lienzo', () => {
    const pin = texto(0, 0, { ancho: 4, alto: 4 });
    const next = applyNudgeToBlocks([pin], [0], -200, -200);
    expect(getBlockPos(next[0]).x).toBe(0);
    expect(getBlockPos(next[0]).y).toBe(0);
  });
});

describe('withPosition', () => {
  it('crea marco por defecto si la actividad no tenía', () => {
    const block: Block = {
      tipo: 'actividad',
      actividad: {
        tipo: 'quiz_multiple',
        pregunta: '¿?',
        opciones: [],
      },
    };
    const next = withPosition(block, 7, 9);
    expect(next.tipo).toBe('actividad');
    if (next.tipo === 'actividad') {
      expect(next.marco).toMatchObject({
        izquierdaPct: 7,
        arribaPct: 9,
        anchoPct: 90,
        altoPct: 90,
      });
    }
  });
});
