import { describe, expect, it, vi } from 'vitest';
import { createDefaultMoleculaBlock } from '../../widgets/molecula/molecula-defaults.js';
import { moleculaDefinition } from './molecula-definition.js';

vi.mock('../../widgets/molecula/load-smiles-drawer.js', () => ({
  loadSmilesDrawer: async () => ({
    Drawer: class {
      draw() {}
    },
    parse(_s: string, ok: (t: unknown) => void) {
      ok({});
    },
  }),
}));

describe('moleculaDefinition (Q6)', () => {
  it('crearPorDefecto coincide con factory del widget', () => {
    expect(moleculaDefinition.crearPorDefecto()).toEqual(
      createDefaultMoleculaBlock(),
    );
    expect(moleculaDefinition.tipo).toBe('molecula');
  });
});
