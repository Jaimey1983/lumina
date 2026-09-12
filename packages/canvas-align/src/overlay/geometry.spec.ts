import { describe, expect, it } from 'vitest';

import type { SnapLine } from '../snap.js';
import type { Measurement } from '../measurements.js';
import {
  pixelSnapPct,
  guideSemantic,
  measurementSemantic,
  guideTicks,
  extensionSegment,
  resolveLabelCollisions,
  dimensionLabel,
  degreesLabel,
  alignColor,
  describeAlignmentAnnouncement,
} from './geometry.js';

describe('pixelSnapPct', () => {
  it('a zoom 1 redondea a px entero del lienzo', () => {
    // 10.04 % de 1280 = 128.512 px → 129 px → 10.078125 %
    expect(pixelSnapPct(10.04, 1280, 1)).toBeCloseTo((129 / 1280) * 100, 6);
  });
  it('a zoom 2 redondea a medio px del lienzo (1 px de pantalla)', () => {
    // 10.04 % de 1280 = 128.512 → *2 = 257.024 → round 257 → /2 = 128.5 px
    expect(pixelSnapPct(10.04, 1280, 2)).toBeCloseTo((128.5 / 1280) * 100, 6);
  });
  it('zoom inválido cae a 1', () => {
    expect(pixelSnapPct(10.04, 1280, 0)).toBe(pixelSnapPct(10.04, 1280, 1));
  });
});

describe('semántica de color (un token por rol)', () => {
  it('guía align→object, gap→distribute, grid→canvas', () => {
    expect(guideSemantic({ orientation: 'vertical', position: 0, kind: 'align' })).toBe('object');
    expect(guideSemantic({ orientation: 'vertical', position: 0, kind: 'gap' })).toBe('distribute');
    expect(guideSemantic({ orientation: 'vertical', position: 0, kind: 'grid' })).toBe('canvas');
  });
  it('cota neighbor→object, equal→distribute, canvas→canvas', () => {
    const base: Omit<Measurement, 'role'> = {
      id: 'm', type: 'horizontal', minX_pct: 0, maxX_pct: 1, minY_pct: 0, maxY_pct: 0,
      distance: 10, color: '#000',
    };
    expect(measurementSemantic({ ...base, role: 'neighbor' })).toBe('object');
    expect(measurementSemantic({ ...base, role: 'equal' })).toBe('distribute');
    expect(measurementSemantic({ ...base, role: 'canvas' })).toBe('canvas');
  });
  it('alignColor usa CSS var con fallback', () => {
    expect(alignColor('object')).toBe('var(--align-object, #2563EB)');
  });
});

describe('guideTicks', () => {
  const vAlign: SnapLine = { orientation: 'vertical', position: 40, kind: 'align' };
  it('2 remates en los bordes del bloque activo', () => {
    const ticks = guideTicks(vAlign, { x: 10, y: 20, ancho: 30, alto: 15 });
    expect(ticks).toEqual([{ at: 20 }, { at: 35 }]);
  });
  it('ninguno sin bloque activo o si la guía es gap/grid', () => {
    expect(guideTicks(vAlign, null)).toEqual([]);
    expect(guideTicks({ ...vAlign, kind: 'gap' }, { x: 0, y: 0, ancho: 1, alto: 1 })).toEqual([]);
  });
});

describe('extensionSegment', () => {
  const guide: SnapLine = { orientation: 'vertical', position: 30, kind: 'align' };
  const active = { x: 25, y: 60, ancho: 10, alto: 10 };
  it('null si el peer solapa el activo en el eje transversal', () => {
    expect(extensionSegment(guide, active, { x: 30, y: 55, ancho: 8, alto: 20 })).toBeNull();
  });
  it('tramo punteado desde el borde del peer hasta el activo si NO solapan', () => {
    const seg = extensionSegment(guide, active, { x: 30, y: 10, ancho: 8, alto: 12 });
    expect(seg).toEqual({ orientation: 'vertical', pos: 30, from: 22, to: 60 });
  });
});

describe('resolveLabelCollisions', () => {
  it('separa dos pills coincidentes y conserva el orden de entrada', () => {
    const out = resolveLabelCollisions([
      { id: 'a', cx: 50, cy: 50, w: 6, h: 3 },
      { id: 'b', cx: 50, cy: 50, w: 6, h: 3 },
    ]);
    expect(out[0].id).toBe('a');
    expect(out[1].id).toBe('b');
    expect(Math.abs(out[0].cy - out[1].cy)).toBeGreaterThanOrEqual(3);
  });
  it('no mueve pills que no colisionan', () => {
    const input = [
      { id: 'a', cx: 10, cy: 10, w: 4, h: 3 },
      { id: 'b', cx: 80, cy: 80, w: 4, h: 3 },
    ];
    expect(resolveLabelCollisions(input)).toEqual(input);
  });
});

describe('dimensionLabel / degreesLabel', () => {
  it('W×H y X,Y en px virtuales', () => {
    const d = dimensionLabel({ x: 10, y: 20, ancho: 50, alto: 25 });
    expect(d).toMatchObject({ wPx: 640, hPx: 180, xPx: 128, yPx: 144, text: '640 × 180' });
  });
  it('grados normalizados a [0,360) con 1 decimal', () => {
    expect(degreesLabel(-45)).toBe('315°');
    expect(degreesLabel(405)).toBe('45°');
    expect(degreesLabel(44.98)).toBe('45°');
  });
});

describe('describeAlignmentAnnouncement (aria-live)', () => {
  const measBase: Omit<Measurement, 'id' | 'distance' | 'role'> = {
    type: 'horizontal', minX_pct: 0, maxX_pct: 1, minY_pct: 0, maxY_pct: 0, color: '#000',
  };

  it('sin guías, sin cotas, sin rotación → vacío (nada que anunciar)', () => {
    expect(describeAlignmentAnnouncement([], [])).toBe('');
  });

  it('guía vertical de alineación → "Alineado verticalmente"', () => {
    const guides: SnapLine[] = [{ orientation: 'vertical', position: 50, kind: 'align' }];
    expect(describeAlignmentAnnouncement(guides, [])).toBe('Alineado verticalmente');
  });

  it('guía horizontal de alineación → "Alineado horizontalmente"', () => {
    const guides: SnapLine[] = [{ orientation: 'horizontal', position: 50, kind: 'align' }];
    expect(describeAlignmentAnnouncement(guides, [])).toBe('Alineado horizontalmente');
  });

  it('guías en ambos ejes → un solo mensaje combinado', () => {
    const guides: SnapLine[] = [
      { orientation: 'vertical', position: 50, kind: 'align' },
      { orientation: 'horizontal', position: 30, kind: 'align' },
    ];
    expect(describeAlignmentAnnouncement(guides, [])).toBe('Alineado horizontal y verticalmente');
  });

  it('guía de hueco igual (kind gap) → "Espaciado igualado", no "Alineado"', () => {
    const guides: SnapLine[] = [{ orientation: 'horizontal', position: 10, kind: 'gap' }];
    expect(describeAlignmentAnnouncement(guides, [])).toBe('Espaciado igualado');
  });

  it('guía de grilla (kind grid) → "Ajustado a la grilla"', () => {
    const guides: SnapLine[] = [{ orientation: 'vertical', position: 10, kind: 'grid' }];
    expect(describeAlignmentAnnouncement(guides, [])).toBe('Ajustado a la grilla');
  });

  it('cotas → reporta la distancia más chica, redondeada', () => {
    const measurements: Measurement[] = [
      { ...measBase, id: 'a', distance: 24.4, role: 'neighbor' },
      { ...measBase, id: 'b', distance: 80, role: 'canvas' },
    ];
    expect(describeAlignmentAnnouncement([], measurements)).toBe('Distancia: 24 px');
  });

  it('rotación no nula → "Rotación: N°"; rotación 0/360 no se anuncia', () => {
    expect(describeAlignmentAnnouncement([], [], 45)).toBe('Rotación: 45°');
    expect(describeAlignmentAnnouncement([], [], 0)).toBe('');
    expect(describeAlignmentAnnouncement([], [], 360)).toBe('');
  });

  it('combina alineación + distancia + rotación en un solo texto', () => {
    const guides: SnapLine[] = [{ orientation: 'vertical', position: 50, kind: 'align' }];
    const measurements: Measurement[] = [{ ...measBase, id: 'a', distance: 12, role: 'neighbor' }];
    expect(describeAlignmentAnnouncement(guides, measurements, 90)).toBe(
      'Alineado verticalmente · Distancia: 12 px · Rotación: 90°',
    );
  });
});
