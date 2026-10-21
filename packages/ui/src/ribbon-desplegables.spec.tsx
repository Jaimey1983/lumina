import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Ribbon, RibbonButton, RibbonGroup, RibbonSplitButton } from './ribbon.js';

// Archivo aparte: los desplegables son Popover de Radix y, en jsdom, dejan la página lenta para las
// pruebas que corren después en el mismo archivo. Aislados, no contaminan al resto.

// Con el popper montado, jsdom tarda ~10 s en asentar cada prueba; el margen evita falsos rojos bajo carga.
vi.setConfig({ testTimeout: 60_000 });

afterEach(cleanup);

// Los desplegables son Popover de Radix. En jsdom, con el popper montado, todo helper asíncrono de
// Testing Library (`userEvent.click`, `findBy*`) tarda ~20 s en asentarse (React sigue reprogramando el
// posicionamiento). Para abrirlos y elegir dentro se usa `fireEvent` (síncrono, ya envuelto en `act`)
// y consultas síncronas por texto: el contenido está montado en cuanto vuelve el clic.
const clic = (el: HTMLElement): void => {
  fireEvent.click(el);
};
const textoDe = (nombre: string): HTMLElement => screen.getAllByText(nombre)[0] as HTMLElement;

describe('Ribbon — modo compacto, desplegables', () => {
  const tabs = (onClick?: () => void) => [
    {
      id: 'inicio',
      label: 'Inicio',
      content: (
        <RibbonGroup label="Edición">
          <RibbonButton label="Duplicar" onClick={onClick} />
        </RibbonGroup>
      ),
    },
  ];

  it('compacto, cada grupo es un botón desplegable que abre sus botones y se cierra al actuar', () => {
    const onClick = vi.fn();
    render(<Ribbon tabs={tabs(onClick)} compact />);
    expect(screen.queryByRole('button', { name: /Duplicar/ })).not.toBeInTheDocument();
    const grupo = screen.getByRole('button', { name: 'Edición' });
    expect(grupo).toHaveAttribute('aria-expanded', 'false');
    clic(grupo);
    expect(grupo).toHaveAttribute('aria-expanded', 'true');
    clic(textoDe('Duplicar').closest('button') as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Duplicar')).not.toBeInTheDocument();
    expect(grupo).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('RibbonSplitButton', () => {
  it('la acción principal y las alternativas son botones distintos', () => {
    const principal = vi.fn();
    const alternativa = vi.fn();
    render(
      <RibbonSplitButton
        label="Pegar"
        onClick={principal}
        items={[
          { id: 'sin-formato', label: 'Pegar sin formato', onSelect: alternativa },
          { id: 'inactivo', label: 'Pegar especial', disabled: true, onSelect: vi.fn() },
        ]}
      />,
    );
    clic(screen.getByRole('button', { name: 'Pegar' }));
    expect(principal).toHaveBeenCalledTimes(1);
    const flecha = screen.getByRole('button', { name: 'Más opciones de Pegar' });
    expect(flecha).toHaveAttribute('aria-expanded', 'false');
    clic(flecha);
    expect(flecha).toHaveAttribute('aria-expanded', 'true');
    const especial = textoDe('Pegar especial').closest('[role="menuitem"]');
    expect(especial).toHaveAttribute('aria-disabled', 'true');
    clic(textoDe('Pegar sin formato').closest('[role="menuitem"]') as HTMLElement);
    expect(alternativa).toHaveBeenCalledTimes(1);
    expect(principal).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Pegar especial')).not.toBeInTheDocument();
  });
});

