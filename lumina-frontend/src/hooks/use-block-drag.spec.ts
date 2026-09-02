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
  offsetBlockPosition,
  prepareBlockForPaste,
  PASTE_OFFSET_PCT,
  withClampedPosition,
  withClampedPositionChecked,
  blockPosToStyle,
  withPosition,
  withRect,
  withRotation,
} from './use-block-drag';

function texto(x: number, y: number, overrides?: Partial<Block>): Block {
  // `Partial<Block>` es una unión: al hacer spread ensancha `contenido`/`ancho`
  // (p. ej. a `ClipContent`) y rompe la discriminación por `tipo`. El cast fija
  // el fixture como TextBlock — no hay cambio en runtime.
  return {
    tipo: 'texto',
    contenido: 'Bloque',
    x,
    y,
    ancho: 20,
    alto: 10,
    ...overrides,
  } as Block;
}

function actividad(x: number, y: number): Block {
  return {
    tipo: 'actividad',
    actividad: {
      tipo: 'quiz_multiple',
      preguntas: [{ id: 'q-1', texto: '¿?', opciones: [] }],
      deliveryMode: 'AUTONOMOUS',
      layoutVariant: 'classic-list',
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

  it('en grupo aplica clampAxisOrigin (contrato 3.2) en miembros', () => {
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

    expect(getBlockPos(next[0]).x).toBeGreaterThan(60);
    expect(getBlockPos(next[1])).toMatchObject({ x: 50, y: 10 });
  });

  it('no acumula delta si el array ya tiene la posición live (prev ≠ origen)', () => {
    const origin = texto(10, 20);
    const alreadyLive = texto(18, 24);
    const next = applyLiveDragPositions({
      bloques: [alreadyLive, texto(50, 20)],
      draggedIndex: 0,
      snapX: 30,
      snapY: 40,
      origin: { x: 10, y: 20 },
      groupOrigins: null,
    });

    expect(getBlockPos(next[0])).toMatchObject({ x: 30, y: 40 });
    expect(getBlockPos(origin)).toMatchObject({ x: 10, y: 20 });
  });

  it('en grupo tampoco acumula si prev ya se desplazó', () => {
    const next = applyLiveDragPositions({
      bloques: [texto(25, 15), texto(55, 15), texto(80, 80)],
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

  it('imanta a la grilla cuando está activa y no hay target más cercano', () => {
    const gridSize = 40;
    const stepPct = (gridSize / 1280) * 100;
    const near = stepPct * 3 + stepPct * 0.15;
    const { x, lines } = snapPositionToGuides(
      near,
      10,
      10,
      10,
      0,
      [texto(80, 80)],
      {
        guias: {
          horizontales: [],
          verticales: [],
          grilla: { activa: true, tamanoPx: gridSize },
        },
      },
    );
    expect(x).toBeCloseTo(stepPct * 3);
    expect(lines).toContainEqual({
      orientation: 'vertical',
      position: stepPct * 3,
      kind: 'grid',
    });
  });

  it('la guía manual gana a la grilla en X si está más cerca', () => {
    const gridSize = 40;
    const guidePct = 25;
    const { x, lines } = snapPositionToGuides(
      guidePct + 0.2,
      10,
      10,
      10,
      0,
      [texto(80, 80)],
      {
        guias: {
          horizontales: [],
          verticales: [320],
          grilla: { activa: true, tamanoPx: gridSize },
        },
      },
    );
    expect(x).toBeCloseTo(guidePct);
    expect(
      lines.some((l) => l.orientation === 'vertical' && l.kind === 'grid'),
    ).toBe(false);
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
        preguntas: [{ id: 'q-1', texto: '¿?', opciones: [] }],
        deliveryMode: 'AUTONOMOUS',
        layoutVariant: 'classic-list',
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

describe('withRect', () => {
  it('escribe marco completo de una actividad, no x/y/ancho/alto (C3)', () => {
    const next = withRect(actividad(5, 5), 8, 10, 70, 60);
    expect(next.tipo).toBe('actividad');
    if (next.tipo === 'actividad') {
      expect(next.marco).toEqual({
        izquierdaPct: 8,
        arribaPct: 10,
        anchoPct: 70,
        altoPct: 60,
      });
    }
    expect(next).not.toHaveProperty('x');
    expect(next).not.toHaveProperty('ancho');
  });

  it('crea marco por defecto al redimensionar una actividad sin marco', () => {
    const block: Block = {
      tipo: 'actividad',
      actividad: {
        tipo: 'quiz_multiple',
        preguntas: [{ id: 'q-1', texto: '¿?', opciones: [] }],
        deliveryMode: 'AUTONOMOUS',
        layoutVariant: 'classic-list',
      },
    };
    const next = withRect(block, 12, 14, 50, 40);
    expect(next.tipo).toBe('actividad');
    if (next.tipo === 'actividad') {
      expect(next.marco).toEqual({
        izquierdaPct: 12,
        arribaPct: 14,
        anchoPct: 50,
        altoPct: 40,
      });
    }
  });

  it('escribe x/y/ancho/alto de un widget', () => {
    const next = withRect(texto(10, 20), 1, 2, 30, 15);
    expect(next).toMatchObject({ x: 1, y: 2, ancho: 30, alto: 15 });
  });
});

describe('offsetBlockPosition / prepareBlockForPaste', () => {
  it('desplaza widgets con offset por defecto', () => {
    const next = offsetBlockPosition(texto(10, 20));
    expect(getBlockPos(next)).toMatchObject({ x: 10 + PASTE_OFFSET_PCT, y: 20 + PASTE_OFFSET_PCT });
  });

  it('desplaza actividades vía marco, no x/y', () => {
    const next = offsetBlockPosition(actividad(5, 5));
    expect(next.tipo).toBe('actividad');
    if (next.tipo === 'actividad') {
      expect(next.marco).toMatchObject({
        izquierdaPct: 5 + PASTE_OFFSET_PCT,
        arribaPct: 5 + PASTE_OFFSET_PCT,
      });
    }
    expect(next).not.toHaveProperty('x');
  });

  it('prepareBlockForPaste asigna id y respeta clamp', () => {
    const next = prepareBlockForPaste(texto(97, 97), { newId: 'paste-1' });
    expect((next as Block & { id?: string }).id).toBe('paste-1');
    const pos = getBlockPos(next);
    expect(pos.x).toBeLessThanOrEqual(100 - MIN_VISIBLE_PCT);
    expect(pos.y).toBeLessThanOrEqual(100 - MIN_VISIBLE_PCT);
  });
});

describe('canvasLocked', () => {
  it('applyNudgeToBlocks ignora bloques fijados', () => {
    const locked = { ...texto(10, 10), canvasLocked: true as const };
    const free = texto(20, 20);
    const next = applyNudgeToBlocks([locked, free], [0, 1], 10, 10);
    expect(getBlockPos(next[0])).toMatchObject({ x: 10, y: 10 });
    expect(getBlockPos(next[1]).x).toBeGreaterThan(20);
  });

  it('handleDragStart no aplica — bloque fijado no entra en applyLiveDragPositions', () => {
    const bloques = [{ ...texto(5, 5), canvasLocked: true as const }, texto(30, 30)];
    const next = applyLiveDragPositions({
      bloques,
      draggedIndex: 0,
      snapX: 20,
      snapY: 20,
      origin: { x: 5, y: 5 },
      groupOrigins: null,
    });
    expect(getBlockPos(next[0])).toMatchObject({ x: 5, y: 5 });
  });
});

describe('withClampedPositionChecked', () => {
  it('indica wasClamped cuando el destino queda fuera del lienzo', () => {
    const block = texto(90, 10, { ancho: 20, alto: 10 });
    const { block: next, wasClamped } = withClampedPositionChecked(block, 97, 10);
    expect(wasClamped).toBe(true);
    expect(getBlockPos(next).x).toBeLessThan(97);
  });

  it('wasClamped es false cuando la posición cabe', () => {
    const block = texto(10, 10);
    const { wasClamped } = withClampedPositionChecked(block, 15, 12);
    expect(wasClamped).toBe(false);
  });
});

describe('diagrama y grafico — contratos 3.2', () => {
  it('withPosition y withRect actualizan bbox de diagrama', () => {
    const block = {
      id: 'diag-1',
      tipo: 'diagrama',
      subtipo: 'venn',
      modo: 'contenido',
      soloLecturaEnViewer: true,
      conjuntos: 2,
      regiones: [],
      elementos: [],
      x: 10,
      y: 10,
      ancho: 80,
      alto: 75,
    } as Block;

    const moved = withPosition(block, 20, 18);
    expect(getBlockPos(moved)).toMatchObject({ x: 20, y: 18, ancho: 80, alto: 75 });

    const resized = withRect(block, 12, 14, 50, 40);
    expect(getBlockPos(resized)).toMatchObject({ x: 12, y: 14, ancho: 50, alto: 40 });
  });
});

describe('blockPosToStyle', () => {
  it('deriva estilos CSS desde getBlockPos', () => {
    const block = actividad(8, 12);
    const style = blockPosToStyle(block, 3);
    expect(style).toMatchObject({
      position: 'absolute',
      left: '8%',
      top: '12%',
      width: '40%',
      height: '30%',
      zIndex: 3,
    });
  });

  it('incluye transform y transformOrigin cuando el bloque tiene rotacion', () => {
    const block = texto(10, 20, { rotacion: 45 });
    const style = blockPosToStyle(block);
    expect(style.transform).toBe('rotate(45deg)');
    expect(style.transformOrigin).toBe('center center');
  });

  it('no define transform si rotacion es 0 o indefinida', () => {
    const block = texto(10, 20);
    const style = blockPosToStyle(block);
    expect(style.transform).toBeUndefined();
  });
});

describe('withRotation', () => {
  it('aplica rotacion normalizada a un bloque de texto', () => {
    const block = texto(10, 20);
    const rotated = withRotation(block, 90);
    expect(rotated.rotacion).toBe(90);
  });

  it('aplica rotacion normalizada en grados [0, 360) a un bloque de actividad', () => {
    const block = actividad(10, 20);
    const rotated = withRotation(block, -45);
    expect(rotated.rotacion).toBe(315);
    if (rotated.tipo === 'actividad') {
      expect(rotated.marco?.rotacion).toBe(315);
    }
  });

  it('normaliza vueltas mayores a 360', () => {
    const block = texto(10, 20);
    const rotated = withRotation(block, 450);
    expect(rotated.rotacion).toBe(90);
  });
});

