import { getAllElements, getElementsMetadata } from '@lumina/chemistry';
import { describe, expect, it } from 'vitest';

import { buildPeriodicGridCells } from './periodic-layout.js';
import { validatePeriodicDataset } from './tabla-periodica-viewer.js';

describe('tabla periódica — dataset Q1', () => {
  it('expone 118 elementos con posiciones en la rejilla', () => {
    const all = getAllElements();
    const meta = getElementsMetadata();
    expect(meta.elementCount).toBe(118);
    expect(all).toHaveLength(118);
    expect(buildPeriodicGridCells(all)).toHaveLength(118);
    expect(validatePeriodicDataset()).toBe(118);
  });
});
