// ─── S12: la apariencia de los widgets usa secciones plegables ───

import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Block } from '@lumina/types/slide';

import { TabsAppearanceProperties } from './tabs/tabs-appearance-properties.js';
import { createDefaultTabsBlock } from './tabs/tabs-defaults.js';
import { CarouselAppearanceProperties } from './carousel/carousel-appearance-properties.js';
import { createDefaultCarouselBlock } from './carousel/carousel-defaults.js';
import { TimelineAppearanceProperties } from './timeline/timeline-appearance-properties.js';
import { createDefaultTimelineBlock } from './timeline/timeline-defaults.js';
import { ClickRevealAppearanceProperties } from './click-reveal/click-reveal-appearance-properties.js';
import { createDefaultClickRevealBlock } from './click-reveal/click-reveal-defaults.js';
import { FlipCardsAppearanceProperties } from './flip-cards/flip-cards-appearance-properties.js';
import { createDefaultFlipCardsBlock } from './flip-cards/flip-cards-defaults.js';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const applyNow = vi.fn(async (fn: (b: Block) => Block) => {
  void fn;
});
const expanded = (name: string | RegExp) =>
  screen.getByRole('button', { name }).getAttribute('aria-expanded');
const headers = () => screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-expanded'));

describe('apariencia de widgets con secciones plegables (S12)', () => {
  it('Tabs: Layout abierto; Contenedor, Instrucción y Colores cerrados', () => {
    render(<TabsAppearanceProperties block={createDefaultTabsBlock()} applyNow={applyNow} />);
    expect(expanded('Layout del widget')).toBe('true');
    for (const n of ['Contenedor', 'Instrucción', 'Colores']) expect(expanded(n)).toBe('false');
  });

  it('Carousel: Layout abierto y las demás cerradas', () => {
    render(<CarouselAppearanceProperties block={createDefaultCarouselBlock()} applyNow={applyNow} />);
    expect(expanded('Layout del widget')).toBe('true');
    expect(headers().filter((h) => h.getAttribute('aria-expanded') === 'true')).toHaveLength(1);
    expect(headers().length).toBeGreaterThan(3);
  });

  it('Timeline: sus 4 secciones arrancan cerradas', () => {
    render(<TimelineAppearanceProperties block={createDefaultTimelineBlock()} applyNow={applyNow} />);
    for (const n of ['Línea principal', 'Nodos', 'Tarjetas', 'Tipografía']) {
      expect(expanded(n)).toBe('false');
    }
  });

  it('Click-reveal y Flip-cards: todo cerrado', () => {
    render(<ClickRevealAppearanceProperties block={createDefaultClickRevealBlock()} applyNow={applyNow} />);
    expect(headers().every((h) => h.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(expanded('Apertura del modal')).toBe('false');
    cleanup();
    render(<FlipCardsAppearanceProperties block={createDefaultFlipCardsBlock()} applyNow={applyNow} />);
    expect(expanded('Tarjeta')).toBe('false');
  });

  it('abrir una sección muestra su contenido y se recuerda por widget', () => {
    render(<TimelineAppearanceProperties block={createDefaultTimelineBlock()} applyNow={applyNow} />);
    expect(screen.queryByText('Grosor')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Línea principal' }));
    expect(expanded('Línea principal')).toBe('true');
    expect(localStorage.getItem('lumina.panel.widgets.timeline.linea-principal')).toBe('1');
    cleanup();
    render(<TimelineAppearanceProperties block={createDefaultTimelineBlock()} applyNow={applyNow} />);
    expect(expanded('Línea principal')).toBe('true');
    expect(expanded('Nodos')).toBe('false');
  });
});
