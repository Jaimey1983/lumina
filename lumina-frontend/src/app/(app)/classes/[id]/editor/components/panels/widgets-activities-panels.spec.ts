import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ActivitiesPanel } from './activities-panel';
import { WidgetsInsertPanel } from './widgets-insert-panel';

// Entorno node (sin DOM): render inicial en servidor. Un grupo cerrado no monta
// sus elementos (Radix Presence), así que la presencia de textos refleja qué
// grupos arrancan abiertos.

describe('WidgetsInsertPanel (S4)', () => {
  const out = renderToStaticMarkup(createElement(WidgetsInsertPanel, {}));

  it('Lienzo y Overlay arrancan abiertos; Control y Próximamente, cerrados', () => {
    expect(out).toContain('Flip Cards');
    expect(out).toContain('Popup');
    expect(out).not.toContain('Contador');
    expect(out).not.toContain('Iframe embebido');
  });

  it('los cuatro encabezados están visibles, con conteo', () => {
    for (const t of ['Lienzo', 'Overlay', 'Control', 'Próximamente']) expect(out).toContain(t);
    expect(out).toMatch(/Lienzo<\/span><span[^>]*>11</);
  });

  it('el aviso de actividad se mantiene', () => {
    const conActividad = renderToStaticMarkup(
      createElement(WidgetsInsertPanel, { slideHasActivity: true }),
    );
    expect(conActividad).toContain('Elimina la actividad para agregar widgets.');
  });
});

describe('ActivitiesPanel (S4)', () => {
  const out = renderToStaticMarkup(createElement(ActivitiesPanel, { onAddActivity: () => {} }));

  it('solo «Evaluación» arranca abierto (acordeón de un solo grupo)', () => {
    expect(out).toContain('Quiz opción múltiple');
    expect(out).not.toContain('Balancear ecuación');
    expect(out).not.toContain('Memoria');
    expect(out).not.toContain('Encuesta en vivo');
    expect((out.match(/data-state="open"/g) ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('el antiguo grupo sin título ahora se llama «Juegos»', () => {
    expect(out).toContain('Juegos');
  });

  it('conserva el orden de los grupos', () => {
    const idx = ['Evaluación', 'Química', 'Interacción', 'En vivo', 'Juegos'].map((t) =>
      out.indexOf(t),
    );
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
});
