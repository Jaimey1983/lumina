import { describe, expect, it } from 'vitest';

import type { Block } from '@/types/slide.types';
import type { TabsWidget } from '@/types/widget.types';
import { DEFAULT_WIDGET_SLIDE_VISIBILIDAD } from '@/types/widget.types';

import { remintBlockChildIds } from './widget-clone';

function minimalTabs(id: string, fichas: TabsWidget['fichas']): TabsWidget & { id: string } {
  return {
    tipo: 'tabs',
    id,
    tituloWidget: '',
    subtituloWidget: '',
    instruccion: '',
    configuracion: {
      numeroFichas: 2,
      fichaActiva: 0,
      layoutId: 'solo-texto',
      colorFondoContenedor: '#fff',
      opacidadFondoContenedor: 1,
      paddingContenedor: 8,
      espacioContenido: 8,
      mostrarTituloWidget: false,
      mostrarSubtitulo: false,
      mostrarInstruccion: false,
      defaultsSlide: DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
    },
    fichas,
  };
}

describe('remintBlockChildIds', () => {
  it('Tabs: fichas y bloques internos reciben IDs nuevos; el id del widget no cambia', () => {
    const original = minimalTabs('widget-1', [
      {
        id: 'ficha-a',
        etiqueta: 'FICHA 01',
        encabezado: 'A',
        cuerpo: '',
        bloques: [{ id: 'txt-a', tipo: 'texto', contenido: 'hola', x: 0, y: 0, ancho: 50 }],
      },
      {
        id: 'ficha-b',
        etiqueta: 'FICHA 02',
        encabezado: 'B',
        cuerpo: '',
      },
    ]);

    const reminted = remintBlockChildIds(original) as TabsWidget & { id: string };

    expect(reminted.id).toBe('widget-1');
    expect(reminted.fichas).toHaveLength(2);
    expect(reminted.fichas[0]?.id).not.toBe('ficha-a');
    expect(reminted.fichas[1]?.id).not.toBe('ficha-b');
    expect(reminted.fichas[0]?.id).not.toBe(reminted.fichas[1]?.id);
    expect(reminted.fichas[0]?.bloques?.[0]?.id).not.toBe('txt-a');
    expect(reminted.fichas[0]?.bloques?.[0]?.contenido).toBe('hola');
    expect(original.fichas[0]?.id).toBe('ficha-a');
  });

  it('dos copias del mismo Tabs reciben IDs distintos entre sí y del original', () => {
    const original = minimalTabs('widget-1', [
      { id: 'ficha-a', etiqueta: 'FICHA 01', encabezado: 'A', cuerpo: '' },
      { id: 'ficha-b', etiqueta: 'FICHA 02', encabezado: 'B', cuerpo: '' },
    ]);
    const first = remintBlockChildIds(structuredClone(original)) as TabsWidget;
    const second = remintBlockChildIds(structuredClone(original)) as TabsWidget;

    expect(first.fichas[0]?.id).not.toBe('ficha-a');
    expect(second.fichas[0]?.id).not.toBe('ficha-a');
    expect(first.fichas[0]?.id).not.toBe(second.fichas[0]?.id);
    expect(first.fichas[1]?.id).not.toBe(second.fichas[1]?.id);
  });

  it('Flip Cards: tarjetas reciben IDs nuevos', () => {
    const original = {
      tipo: 'flip-cards',
      tarjetas: [
        {
          id: 'card-a',
          frente: { titulo: 'A', cuerpo: '' },
          reverso: { titulo: '', cuerpo: '' },
        },
        {
          id: 'card-b',
          frente: { titulo: 'B', cuerpo: '' },
          reverso: { titulo: '', cuerpo: '' },
        },
      ],
    } as Block;

    const reminted = remintBlockChildIds(structuredClone(original)) as Extract<
      Block,
      { tipo: 'flip-cards' }
    >;

    expect(reminted.tarjetas[0]?.id).not.toBe('card-a');
    expect(reminted.tarjetas[1]?.id).not.toBe('card-b');
    expect(reminted.tarjetas[0]?.id).not.toBe(reminted.tarjetas[1]?.id);
    expect((original as { tarjetas: { id: string }[] }).tarjetas[0]?.id).toBe('card-a');
  });

  it('Popup: el overlay recibe un id nuevo', () => {
    const original = {
      tipo: 'popup',
      overlay: { id: 'ov-1', etiqueta: '', encabezado: 'Hola', cuerpo: '' },
    } as Block;

    const reminted = remintBlockChildIds(structuredClone(original)) as Extract<
      Block,
      { tipo: 'popup' }
    >;

    expect(reminted.overlay.id).not.toBe('ov-1');
    expect((original as { overlay: { id: string } }).overlay.id).toBe('ov-1');
  });

  it('columnas: reminta el id de un widget anidado y sus hijos', () => {
    const nested = minimalTabs('nested-tabs', [
      { id: 'col-ficha-1', etiqueta: '1', encabezado: '', cuerpo: '' },
      { id: 'col-ficha-2', etiqueta: '2', encabezado: '', cuerpo: '' },
    ]);

    const columns = {
      tipo: 'columnas' as const,
      columnas: [[nested as Block]],
    } as Block;

    const reminted = remintBlockChildIds(columns) as Extract<Block, { tipo: 'columnas' }>;
    const child = reminted.columnas[0]?.[0] as TabsWidget & { id: string };

    expect(child.tipo).toBe('tabs');
    expect(child.id).not.toBe('nested-tabs');
    expect(child.fichas[0]?.id).not.toBe('col-ficha-1');
  });
});
