import { describe, expect, it } from 'vitest';

import { EDITOR_Z } from './z-layers.js';

describe('EDITOR_Z', () => {
  it('el cromo del editor queda por encima de cualquier z de bloque realista', () => {
    for (const z of Object.values(EDITOR_Z)) expect(z).toBeGreaterThan(1000);
  });

  it('los tiradores quedan sobre su guía y el portal sobre la barra de acciones', () => {
    expect(EDITOR_Z.resizeHandle).toBeGreaterThan(EDITOR_Z.resizeGuide);
    expect(EDITOR_Z.blockToolbarPortal).toBeGreaterThan(EDITOR_Z.blockActionsBar);
  });
});
