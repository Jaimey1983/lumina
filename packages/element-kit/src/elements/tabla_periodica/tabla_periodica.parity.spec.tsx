import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  TablaPeriodicaEditor as LegacyEditor,
  TablaPeriodicaViewer as LegacyViewer,
  createDefaultTablaPeriodicaBlock,
  normalizeTablaPeriodicaWidget as legacyNormalize,
} from '../../widgets/tabla_periodica/index.js';
import {
  normalizeTablaPeriodicaWidget,
  tablaPeriodicaDefinition,
} from './index.js';

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe('Tabla periódica — paridad ElementDefinition vs legacy (Q3)', () => {
  it('crearPorDefecto delega en createDefaultTablaPeriodicaBlock', () => {
    expect(tablaPeriodicaDefinition.crearPorDefecto()).toEqual(
      createDefaultTablaPeriodicaBlock(),
    );
    expect(tablaPeriodicaDefinition.tipo).toBe('tabla_periodica');
    expect(tablaPeriodicaDefinition.eventos).toEqual(['visitado', 'seleccionado']);
  });

  it('conserva la normalización legacy', () => {
    const estado = createDefaultTablaPeriodicaBlock();
    expect(normalizeTablaPeriodicaWidget(estado)).toEqual(legacyNormalize(estado));
  });

  it('Editor nuevo y legacy producen el mismo DOM visible', () => {
    const estado = createDefaultTablaPeriodicaBlock();
    const Editor = tablaPeriodicaDefinition.Editor;
    const legacy = render(<LegacyEditor block={estado} onChange={() => undefined} />);
    const nuevo = render(
      <Editor estado={estado} config={{}} onChange={() => undefined} />,
    );
    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain(estado.tituloWidget);
  });

  it('Viewer nuevo y legacy producen el mismo DOM visible', () => {
    const estado = createDefaultTablaPeriodicaBlock();
    const Viewer = tablaPeriodicaDefinition.Viewer;
    const legacy = render(<LegacyViewer widget={estado} />);
    const nuevo = render(<Viewer estado={estado} config={{}} />);
    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.querySelector('[role="grid"]')).toBeTruthy();
  });
});
