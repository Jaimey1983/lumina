import { describe, expect, it } from 'vitest';

import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { CANVAS_OVERFLOW_ORIGIN_MIN } from '@/hooks/use-block-drag';
import { WIDGET_TIPOS } from '@/types/widget.types';

import {
  clientPointToActivityMarco,
  clientPointToWidgetMarco,
  getWidgetDropSizePct,
} from './activity-canvas-position';

const CANVAS = {
  left: 0,
  top: 0,
  width: 1280,
  height: 720,
  right: 1280,
  bottom: 720,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

function dropWidget(
  type: Parameters<typeof getWidgetDropSizePct>[0],
  clientX: number,
  clientY: number,
) {
  return clientPointToWidgetMarco(CANVAS, clientX, clientY, getWidgetDropSizePct(type));
}

describe('getWidgetDropSizePct', () => {
  it('usa el mismo tamaño que BLOCK_FALLBACKS (click sin arrastrar)', () => {
    expect(getWidgetDropSizePct('hotspot')).toEqual({
      anchoPct: BLOCK_FALLBACKS.hotspot.ancho,
      altoPct: BLOCK_FALLBACKS.hotspot.alto,
    });
    expect(getWidgetDropSizePct('tooltip')).toEqual({
      anchoPct: BLOCK_FALLBACKS.tooltip.ancho,
      altoPct: BLOCK_FALLBACKS.tooltip.alto,
    });
    expect(getWidgetDropSizePct('boton')).toEqual({
      anchoPct: BLOCK_FALLBACKS.boton.ancho,
      altoPct: BLOCK_FALLBACKS.boton.alto,
    });
    expect(getWidgetDropSizePct('popup')).toEqual({
      anchoPct: BLOCK_FALLBACKS.popup.ancho,
      altoPct: BLOCK_FALLBACKS.popup.alto,
    });
    expect(getWidgetDropSizePct('contador')).toEqual({
      anchoPct: BLOCK_FALLBACKS.contador.ancho,
      altoPct: BLOCK_FALLBACKS.contador.alto,
    });
    expect(getWidgetDropSizePct('progreso')).toEqual({
      anchoPct: BLOCK_FALLBACKS.progreso.ancho,
      altoPct: BLOCK_FALLBACKS.progreso.alto,
    });
    expect(getWidgetDropSizePct('flip-cards')).toEqual({
      anchoPct: BLOCK_FALLBACKS.flipCards.ancho,
      altoPct: BLOCK_FALLBACKS.flipCards.alto,
    });
  });

  it('cubre los 12 widgets del catálogo', () => {
    for (const tipo of WIDGET_TIPOS) {
      const size = getWidgetDropSizePct(tipo);
      expect(size.anchoPct).toBeGreaterThan(0);
      expect(size.altoPct).toBeGreaterThan(0);
    }
  });
});

describe('clientPointToWidgetMarco', () => {
  it('Hotspot en el centro del lienzo coincide con el fallback de click (48, 48)', () => {
    const marco = dropWidget('hotspot', 640, 360);
    expect(marco.anchoPct).toBe(4);
    expect(marco.altoPct).toBe(4);
    expect(marco.izquierdaPct).toBeCloseTo(48);
    expect(marco.arribaPct).toBeCloseTo(48);
  });

  it('Progreso y Contador conservan su tamaño real, no 90×90', () => {
    const progreso = dropWidget('progreso', 640, 360);
    expect(progreso.anchoPct).toBe(80);
    expect(progreso.altoPct).toBe(5);
    expect(progreso.izquierdaPct).toBeCloseTo(10);
    expect(progreso.arribaPct).toBeCloseTo(47.5);

    const contador = dropWidget('contador', 640, 360);
    expect(contador.anchoPct).toBe(28);
    expect(contador.altoPct).toBe(16);
    expect(contador.izquierdaPct).toBeCloseTo(36);
    expect(contador.arribaPct).toBeCloseTo(42);
  });

  it('Flip Cards 90×90 en el centro sigue en (5, 5), pero sigue el cursor si se suelta aparte', () => {
    const centro = dropWidget('flip-cards', 640, 360);
    expect(centro.anchoPct).toBe(90);
    expect(centro.altoPct).toBe(90);
    expect(centro.izquierdaPct).toBeCloseTo(5);
    expect(centro.arribaPct).toBeCloseTo(5);

    const esquina = dropWidget('flip-cards', 1024, 144);
    expect(esquina.izquierdaPct).toBeCloseTo(35);
    expect(esquina.arribaPct).toBeCloseTo(-25);
  });

  it('centra un pin bajo el cursor (no lo manda a 5, 5)', () => {
    const marco = dropWidget('hotspot', 1024, 144);
    expect(marco.izquierdaPct).toBeCloseTo(80 - 2);
    expect(marco.arribaPct).toBeCloseTo(20 - 2);
  });

  it('clama un pin para que quede en el lienzo, no en -50…150', () => {
    const izq = dropWidget('hotspot', -2000, -2000);
    expect(izq.izquierdaPct).toBe(0);
    expect(izq.arribaPct).toBe(0);

    const der = dropWidget('hotspot', 8000, 8000);
    expect(der.izquierdaPct).toBe(96);
    expect(der.arribaPct).toBe(96);
  });

  it('un Flip Cards 90 % aún puede colgarse a -50 a la izquierda', () => {
    const marco = dropWidget('flip-cards', -2000, 360);
    expect(marco.izquierdaPct).toBe(CANVAS_OVERFLOW_ORIGIN_MIN);
  });
});

describe('createDefault*Block recibe el marco de drop (flujo handleAddWidget)', () => {
  it('Hotspot / Tooltip / Botón / Popup / Contador / Progreso / Flip Cards', async () => {
    const { createDefaultHotspotBlock } = await import('@/lib/hotspot-defaults');
    const { createDefaultTooltipBlock } = await import(
      '@/components/widgets/tooltip/tooltip-defaults'
    );
    const { createDefaultBotonBlock } = await import('@/components/widgets/boton/boton-defaults');
    const { createDefaultPopupBlock } = await import('@/lib/popup-defaults');
    const { createDefaultContadorBlock } = await import(
      '@/components/widgets/contador/contador-defaults'
    );
    const { createDefaultProgresoBlock } = await import(
      '@/components/widgets/progreso/progreso-defaults'
    );
    const { createDefaultFlipCardsBlock } = await import('@/lib/flip-cards-defaults');

    const hotspot = createDefaultHotspotBlock(dropWidget('hotspot', 1024, 144));
    expect(hotspot.x).toBeCloseTo(78);
    expect(hotspot.y).toBeCloseTo(18);
    expect(hotspot.ancho).toBe(4);
    expect(hotspot.alto).toBe(4);

    const tooltip = createDefaultTooltipBlock(dropWidget('tooltip', 1024, 144));
    expect(tooltip.x).toBeCloseTo(78);
    expect(tooltip.y).toBeCloseTo(18);
    expect(tooltip.ancho).toBe(4);
    expect(tooltip.alto).toBe(4);

    const boton = createDefaultBotonBlock(dropWidget('boton', 640, 360));
    expect(boton.ancho).toBe(20);
    expect(boton.alto).toBe(8);
    expect(boton.x).toBeCloseTo(40);
    expect(boton.y).toBeCloseTo(46);

    const popup = createDefaultPopupBlock(dropWidget('popup', 640, 360));
    expect(popup.x).toBeCloseTo(50 - BLOCK_FALLBACKS.popup.ancho / 2);
    expect(popup.y).toBeCloseTo(50 - BLOCK_FALLBACKS.popup.alto / 2);
    expect(popup.ancho).toBeCloseTo(BLOCK_FALLBACKS.popup.ancho, 1);
    expect(popup.alto).toBeCloseTo(BLOCK_FALLBACKS.popup.alto, 1);

    const contador = createDefaultContadorBlock(dropWidget('contador', 640, 360));
    expect(contador.ancho).toBe(28);
    expect(contador.alto).toBe(16);

    const progreso = createDefaultProgresoBlock(dropWidget('progreso', 640, 360));
    expect(progreso.ancho).toBe(80);
    expect(progreso.alto).toBe(5);

    const flip = createDefaultFlipCardsBlock(dropWidget('flip-cards', 640, 360));
    expect(flip.ancho).toBe(90);
    expect(flip.alto).toBe(90);
    expect(flip.x).toBeCloseTo(5);
    expect(flip.y).toBeCloseTo(5);
  });

  it('click sin arrastrar (sin marco) no cambia: Hotspot en 48,48', async () => {
    const { createDefaultHotspotBlock } = await import('@/lib/hotspot-defaults');
    const hotspot = createDefaultHotspotBlock();
    expect(hotspot.x).toBe(BLOCK_FALLBACKS.hotspot.x);
    expect(hotspot.y).toBe(BLOCK_FALLBACKS.hotspot.y);
    expect(hotspot.ancho).toBe(BLOCK_FALLBACKS.hotspot.ancho);
    expect(hotspot.alto).toBe(BLOCK_FALLBACKS.hotspot.alto);
  });
});

describe('clientPointToActivityMarco (rail derecho, sin cambios)', () => {
  it('un bloque 90×90 sigue anclado a (5, 5) por el margen de actividad', () => {
    const a = clientPointToActivityMarco(CANVAS, 100, 100);
    const b = clientPointToActivityMarco(CANVAS, 900, 500);
    expect(a).toEqual({ izquierdaPct: 5, arribaPct: 5, anchoPct: 90, altoPct: 90 });
    expect(b).toEqual({ izquierdaPct: 5, arribaPct: 5, anchoPct: 90, altoPct: 90 });
  });
});
