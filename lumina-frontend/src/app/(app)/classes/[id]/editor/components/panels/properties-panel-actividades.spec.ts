import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Block } from '@lumina/types/slide';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import { renderActividadProperties } from './properties-panel-actividades';

const noop = async () => {};

/** Busca, sin renderizar, el elemento con esa clave dentro del árbol que devuelve el panel. */
function buscarPorClave(nodo: ReactNode, clave: string): ReactElement<{ onChange: (a: unknown) => void }> | null {
  if (Array.isArray(nodo)) {
    for (const n of nodo) {
      const r = buscarPorClave(n, clave);
      if (r) return r;
    }
    return null;
  }
  if (!isValidElement(nodo)) return null;
  if (nodo.key === clave) return nodo as ReactElement<{ onChange: (a: unknown) => void }>;
  return buscarPorClave((nodo.props as { children?: ReactNode }).children, clave);
}
const AVISOS_SIN_PANEL = ['se configuran en el panel lateral', 'no tiene opciones de configuración'];

/** Tipos de la familia actividad que crean su estado por defecto (los que el docente puede insertar). */
const tiposActividad = elementRegistry
  .listar()
  .filter((d) => d.catalogo?.familia === 'actividad')
  .map((d) => d.tipo);

describe('panel de propiedades de actividades: despacho por elementRegistry', () => {
  it('hay actividades registradas, incluidas las nuevas (U14–U18)', () => {
    for (const t of ['relacionar_lineas', 'etiquetar_imagen', 'linea_tiempo', 'cloze_banco', 'problema_pasos']) {
      expect(tiposActividad).toContain(t);
    }
  });

  it.each(tiposActividad)('«%s» muestra su panel y no el aviso de «sin opciones»', (tipo) => {
    const def = elementRegistry.obtener(tipo)!;
    const actividad = def.crearPorDefecto() as Record<string, unknown>;
    const block = { id: 'b1', tipo: 'actividad', actividad } as unknown as Block;
    const el = renderActividadProperties({
      block,
      applyNow: noop,
      applyAnimaciones: noop,
      applyTransicion: noop,
      slide: null,
      motorSections: null,
    });
    expect(el).not.toBeNull();
    const html = renderToStaticMarkup(createElement('div', null, el));
    for (const aviso of AVISOS_SIN_PANEL) expect(html).not.toContain(aviso);
    expect(html.length).toBeGreaterThan(300);
  });

  it('monta un panel por bloque (clave = id) para no arrastrar el borrador de otra actividad', () => {
    const def = elementRegistry.obtener('relacionar_lineas')!;
    const block = { id: 'bloque-7', tipo: 'actividad', actividad: def.crearPorDefecto() } as unknown as Block;
    const el = renderActividadProperties({
      block,
      applyNow: noop,
      applyAnimaciones: noop,
      applyTransicion: noop,
      slide: null,
      motorSections: null,
    });
    const panel = buscarPorClave(el, 'bloque-7');
    expect(panel).not.toBeNull();
  });

  it('un envío tardío no escribe en otro bloque', async () => {
    const def = elementRegistry.obtener('relacionar_lineas')!;
    const block = { id: 'a', tipo: 'actividad', actividad: def.crearPorDefecto() } as unknown as Block;
    let aplicar: ((b: Block) => Block) | undefined;
    const el = renderActividadProperties({
      block,
      applyNow: async (fn) => {
        aplicar = fn;
      },
      applyAnimaciones: noop,
      applyTransicion: noop,
      slide: null,
      motorSections: null,
    });
    buscarPorClave(el, 'a')!.props.onChange({ tipo: 'relacionar_lineas', nuevo: true });
    const otro = { id: 'b', tipo: 'actividad', actividad: { tipo: 'relacionar_lineas' } } as unknown as Block;
    expect(aplicar!(otro)).toBe(otro);
    const mismo = aplicar!(block) as unknown as { actividad: { nuevo?: boolean } };
    expect(mismo.actividad.nuevo).toBe(true);
  });
});
