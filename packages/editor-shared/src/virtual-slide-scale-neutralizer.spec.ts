import { describe, expect, it } from 'vitest';

import {
  blockNeedsVirtualSlideScaleNeutralizer,
  virtualSlideScaleNeutralizerStyle,
} from './virtual-slide-scale-neutralizer';

describe('virtual-slide-scale-neutralizer (G-scale.4)', () => {
  it('no envuelve cuando la escala es 1', () => {
    expect(virtualSlideScaleNeutralizerStyle({ ancho: 70, alto: 65 }, 1)).toBeUndefined();
    expect(blockNeedsVirtualSlideScaleNeutralizer('grafico', 1)).toBe(false);
  });

  it('calcula footprint visual para S=0.5 sobre bloque 70×65 %', () => {
    const style = virtualSlideScaleNeutralizerStyle({ ancho: 70, alto: 65 }, 0.5);
    expect(style?.width).toBe(448);
    expect(style?.height).toBe(234);
    expect(style?.transform).toBe('scale(2)');
  });

  it('diagrama entra en la lista neutralizada', () => {
    expect(blockNeedsVirtualSlideScaleNeutralizer('diagrama', 0.8)).toBe(true);
  });
});
