// ─── S8: secciones plegables del panel de propiedades del Gráfico ───

import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GraficoProperties } from './grafico-properties.js';
import { createDefaultGraficoBlock } from './grafico-defaults.js';
import type { Block, GraficoChartType, GraficoDatosBlock } from '@lumina/types/slide';

afterEach(() => {
  cleanup();
  // Las secciones recuerdan abierta/cerrada en localStorage: aislar cada prueba.
  localStorage.clear();
});

function renderProps(chartType: GraficoChartType, overrides: Partial<GraficoDatosBlock> = {}) {
  const block = { ...createDefaultGraficoBlock({ chartType }), ...overrides };
  const applyNow = vi.fn(async (fn: (b: Block) => Block) => {
    fn(block);
  });
  render(<GraficoProperties block={block} applyNow={applyNow} />);
}

const header = (name: string) => screen.queryByRole('button', { name: new RegExp(name) });
const expanded = (name: string) => header(name)?.getAttribute('aria-expanded');

describe('GraficoProperties — secciones (S8)', () => {
  it('Datos y Apariencia abiertas; el resto cerradas', () => {
    renderProps('column');
    expect(expanded('Datos')).toBe('true');
    expect(expanded('Apariencia')).toBe('true');
    for (const n of ['Leyenda y etiquetas', 'Ejes y formato', 'Referencias', 'Avanzado']) {
      expect(expanded(n)).toBe('false');
    }
    screen.getByText('Abrir editor de datos');
    screen.getByText('Título del Gráfico');
    screen.getByText('Paleta de Colores');
  });

  it('los controles de las secciones cerradas no están en el DOM hasta abrirlas', () => {
    renderProps('column');
    expect(screen.queryByText('Mostrar Leyenda')).toBeNull();
    expect(screen.queryByText('Título Eje X')).toBeNull();
    expect(screen.queryByText('Modo de Apilado')).toBeNull();
    fireEvent.click(header('Leyenda y etiquetas')!);
    screen.getByText('Mostrar Leyenda');
    fireEvent.click(header('Ejes y formato')!);
    screen.getByText('Título Eje X');
    screen.getByText('Formato Numérico (Eje / Tooltip)');
    fireEvent.click(header('Avanzado')!);
    screen.getByText('Modo de Apilado');
    screen.getByText('Exportar Imagen (PNG/SVG)');
  });

  it('columna: Referencias con líneas y bandas; sin elementos no hay badge', () => {
    renderProps('column');
    expect(header('Referencias')).not.toBeNull();
    expect(header('Referencias')!.textContent).toBe('Referencias');
    fireEvent.click(header('Referencias')!);
    screen.getByText('Líneas de Referencia / Meta');
    screen.getByText('Bandas de Referencia (Rango)');
  });

  it('donut: no hay sección Referencias (sin ejes) y Ejes solo trae el formato', () => {
    renderProps('donut');
    expect(header('Referencias')).toBeNull();
    fireEvent.click(header('Ejes y formato')!);
    screen.getByText('Formato Numérico (Eje / Tooltip)');
    expect(screen.queryByText('Título Eje X')).toBeNull();
    fireEvent.click(header('Leyenda y etiquetas')!);
    screen.getByText('Mostrar Total en el Centro');
    fireEvent.click(header('Avanzado')!);
    screen.getByText('Apertura Angular');
  });

  it('línea: Avanzado trae la interpolación de curva', () => {
    renderProps('line');
    fireEvent.click(header('Avanzado')!);
    screen.getByText('Interpolación de Curva');
  });

  it('histograma: Avanzado trae los intervalos (bins)', () => {
    renderProps('histogram');
    fireEvent.click(header('Avanzado')!);
    screen.getByText('Número de Intervalos (Bins)');
  });

  it('recuerda la sección abierta entre montajes (localStorage)', () => {
    renderProps('column');
    fireEvent.click(header('Ejes y formato')!);
    cleanup();
    renderProps('column');
    expect(expanded('Ejes y formato')).toBe('true');
  });

  it('Apariencia agrupa paleta, esquinas, fondo, sombra y animación', () => {
    renderProps('column', { animar: true });
    for (const t of [
      'Paleta de Colores',
      'Paleta Personalizada',
      'Radio de Esquinas (px)',
      'Fuente Tipográfica',
      'Fondo',
      'Sombra Sutil',
      'Duración de Animación (ms)',
    ]) {
      screen.getByText(t);
    }
  });
});
