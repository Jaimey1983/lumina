import { describe, expect, it } from 'vitest';

import type { ActivityBlock, RuletaActivity } from '@/types/slide.types';

import { createDefaultRuletaWidget, normalizeRuletaBlock } from './ruleta-defaults';

const legadoG4: ActivityBlock = {
  tipo: 'actividad',
  actividad: {
    tipo: 'ruleta',
    configuracion: {
      colores: ['#111111', '#222222'],
      sonido: false,
      duracionGiro: 2000,
      mostrarGanador: true,
    },
    items: [
      { id: 'a', texto: 'Rojo' },
      { id: 'b', texto: 'Azul' },
    ],
  } satisfies RuletaActivity,
  marco: {
    izquierdaPct: 8,
    arribaPct: 12,
    anchoPct: 70,
    altoPct: 60,
  },
};

describe('normalizeRuletaBlock', () => {
  it('hidrata actividad G4 legado a widget sin perder ítems ni marco', () => {
    const widget = normalizeRuletaBlock(legadoG4);
    expect(widget.tipo).toBe('ruleta');
    expect(widget.items).toEqual([
      { id: 'a', texto: 'Rojo' },
      { id: 'b', texto: 'Azul' },
    ]);
    expect(widget.configuracion.duracionGiro).toBe(2000);
    expect(widget.x).toBe(8);
    expect(widget.y).toBe(12);
    expect(widget.ancho).toBe(70);
    expect(widget.alto).toBe(60);
  });

  it('hidrata un widget ya persistido', () => {
    const created = createDefaultRuletaWidget();
    const again = normalizeRuletaBlock(created);
    expect(again.items.length).toBeGreaterThanOrEqual(2);
    expect(again.tipo).toBe('ruleta');
  });

  it('rellena ítems si el JSON viene vacío o corrupto', () => {
    const widget = normalizeRuletaBlock({ tipo: 'ruleta', items: [] });
    expect(widget.items.length).toBeGreaterThanOrEqual(2);
    expect(widget.configuracion.colores.length).toBeGreaterThan(0);
  });
});
