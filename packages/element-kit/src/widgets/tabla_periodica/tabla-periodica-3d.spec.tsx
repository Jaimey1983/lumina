import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createDefaultTablaPeriodicaBlock } from './tabla-periodica-defaults.js';
import { TablaPeriodicaViewer } from './tabla-periodica-viewer.js';

function seleccionarOro() {
  render(<TablaPeriodicaViewer widget={createDefaultTablaPeriodicaBlock()} />);
  fireEvent.click(screen.getByRole('gridcell', { name: /Oro/ }));
}

describe('ficha — vista 2D/3D (Q13)', () => {
  afterEach(cleanup);

  it('arranca en 2D y ofrece el conmutador', () => {
    seleccionarOro();
    expect(screen.getByRole('button', { name: '2D' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '3D' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('img', { name: /Modelo de Bohr de Oro/ })).toBeTruthy();
  });

  it('sin WebGL (jsdom) la vista 3D vuelve sola al 2D y deshabilita el botón', async () => {
    seleccionarOro();
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    await waitFor(() => {
      expect((screen.getByRole('button', { name: '3D' }) as HTMLButtonElement).disabled).toBe(true);
    });
    expect(screen.getByRole('button', { name: '2D' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('img', { name: /Modelo de Bohr de Oro/ })).toBeTruthy();
  });

  it('la miniatura no muestra conmutador ni monta 3D', () => {
    render(
      <TablaPeriodicaViewer
        widget={{ ...createDefaultTablaPeriodicaBlock(), seleccionado: 'Au' }}
        isThumbnail
      />,
    );
    expect(screen.queryByRole('button', { name: '3D' })).toBeNull();
  });
});
