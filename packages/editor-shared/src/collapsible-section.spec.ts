import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  CollapsibleSection,
  type CollapsibleSectionProps,
  readStoredOpen,
  writeStoredOpen,
} from '@lumina/ui/collapsible-section';

// Entorno node (sin DOM): se prueba el render inicial en servidor y las
// funciones de storage con un Storage falso. El clic/teclado del encabezado lo
// resuelve Radix `Collapsible` (ya cubierto por su propio paquete).

function html(props: Partial<Omit<CollapsibleSectionProps, 'children'>> = {}) {
  return renderToStaticMarkup(
    createElement(CollapsibleSection, {
      title: 'Ejes',
      ...props,
      children: createElement('p', null, 'CONTENIDO'),
    }),
  );
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('CollapsibleSection (render inicial)', () => {
  it('abierta por defecto: aria-expanded=true y contenido presente', () => {
    const out = html();
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('CONTENIDO');
  });

  it('defaultOpen=false: aria-expanded=false y el contenido no está en el DOM', () => {
    const out = html({ defaultOpen: false });
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain('CONTENIDO');
  });

  it('muestra el título y el badge', () => {
    const out = html({ badge: 18 });
    expect(out).toContain('Ejes');
    expect(out).toContain('>18<');
  });

  it('sin badge no renderiza la pastilla', () => {
    expect(html()).not.toContain('rounded-full');
    expect(html({ badge: null })).not.toContain('rounded-full');
  });

  it('con storageKey no rompe el render en servidor (sin localStorage)', () => {
    expect(() => html({ storageKey: 'test.ejes', defaultOpen: false })).not.toThrow();
  });
});

describe('storage de la preferencia', () => {
  it('lee abierta/cerrada y null si no hay valor', () => {
    const s = fakeStorage({ 'lumina.panel.a': '1', 'lumina.panel.b': '0' });
    expect(readStoredOpen('a', s)).toBe(true);
    expect(readStoredOpen('b', s)).toBe(false);
    expect(readStoredOpen('c', s)).toBeNull();
  });

  it('ignora valores desconocidos', () => {
    expect(readStoredOpen('a', fakeStorage({ 'lumina.panel.a': 'x' }))).toBeNull();
  });

  it('escribe con el prefijo lumina.panel.', () => {
    const s = fakeStorage();
    writeStoredOpen('elementos.diagramas', true, s);
    writeStoredOpen('elementos.quimica', false, s);
    expect(s.data).toEqual({
      'lumina.panel.elementos.diagramas': '1',
      'lumina.panel.elementos.quimica': '0',
    });
  });

  it('no lanza si el storage lanza (modo privado, bloqueado)', () => {
    const roto = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readStoredOpen('a', roto)).toBeNull();
    expect(() => writeStoredOpen('a', true, roto)).not.toThrow();
  });

  it('no lanza si no existe localStorage global', () => {
    expect(readStoredOpen('a')).toBeNull();
    expect(() => writeStoredOpen('a', true)).not.toThrow();
  });
});
