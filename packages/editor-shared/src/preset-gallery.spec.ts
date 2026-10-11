import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  PresetGallery,
  aplicarPreset,
  presetCoincide,
  type GalleryPreset,
} from './preset-gallery.js';

// Entorno node (sin DOM): se prueba la lógica de mezcla/coincidencia y el render
// inicial en servidor. El clic sobre un botón es un <button> nativo.
interface Estado {
  titulo: string;
  items: string[];
  configuracion: { duracion: number; mostrar: boolean; borde: { grosor: number; color: string } };
}

const base: Estado = {
  titulo: 'Hola',
  items: ['a', 'b'],
  configuracion: { duracion: 4000, mostrar: true, borde: { grosor: 2, color: '#000000' } },
};

const rapido: GalleryPreset = {
  id: 'rapido',
  label: 'Rápido',
  description: 'Giro de 2 s',
  estadoPatch: { configuracion: { duracion: 2000, borde: { grosor: 1 } } },
};

describe('aplicarPreset', () => {
  it('mezcla los objetos anidados en profundidad sin pisar las demás claves', () => {
    const r = aplicarPreset(base, rapido);
    expect(r.configuracion).toEqual({
      duracion: 2000,
      mostrar: true,
      borde: { grosor: 1, color: '#000000' },
    });
    expect(r.titulo).toBe('Hola');
  });

  it('no muta el estado recibido', () => {
    const copia = structuredClone(base);
    aplicarPreset(base, rapido);
    expect(base).toEqual(copia);
  });

  it('reemplaza los arreglos enteros y descarta los valores undefined', () => {
    const r = aplicarPreset(base, {
      id: 'x',
      label: 'X',
      estadoPatch: { items: ['z'], titulo: undefined },
    });
    expect(r.items).toEqual(['z']);
    expect(r.titulo).toBe('Hola');
  });
});

describe('presetCoincide', () => {
  it('es verdadero cuando el estado ya contiene el parche', () => {
    expect(presetCoincide(aplicarPreset(base, rapido), rapido)).toBe(true);
  });

  it('es falso cuando algún valor del parche difiere', () => {
    expect(presetCoincide(base, rapido)).toBe(false);
  });

  it('un parche vacío nunca figura como activo', () => {
    expect(presetCoincide(base, { id: 'v', label: 'V', estadoPatch: {} })).toBe(false);
  });
});

describe('PresetGallery', () => {
  const props = { estado: base, onSelect: vi.fn(), storageKey: 'widget.demo.estilos' };

  it('sin presets (o vacío) no renderiza nada', () => {
    expect(renderToStaticMarkup(createElement(PresetGallery, { ...props, presets: undefined }))).toBe('');
    expect(renderToStaticMarkup(createElement(PresetGallery, { ...props, presets: [] }))).toBe('');
  });

  it('renderiza un botón por preset dentro de la sección «Estilos», con el conteo', () => {
    const html = renderToStaticMarkup(
      createElement(PresetGallery, {
        ...props,
        presets: [rapido, { id: 'lento', label: 'Lento', estadoPatch: { titulo: 'x' } }],
      }),
    );
    expect(html).toContain('Estilos');
    expect(html).toContain('data-preset-id="rapido"');
    expect(html).toContain('data-preset-id="lento"');
    expect(html).toContain('Giro de 2 s');
  });

  it('marca con aria-pressed el preset que ya coincide con el estado', () => {
    const html = renderToStaticMarkup(
      createElement(PresetGallery, {
        ...props,
        estado: aplicarPreset(base, rapido),
        presets: [rapido, { id: 'lento', label: 'Lento', estadoPatch: { titulo: 'x' } }],
      }),
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*data-preset-id="rapido"/);
    expect(html).toMatch(/aria-pressed="false"[^>]*data-preset-id="lento"/);
  });
});
