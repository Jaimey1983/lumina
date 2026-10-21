import * as React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickAccessBar, Ribbon, RibbonButton, RibbonGroup, type RibbonTabDef } from './ribbon.js';

afterEach(cleanup);

const tabs = (extra: RibbonTabDef[] = [], onClick?: () => void): RibbonTabDef[] => [
  {
    id: 'inicio',
    label: 'Inicio',
    content: (
      <RibbonGroup label="Edición">
        <RibbonButton label="Duplicar" shortcut="Ctrl+D" onClick={onClick} />
        <RibbonButton label="Eliminar" />
      </RibbonGroup>
    ),
  },
  { id: 'insertar', label: 'Insertar', content: <RibbonGroup label="Formas"><RibbonButton label="Rectángulo" /></RibbonGroup> },
  { id: 'vista', label: 'Vista', content: <RibbonGroup label="Zoom"><RibbonButton label="Acercar" /></RibbonGroup> },
  ...extra,
];

const contextual: RibbonTabDef = {
  id: 'forma',
  label: 'Formato de forma',
  contextual: true,
  content: <RibbonGroup label="Relleno"><RibbonButton label="Color de relleno" /></RibbonGroup>,
};

const tabSel = (name: string): HTMLElement => screen.getByRole('tab', { name });

describe('Ribbon — pestañas', () => {
  it('muestra la lista de pestañas, la primera seleccionada y su panel', () => {
    render(<Ribbon tabs={tabs()} compact={false} />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Inicio', 'Insertar', 'Vista']);
    expect(tabSel('Inicio')).toHaveAttribute('aria-selected', 'true');
    expect(tabSel('Insertar')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tabSel('Inicio').id);
    expect(within(panel).getByRole('button', { name: /Duplicar/ })).toBeInTheDocument();
    // Solo se monta el contenido de la pestaña visible.
    expect(screen.queryByRole('button', { name: /Rectángulo/ })).not.toBeInTheDocument();
  });

  it('roving tabindex: solo la pestaña seleccionada entra con Tab', () => {
    render(<Ribbon tabs={tabs()} compact={false} />);
    expect(tabSel('Inicio')).toHaveAttribute('tabindex', '0');
    expect(tabSel('Insertar')).toHaveAttribute('tabindex', '-1');
    expect(tabSel('Vista')).toHaveAttribute('tabindex', '-1');
  });

  it('las flechas cambian y enfocan la pestaña, con vuelta; Inicio y Fin saltan a los extremos', async () => {
    const user = userEvent.setup();
    render(<Ribbon tabs={tabs()} compact={false} />);
    tabSel('Inicio').focus();
    await user.keyboard('{ArrowRight}');
    expect(tabSel('Insertar')).toHaveFocus();
    expect(tabSel('Insertar')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /Rectángulo/ })).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(tabSel('Vista')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tabSel('Inicio')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tabSel('Vista')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tabSel('Inicio')).toHaveFocus();
  });

  it('Flecha abajo lleva el foco al primer botón del panel', async () => {
    const user = userEvent.setup();
    render(<Ribbon tabs={tabs()} compact={false} />);
    tabSel('Inicio').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /Duplicar/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /Eliminar/ })).toHaveFocus();
  });

  it('avisa del cambio de pestaña y admite modo controlado', async () => {
    const user = userEvent.setup();
    const onActiveTabChange = vi.fn();
    const { rerender } = render(<Ribbon tabs={tabs()} compact={false} activeTab="inicio" onActiveTabChange={onActiveTabChange} />);
    await user.click(tabSel('Vista'));
    expect(onActiveTabChange).toHaveBeenCalledWith('vista');
    expect(tabSel('Inicio')).toHaveAttribute('aria-selected', 'true');
    rerender(<Ribbon tabs={tabs()} compact={false} activeTab="vista" onActiveTabChange={onActiveTabChange} />);
    expect(tabSel('Vista')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Ribbon — pestañas contextuales', () => {
  it('al aparecer no le quita la pestaña activa al usuario', () => {
    const { rerender } = render(<Ribbon tabs={tabs()} compact={false} />);
    rerender(<Ribbon tabs={tabs([contextual])} compact={false} />);
    expect(tabSel('Formato de forma')).toBeInTheDocument();
    expect(tabSel('Formato de forma')).toHaveAttribute('data-contextual');
    expect(tabSel('Inicio')).toHaveAttribute('aria-selected', 'true');
  });

  it('si desaparece estando activa, vuelve a la última pestaña normal elegida', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Ribbon tabs={tabs([contextual])} compact={false} />);
    await user.click(tabSel('Insertar'));
    await user.click(tabSel('Formato de forma'));
    expect(tabSel('Formato de forma')).toHaveAttribute('aria-selected', 'true');
    rerender(<Ribbon tabs={tabs()} compact={false} />);
    expect(screen.queryByRole('tab', { name: 'Formato de forma' })).not.toBeInTheDocument();
    expect(tabSel('Insertar')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabSel('Insertar').id);
  });

  it('si reaparece, no salta sola a ella', () => {
    const { rerender } = render(<Ribbon tabs={tabs([contextual])} compact={false} />);
    rerender(<Ribbon tabs={tabs()} compact={false} />);
    rerender(<Ribbon tabs={tabs([contextual])} compact={false} />);
    expect(tabSel('Inicio')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Ribbon — colapsar', () => {
  it('doble clic en una pestaña contrae la cinta y otro doble clic la expande', async () => {
    const user = userEvent.setup();
    render(<Ribbon tabs={tabs()} compact={false} />);
    const toggle = screen.getByRole('button', { name: /cinta/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.dblClick(tabSel('Inicio'));
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expandir la cinta' })).toHaveAttribute('aria-expanded', 'false');
    await user.dblClick(tabSel('Inicio'));
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('colapsada, elegir una pestaña abre su panel flotante; Escape lo cierra y devuelve el foco', async () => {
    const user = userEvent.setup();
    render(<Ribbon tabs={tabs()} compact={false} defaultCollapsed />);
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    await user.click(tabSel('Insertar'));
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('data-floating');
    expect(within(panel).getByRole('button', { name: /Rectángulo/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(tabSel('Insertar')).toHaveFocus();
  });

  it('el panel flotante se cierra al ejecutar una acción y al pulsar fuera', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <div>
        <button type="button">fuera</button>
        <Ribbon tabs={tabs([], onClick)} compact={false} defaultCollapsed />
      </div>,
    );
    await user.click(tabSel('Inicio'));
    await user.click(screen.getByRole('button', { name: /Duplicar/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    await user.click(tabSel('Inicio'));
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'fuera' }));
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('volver a pulsar la misma pestaña colapsada cierra el panel flotante', async () => {
    const user = userEvent.setup();
    render(<Ribbon tabs={tabs()} compact={false} defaultCollapsed />);
    await user.click(tabSel('Inicio'));
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    await user.click(tabSel('Inicio'));
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('avisa del cambio de estado y admite modo controlado', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(<Ribbon tabs={tabs()} compact={false} collapsed={false} onCollapsedChange={onCollapsedChange} />);
    await user.click(screen.getByRole('button', { name: 'Contraer la cinta' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});

describe('Ribbon — modo compacto', () => {
  it('sin compacto, el grupo muestra sus botones y su etiqueta', () => {
    render(<Ribbon tabs={tabs()} compact={false} />);
    expect(screen.getByRole('group', { name: 'Edición' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Duplicar/ })).toBeVisible();
  });
});

describe('RibbonButton', () => {
  it('pone el atajo en el tooltip y en aria-keyshortcuts', () => {
    render(<RibbonButton label="Duplicar" shortcut="Ctrl+D" />);
    const b = screen.getByRole('button', { name: 'Duplicar' });
    expect(b).toHaveAttribute('title', 'Duplicar (Ctrl+D)');
    expect(b).toHaveAttribute('aria-keyshortcuts', 'Ctrl+D');
  });

  it('deshabilitado: no ejecuta, sigue enfocable y explica el motivo', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<RibbonButton label="Distribuir" disabled disabledReason="Elige 3 o más elementos" onClick={onClick} />);
    const b = screen.getByRole('button', { name: 'Distribuir' });
    expect(b).toHaveAttribute('aria-disabled', 'true');
    expect(b).toHaveAttribute('title', 'Distribuir — Elige 3 o más elementos');
    await user.tab();
    expect(b).toHaveFocus();
    await user.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('los botones de dos estados exponen aria-pressed', () => {
    const { rerender } = render(<RibbonButton label="Cuadrícula" active={false} />);
    expect(screen.getByRole('button', { name: 'Cuadrícula' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<RibbonButton label="Cuadrícula" active />);
    expect(screen.getByRole('button', { name: 'Cuadrícula' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('en tamaño pequeño solo hay icono, pero conserva su nombre accesible', () => {
    render(<RibbonButton label="Deshacer" size="small" icon={<svg data-testid="i" />} />);
    const b = screen.getByRole('button', { name: 'Deshacer' });
    expect(b.textContent).toBe('');
    expect(within(b).getByTestId('i')).toBeInTheDocument();
  });
});

describe('QuickAccessBar y F6', () => {
  const montar = (onNavigateOut?: (d: 1 | -1) => void) =>
    render(
      <Ribbon
        tabs={tabs()}
        compact={false}
        onNavigateOut={onNavigateOut}
        quickAccess={
          <QuickAccessBar>
            <RibbonButton label="Deshacer" size="small" />
            <RibbonButton label="Rehacer" size="small" />
          </QuickAccessBar>
        }
      />,
    );

  it('es una barra de herramientas con flechas, Inicio y Fin', async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.getByRole('toolbar', { name: 'Acceso rápido' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Deshacer' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Rehacer' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Deshacer' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Rehacer' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Deshacer' })).toHaveFocus();
  });

  it('F6 salta de la barra de acceso rápido a la cinta y, al final, avisa para salir al lienzo', async () => {
    const user = userEvent.setup();
    const salir = vi.fn();
    montar(salir);
    screen.getByRole('button', { name: 'Deshacer' }).focus();
    await user.keyboard('{F6}');
    expect(tabSel('Inicio')).toHaveFocus();
    expect(salir).not.toHaveBeenCalled();
    await user.keyboard('{F6}');
    expect(salir).toHaveBeenCalledWith(1);
  });

  it('Mayús+F6 hace el camino inverso', async () => {
    const user = userEvent.setup();
    const salir = vi.fn();
    montar(salir);
    tabSel('Inicio').focus();
    await user.keyboard('{Shift>}{F6}{/Shift}');
    expect(screen.getByRole('button', { name: 'Deshacer' })).toHaveFocus();
    await user.keyboard('{Shift>}{F6}{/Shift}');
    expect(salir).toHaveBeenCalledWith(-1);
  });

  it('las flechas dentro de un campo de texto de la cinta no mueven el foco', async () => {
    const user = userEvent.setup();
    render(
      <Ribbon
        tabs={[{ id: 'a', label: 'A', content: <RibbonGroup label="G"><RibbonButton label="Uno" /><input aria-label="Tamaño" defaultValue="12" /><RibbonButton label="Dos" /></RibbonGroup> }]}
        compact={false}
      />,
    );
    const campo = screen.getByRole('textbox', { name: 'Tamaño' });
    await user.click(campo);
    await user.keyboard('{ArrowRight}');
    expect(campo).toHaveFocus();
  });
});
