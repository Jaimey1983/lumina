import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { WidgetLayoutId } from '@lumina/types/widget';

import {
  WidgetPropertiesPanelBlock,
  WidgetPropertiesPanelSection,
} from './widget-properties-panel';
import {
  WidgetAppearanceSection,
  WidgetAppearanceStack,
  WidgetLayoutGallerySection,
} from './widget-appearance-fields';

// Entorno node: render inicial en servidor. Sin `title` / `collapsible` las
// secciones se comportan como antes de la etapa S (S7).

const hijo = createElement('p', null, 'CONTENIDO');
// Los componentes exigen `children`; se pasan como 3er argumento de createElement.
const render = <P extends { children: ReactNode }>(C: ComponentType<P>, props: Omit<P, 'children'>) =>
  renderToStaticMarkup(createElement(C, props as P, hijo));

describe('WidgetPropertiesPanelSection', () => {
  it('sin title: markup de siempre, sin colapsable', () => {
    const out = render(WidgetPropertiesPanelSection, {});
    expect(out).toBe(
      '<div class="flex flex-col gap-3 border-t border-border pt-4"><p>CONTENIDO</p></div>',
    );
  });

  it('sin title: el hint se conserva', () => {
    const out = render(WidgetPropertiesPanelSection, { hint: 'AYUDA' });
    expect(out).toContain('AYUDA');
    expect(out).not.toContain('aria-expanded');
  });

  it('con title: colapsible, abierta por defecto', () => {
    const out = render(WidgetPropertiesPanelSection, { title: 'Ítem', hint: 'AYUDA' });
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('Ítem');
    expect(out).toContain('AYUDA');
    expect(out).toContain('CONTENIDO');
  });

  it('con title y defaultOpen=false: contenido fuera del DOM', () => {
    const out = render(WidgetPropertiesPanelSection, { title: 'Ítem', defaultOpen: false });
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain('CONTENIDO');
  });
});

describe('WidgetPropertiesPanelBlock', () => {
  it('sin title: markup de siempre', () => {
    expect(render(WidgetPropertiesPanelBlock, {})).toBe(
      '<div class="border-t border-border pt-4"><p>CONTENIDO</p></div>',
    );
  });

  it('con title y badge', () => {
    const out = render(WidgetPropertiesPanelBlock, { title: 'Apariencia', badge: 3 });
    expect(out).toContain('Apariencia');
    expect(out).toContain('>3<');
  });
});

describe('WidgetAppearanceSection', () => {
  it('por defecto no se pliega (título fijo)', () => {
    const out = render(WidgetAppearanceSection, { title: 'Colores' });
    expect(out).toContain('Colores');
    expect(out).not.toContain('aria-expanded');
  });

  it('collapsible + defaultOpen=false: cerrada', () => {
    const out = render(WidgetAppearanceSection, {
      title: 'Colores',
      collapsible: true,
      defaultOpen: false,
    });
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain('CONTENIDO');
  });
});

describe('WidgetAppearanceStack con scope (S12)', () => {
  type StackProps = { scope?: string; children: ReactNode };
  const stack = (scope: string | undefined, ...kids: ReactNode[]) =>
    renderToStaticMarkup(createElement(WidgetAppearanceStack, { scope } as StackProps, ...kids));
  const seccion = (title: string, extra: { defaultOpen?: boolean; collapsible?: boolean } = {}) =>
    createElement(
      WidgetAppearanceSection,
      { title, ...extra } as Parameters<typeof WidgetAppearanceSection>[0],
      hijo,
    );

  it('sin scope las secciones conservan el título fijo', () => {
    const out = stack(undefined, seccion('Colores'));
    expect(out).toContain('Colores');
    expect(out).not.toContain('aria-expanded');
  });

  it('con scope se pliegan solas y arrancan cerradas', () => {
    const out = stack('tabs', seccion('Colores'), seccion('Instrucción'));
    expect((out.match(/aria-expanded="false"/g) ?? []).length).toBe(2);
    expect(out).not.toContain('CONTENIDO');
  });

  it('defaultOpen=true mantiene la sección abierta', () => {
    const out = stack('tabs', seccion('Colores', { defaultOpen: true }));
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('CONTENIDO');
  });

  it('«Layout del widget» es la sección que arranca abierta', () => {
    const out = stack(
      'carousel',
      createElement(WidgetLayoutGallerySection, {
        hint: 'AYUDA',
        activeId: 'horizontal' as WidgetLayoutId,
        onSelect: () => {},
      }),
    );
    expect(out).toContain('Layout del widget');
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('AYUDA');
  });

  it('collapsible=false fuerza el título fijo incluso con scope', () => {
    const out = stack('tabs', seccion('Colores', { collapsible: false }));
    expect(out).not.toContain('aria-expanded');
  });
});
