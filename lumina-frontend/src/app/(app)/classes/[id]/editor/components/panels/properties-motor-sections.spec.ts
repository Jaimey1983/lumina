import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Block } from '@lumina/types/slide';
import { BlockStatesSection } from './block-states-section';
import { BlockEstadoInicialSection, BlockRotationSection } from './properties-panel-motor';

// Entorno node (sin DOM ni efectos): se prueba el render inicial. `forceOpen`
// se aplica en un efecto, así que aquí solo se verifican cerradas por defecto y
// el contenido de los badges.

const noop = async () => {};

describe('secciones comunes del panel de propiedades (S7)', () => {
  it('«Rotación» arranca cerrada y muestra los grados en el badge', () => {
    const out = renderToStaticMarkup(
      createElement(BlockRotationSection, { rotacion: 0, applyNow: noop, scheduleApply: () => {} }),
    );
    expect(out).toContain('Rotación');
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain('>0°<');
    expect(out).not.toContain('Girar +90°');
  });

  it('«Estado inicial» arranca cerrada; sin cambios no hay badge', () => {
    const out = renderToStaticMarkup(
      createElement(BlockEstadoInicialSection, { estado: 'normal', applyNow: noop }),
    );
    expect(out).toContain('Estado inicial (interacción)');
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain('rounded-full');
  });

  it('«Estado inicial» con valor distinto de normal muestra el badge', () => {
    const out = renderToStaticMarkup(
      createElement(BlockEstadoInicialSection, { estado: 'deshabilitado', applyNow: noop }),
    );
    expect(out).toContain('>Deshabilitado<');
  });

  it('«Estados (apariencia)» arranca cerrada y cuenta los estados definidos', () => {
    const vacio = { tipo: 'separador' } as unknown as Block;
    const out = renderToStaticMarkup(
      createElement(BlockStatesSection, { block: vacio, reglas: [], applyNow: noop }),
    );
    expect(out).toContain('Estados (apariencia)');
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain('rounded-full');

    const dos = {
      tipo: 'separador',
      apariencias: { hover: { fondo: '#ffffff' } },
      estadosPersonalizados: [{ id: 'est_1', nombre: 'Mío', apariencia: {} }],
    } as unknown as Block;
    const out2 = renderToStaticMarkup(
      createElement(BlockStatesSection, { block: dos, reglas: [], applyNow: noop }),
    );
    expect(out2).toContain('2 estados');
  });
});
