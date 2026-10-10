import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { VariableDef } from '@lumina/types/interaction';
import { VariablesPanel } from './variables-panel';
import { SlideThemesPanel } from './themes-panel';
import { MathGeneratorPanel } from './math-generator-panel';
import { LiveResponsesPanel } from './live-responses-panel';

// Entorno node (sin DOM ni efectos): render inicial en servidor. `forceOpen` se
// aplica en un efecto, así que aquí solo se verifica el estado inicial.

describe('VariablesPanel (S10)', () => {
  const vars: VariableDef[] = [
    { id: 'a', nombre: 'Intentos', tipo: 'numero', valorInicial: 0 },
    { id: 'b', nombre: 'Visto', tipo: 'booleano', valorInicial: false },
  ];
  const out = renderToStaticMarkup(
    createElement(VariablesPanel, { variables: vars, reglas: [], onSave: () => {} }),
  );

  it('la lista está en una sección abierta «Variables» con el conteo', () => {
    expect(out).toMatch(/Variables<\/span><span[^>]*>2</);
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('Intentos');
  });

  it('los botones Añadir y Guardar quedan fuera de la sección', () => {
    expect(out).toContain('Añadir variable');
    expect(out).toContain('Guardar');
  });
});

describe('SlideThemesPanel (S10)', () => {
  const out = renderToStaticMarkup(
    createElement(SlideThemesPanel, {
      activeSlide: null,
      customThemes: [],
      onApplyToCurrentSlide: () => {},
      onApplyToAllSlides: () => {},
      onSaveCustomThemes: () => {},
    }),
  );

  it('Predefinidos y Personalizados son secciones con el estilo común (sin h2 propios)', () => {
    expect(out).toContain('Predefinidos');
    expect(out).toContain('Personalizados');
    expect(out).not.toContain('text-[#6b7280]');
    expect(out).toContain('tracking-wider');
  });

  it('Personalizados vacío muestra el aviso y el botón de crear', () => {
    expect(out).toContain('Crea tu primer tema personalizado');
    expect(out).toContain('Crear tema personalizado');
  });
});

describe('MathGeneratorPanel (S10)', () => {
  const out = renderToStaticMarkup(createElement(MathGeneratorPanel, {}));

  it('«Quiz de ejercicios» ya no es un <details> y arranca cerrado', () => {
    expect(out).not.toContain('<details');
    expect(out).toContain('Quiz de ejercicios');
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain('Otras preguntas');
  });
});

describe('LiveResponsesPanel (S10)', () => {
  it('«Slide N — Respuestas» es una sección abierta con el conteo', () => {
    const out = renderToStaticMarkup(
      createElement(LiveResponsesPanel, {
        liveResponses: new Map(),
        activeSlideId: 's3',
        activeSlideIndex: 2,
      } as never),
    );
    expect(out).toContain('Slide 3 — Respuestas');
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('Sin respuestas aún.');
  });
});
