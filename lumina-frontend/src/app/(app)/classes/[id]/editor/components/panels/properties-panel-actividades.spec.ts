import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Block } from '@lumina/types/slide';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import { renderActividadProperties } from './properties-panel-actividades';

const noop = async () => {};
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
});
