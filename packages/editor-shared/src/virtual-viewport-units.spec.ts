import { describe, expect, it } from 'vitest';

import {
  CLICK_REVEAL_TRIGGER_LABEL_FONT_PX,
  CLICK_REVEAL_TRIGGER_PAD_X_PX,
  CLICK_REVEAL_TRIGGER_PAD_Y_PX,
  CLICK_REVEAL_TRIGGER_TITLE_FONT_PX,
  CONTADOR_DIGITS_FONT_PX,
  CONTADOR_ETIQUETA_FONT_PX,
  GRAFICO_DATA_DIALOG_MAX_HEIGHT_PX,
  MEMORIA_CARD_SYMBOL_FONT_PX,
  MEMORIA_CARD_TEXT_FONT_PX,
  POPUP_TRIGGER_BUTTON_FONT_PX,
  TIMELINE_STAGE_PAD_X_PX,
  TIMELINE_STAGE_PAD_Y_PX,
  TEXT_EMPTY_PLACEHOLDER_FONT_PX,
  TIMELINE_PROYECTO_NUM_FONT_PX,
  virtualClampPx,
  virtualMinVhCapPx,
  virtualPxFromVh,
  virtualPxFromVw,
} from './virtual-viewport-units';

describe('virtual-viewport-units (G-scale.3)', () => {
  it('convierte vw/vh respecto al lienzo 1280×720', () => {
    expect(virtualPxFromVw(1.6)).toBeCloseTo(20.48, 2);
    expect(virtualPxFromVw(4)).toBeCloseTo(51.2, 2);
    expect(virtualPxFromVh(1.6)).toBeCloseTo(11.52, 2);
    expect(virtualPxFromVh(2.5)).toBeCloseTo(18, 2);
  });

  it('evalúa clamps legacy en px virtual', () => {
    expect(
      virtualClampPx({ minPx: 10, vw: 1.6, maxPx: 13 }),
    ).toBe(13);
    expect(
      virtualClampPx({ minPx: 11, vh: 1.6, maxPx: 15 }),
    ).toBe(11.5);
    expect(
      virtualClampPx({ minPx: 14, vh: 2.5, maxPx: 20 }),
    ).toBe(18);
    expect(
      virtualClampPx({ minPx: 28, vw: 4, maxPx: 40 }),
    ).toBe(40);
  });

  it('expone tokens G-scale.3 estables', () => {
    expect(TEXT_EMPTY_PLACEHOLDER_FONT_PX).toBe(13);
    expect(CLICK_REVEAL_TRIGGER_TITLE_FONT_PX).toBe(11.5);
    expect(CLICK_REVEAL_TRIGGER_LABEL_FONT_PX).toBe(18);
    expect(TIMELINE_PROYECTO_NUM_FONT_PX).toBe(40);
    expect(CLICK_REVEAL_TRIGGER_PAD_Y_PX).toBe(16);
    expect(CLICK_REVEAL_TRIGGER_PAD_X_PX).toBe(12);
    expect(POPUP_TRIGGER_BUTTON_FONT_PX).toBe(14);
    expect(CONTADOR_ETIQUETA_FONT_PX).toBe(12.8);
    expect(CONTADOR_DIGITS_FONT_PX).toBe(38.4);
    expect(GRAFICO_DATA_DIALOG_MAX_HEIGHT_PX).toBeCloseTo(504, 5);
    expect(TIMELINE_STAGE_PAD_Y_PX).toBe(8.6);
    expect(TIMELINE_STAGE_PAD_X_PX).toBe(20);
    expect(MEMORIA_CARD_TEXT_FONT_PX).toBe(28);
    expect(MEMORIA_CARD_SYMBOL_FONT_PX).toBe(48);
  });

  it('virtualMinVhCapPx alinea actividades al alto virtual', () => {
    expect(virtualMinVhCapPx(42, 280)).toBe(280);
    expect(virtualMinVhCapPx(52, 380)).toBe(374.4);
  });
});
