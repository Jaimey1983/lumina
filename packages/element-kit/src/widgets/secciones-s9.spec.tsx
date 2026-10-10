// ─── S9: secciones plegables en Popup, Flip-cards, Timeline, Click-reveal, Hotspot y Diagrama ───

import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Block } from '@lumina/types/slide';

import { PopupWidgetComponentes, PopupOverlayProperties } from './popup/popup-properties.js';
import { createDefaultPopupBlock } from './popup/popup-defaults.js';
import { FlipCardsProperties } from './flip-cards/flip-cards-properties.js';
import { createDefaultFlipCardsBlock } from './flip-cards/flip-cards-defaults.js';
import { TimelineWidgetComponentes } from './timeline/timeline-properties.js';
import { createDefaultTimelineBlock } from './timeline/timeline-defaults.js';
import { ClickRevealWidgetComponentes } from './click-reveal/click-reveal-properties.js';
import { createDefaultClickRevealBlock } from './click-reveal/click-reveal-defaults.js';
import { HotspotProperties } from './hotspot/hotspot-properties.js';
import { createDefaultHotspotBlock } from './hotspot/hotspot-defaults.js';
import { DiagramaProperties } from '../blocks/diagrama/diagrama-properties.js';
import { createDefaultMapaMentalBlock } from '../blocks/diagrama/diagrama-defaults.js';

afterEach(() => {
  cleanup();
  // Las secciones recuerdan abierta/cerrada en localStorage: aislar cada prueba.
  localStorage.clear();
});

const applyNow = vi.fn(async (fn: (b: Block) => Block) => {
  void fn;
});
const expanded = (name: string | RegExp) =>
  screen.getByRole('button', { name }).getAttribute('aria-expanded');

describe('Popup (S9)', () => {
  it('Disparador abierto; Modal y Apariencia del modal cerrados', () => {
    render(<PopupWidgetComponentes block={createDefaultPopupBlock()} applyNow={applyNow} />);
    expect(expanded('Disparador')).toBe('true');
    expect(expanded('Modal')).toBe('false');
    expect(expanded('Apariencia del modal')).toBe('false');
    screen.getByText('Evento de apertura');
    expect(screen.queryByText('Efecto de apertura')).toBeNull();
    expect(screen.queryByText('Color fondo modal')).toBeNull();
  });

  it('abrir Modal muestra efecto, ancho y alto; abrir Apariencia, colores y backdrop', () => {
    render(<PopupWidgetComponentes block={createDefaultPopupBlock()} applyNow={applyNow} />);
    fireEvent.click(screen.getByRole('button', { name: 'Modal' }));
    screen.getByText('Efecto de apertura');
    screen.getByText(/Ancho ventana/);
    expect(screen.queryByText('Color fondo modal')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Apariencia del modal' }));
    screen.getByText('Color fondo modal');
    screen.getByText('Color backdrop');
  });

  it('«Contenido del popup» es una sección abierta', () => {
    render(<PopupOverlayProperties block={createDefaultPopupBlock()} applyNow={applyNow} />);
    expect(expanded('Contenido del popup')).toBe('true');
    screen.getByText('Layout del contenido');
  });
});

describe('Listas de ítems con conteo (S9)', () => {
  it('Flip-cards: Layout muestra el número de tarjetas; Visibilidad cerrada', () => {
    const block = createDefaultFlipCardsBlock();
    render(<FlipCardsProperties block={block} applyNow={applyNow} />);
    const layout = screen.getByRole('button', { name: /Layout/ });
    expect(layout.textContent).toMatch(/\d+ tarjetas/);
    expect(expanded('Visibilidad por defecto')).toBe('false');
    expect(screen.queryByText('Frente')).toBeNull();
  });

  it('Timeline: Configuración con conteo de nodos; Dimensiones rápidas cerrada', () => {
    const block = createDefaultTimelineBlock();
    render(<TimelineWidgetComponentes block={block} applyNow={applyNow} />);
    expect(screen.getByRole('button', { name: /Configuración/ }).textContent).toMatch(/\d+ nodos/);
    expect(expanded('Dimensiones rápidas')).toBe('false');
    expect(screen.queryByText('Grosor de línea')).toBeNull();
  });

  it('Click-reveal: Configuración con conteo de elementos', () => {
    const block = createDefaultClickRevealBlock();
    render(<ClickRevealWidgetComponentes block={block} applyNow={applyNow} />);
    expect(screen.getByRole('button', { name: /Configuración/ }).textContent).toMatch(/\d+ elementos/);
    expect(expanded(/Configuración/)).toBe('true');
  });

  it('Hotspot: Marcador abierto, Burbuja de Contenido cerrada', () => {
    render(<HotspotProperties block={createDefaultHotspotBlock()} applyNow={applyNow} />);
    expect(expanded('Marcador')).toBe('true');
    expect(expanded('Burbuja de Contenido')).toBe('false');
    screen.getByText('Color del Pulso');
    expect(screen.queryByText('Posición de la Burbuja')).toBeNull();
  });
});

describe('Diagrama (S9)', () => {
  const renderDiagrama = () =>
    render(<DiagramaProperties block={createDefaultMapaMentalBlock()} applyNow={applyNow} />);

  it('Tipo de Diagrama y Nodos abiertos; Paleta, Plantillas, Esquema y Conexiones cerrados', () => {
    renderDiagrama();
    expect(expanded(/Tipo de Diagrama/)).toBe('true');
    expect(expanded(/Nodos/)).toBe('true');
    expect(expanded(/Paleta de Colores/)).toBe('false');
    expect(expanded(/Plantillas Pedagógicas/)).toBe('false');
    expect(expanded(/Modo Esquema/)).toBe('false');
    expect(expanded(/Conexiones/)).toBe('false');
  });

  it('Nodos muestra el conteo en el encabezado y conserva el botón de añadir', () => {
    renderDiagrama();
    expect(screen.getByRole('button', { name: /Nodos/ }).textContent).toMatch(/\d+/);
    screen.getByText('Título del Diagrama');
  });

  it('abrir Plantillas muestra las plantillas', () => {
    renderDiagrama();
    fireEvent.click(screen.getByRole('button', { name: /Plantillas Pedagógicas/ }));
    expect(screen.getAllByRole('button').length).toBeGreaterThan(8);
  });
});
