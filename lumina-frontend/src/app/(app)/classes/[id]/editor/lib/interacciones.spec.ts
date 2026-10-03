import { describe, expect, it } from 'vitest';
import { reglasConReferenciasRotas } from '@lumina/interactions';
import type { Block } from '@lumina/types/slide';

import {
  alternarRegla,
  aplicarPlantilla,
  describirRegla,
  quitarRegla,
  tipoDeElemento,
} from './interacciones';

const b = (tipo: string, extra: object = {}) => ({ tipo, ...extra }) as unknown as Block;
const idDe = (x: Block) => (x as { id?: string }).id;
const slideDe = (bloques: Block[], id = 's1') => ({ id, bloques });

describe('aplicarPlantilla (K7b)', () => {
  it('«botón navega» asigna id al botón (D8-a), crea la regla y quita la acción legada', () => {
    const bloques = [b('boton', { accion: 'siguiente' }), b('texto')];
    const out = aplicarPlantilla(bloques, 0, {
      tipo: 'boton-navega',
      evento: 'clic',
      destino: { tipo: 'slide', slideId: 's2' },
    });
    expect(idDe(out[0]!)).toBeTruthy();
    expect(idDe(out[1]!)).toBeUndefined(); // el resto no cambia
    expect(out[0]!.disparadores).toHaveLength(1);
    expect((out[0] as { accion: string }).accion).toBe('ninguna'); // no navega dos veces
    expect(reglasConReferenciasRotas([slideDe(out), { id: 's2' }], [])).toEqual([]);
  });

  it('no toca la acción URL del botón', () => {
    const out = aplicarPlantilla([b('boton', { accion: 'url', url: 'https://x' })], 0, {
      tipo: 'boton-navega',
      evento: 'clic',
      destino: { tipo: 'siguiente' },
    });
    expect((out[0] as { accion: string }).accion).toBe('url');
  });

  it('el contador pasa de alTerminar a una regla fin_contador', () => {
    const out = aplicarPlantilla([b('contador', { alTerminar: 'siguiente' })], 0, {
      tipo: 'boton-navega',
      evento: 'fin_contador',
      destino: { tipo: 'siguiente' },
    });
    expect((out[0] as { alTerminar: string }).alTerminar).toBe('ninguna');
    expect(out[0]!.disparadores?.[0]?.evento).toBe('fin_contador');
  });

  it('reaplicar la plantilla reemplaza la regla (no duplica)', () => {
    const una = aplicarPlantilla([b('boton')], 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'siguiente' } });
    const dos = aplicarPlantilla(una, 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'anterior' } });
    expect(dos[0]!.disparadores).toHaveLength(1);
    expect(dos[0]!.disparadores?.[0]?.acciones).toEqual([{ tipo: 'anterior' }]);
  });

  it('«refuerzo» pone la regla en la actividad', () => {
    const out = aplicarPlantilla([b('actividad')], 0, { tipo: 'refuerzo', slideRefuerzoId: 's9' });
    expect(out[0]!.disparadores?.[0]?.evento).toBe('respuesta_incorrecta');
    expect(reglasConReferenciasRotas([slideDe(out), { id: 's9' }], [])).toEqual([]);
  });

  it('«revelar» reparte una regla por hotspot y da ids a todos los que intervienen', () => {
    const bloques = [b('hotspot'), b('hotspot'), b('texto'), b('texto')];
    const out = aplicarPlantilla(bloques, 0, { tipo: 'revelar', hotspotIndices: [0, 1], objetivoIndex: 2 });
    expect([0, 1, 2].every((i) => idDe(out[i]!))).toBe(true);
    expect(idDe(out[3]!)).toBeUndefined();
    expect(out[0]!.disparadores).toHaveLength(1);
    expect(out[1]!.disparadores).toHaveLength(1);
    expect(out[2]!.disparadores).toBeUndefined();
    expect(reglasConReferenciasRotas([slideDe(out)], [])).toEqual([]);
  });

  it('no muta los bloques de entrada', () => {
    const bloques = [b('boton')];
    const antes = JSON.stringify(bloques);
    aplicarPlantilla(bloques, 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'siguiente' } });
    expect(JSON.stringify(bloques)).toBe(antes);
  });
});

describe('quitar / alternar', () => {
  const base = aplicarPlantilla([b('boton')], 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'siguiente' } });
  const reglaId = base[0]!.disparadores![0]!.id;
  it('alterna activa sin tocar nada más', () => {
    const off = alternarRegla(base, 0, reglaId, false);
    expect(off[0]!.disparadores?.[0]?.activa).toBe(false);
  });
  it('quitar la última regla elimina el campo disparadores', () => {
    const out = quitarRegla(base, 0, reglaId);
    expect('disparadores' in out[0]!).toBe(false);
  });
});

describe('describirRegla', () => {
  it('dice en castellano qué hace una regla', () => {
    const base = aplicarPlantilla([b('actividad')], 0, { tipo: 'refuerzo', slideRefuerzoId: 's9' });
    const txt = describirRegla(base[0]!.disparadores![0]!, () => 'Slide 3', () => 'x');
    expect(txt).toBe('Si responde mal → ir a Slide 3');
  });
});

describe('tipoDeElemento (N0: las actividades se registran por el tipo de la actividad)', () => {
  it('un bloque de actividad se identifica por actividad.tipo', () => {
    expect(tipoDeElemento(b('actividad', { actividad: { tipo: 'verdadero_falso' } }))).toBe('verdadero_falso');
  });
  it('los demás bloques se identifican por su propio tipo', () => {
    expect(tipoDeElemento(b('boton'))).toBe('boton');
    expect(tipoDeElemento(b('hotspot'))).toBe('hotspot');
  });
  it('una actividad sin tipo no revienta', () => {
    expect(tipoDeElemento(b('actividad'))).toBe('actividad');
  });
});

describe('describirRegla con las acciones de N2 y la rama «si no»', () => {
  it('describe las acciones nuevas y no omite «si no»', () => {
    const r = {
      id: 'r',
      evento: 'clic' as const,
      condiciones: [],
      activa: true,
      acciones: [
        { tipo: 'restar_variable' as const, variableId: 'v', cantidad: { tipo: 'literal' as const, valor: 1 } },
        { tipo: 'limpiar_variable' as const, variableId: 'v' },
      ],
      sino: [{ tipo: 'alternar_variable' as const, variableId: 'b' }],
    };
    expect(describirRegla(r, () => 'S', () => 'B')).toBe(
      'Al hacer clic → restar de una variable, reiniciar una variable · si no → invertir una variable (sí/no)',
    );
  });
});
