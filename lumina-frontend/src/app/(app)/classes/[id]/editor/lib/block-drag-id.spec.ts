import { describe, expect, it } from 'vitest';

import { blockDragId, parseBlockDragIndex } from './block-drag-id';

describe('blockDragId', () => {
  it('genera ids con prefijo block-', () => {
    expect(blockDragId(0)).toBe('block-0');
    expect(blockDragId(12)).toBe('block-12');
  });
});

describe('parseBlockDragIndex', () => {
  it('parsea ids con prefijo', () => {
    expect(parseBlockDragIndex('block-3')).toBe(3);
  });

  it('acepta ids legados numéricos', () => {
    expect(parseBlockDragIndex('2')).toBe(2);
  });

  it('rechaza ids no numéricos', () => {
    expect(parseBlockDragIndex('widget-panel-hotspot')).toBeNull();
    expect(parseBlockDragIndex('block-x')).toBeNull();
  });
});
