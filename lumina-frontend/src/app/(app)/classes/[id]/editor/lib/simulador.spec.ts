import { describe, expect, it } from 'vitest';
import type { PasoTraza } from '@lumina/interactions';
import type { VariableDef } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

import type { RegistroEvento } from '@/lib/interaction-runtime';
import {
  MAX_REGISTROS,
  agregarRegistro,
  contextoDescripcionMazo,
  describirEventoRegistrado,
  pasosVisibles,
} from './simulador';

const bloque = (id: string, tipo = 'boton') => ({ tipo, id }) as unknown as Block;
const variables: VariableDef[] = [{ id: 'v1', nombre: 'Intentos', tipo: 'numero', valorInicial: 0 }];
const ctx = contextoDescripcionMazo({
  variables,
  etiquetaTipo: (b) => (b.tipo === 'boton' ? 'Botón' : 'Texto'),
  slides: [
    { id: 's1', titulo: 'Inicio', bloques: [bloque('b0', 'texto'), bloque('b1')] },
    { id: 's2', capas: [{ id: 'c1', nombre: 'Pista', bloques: [bloque('b2')] }] },
  ],
});

const paso = (resultado: PasoTraza['resultado']): PasoTraza => ({
  reglaId: 'r',
  evento: { tipo: 'clic' },
  profundidad: 0,
  evaluada: true,
  resultado,
  motivo: '',
  acciones: 0,
});
const registro = (id: number, pasos: PasoTraza[] = []): RegistroEvento => ({
  id,
  evento: { tipo: 'clic', bloqueId: 'b1', slideId: 's1' },
  pasos,
  avisos: [],
  efectos: [],
  variables: {},
});

describe('contextoDescripcionMazo', () => {
  it('nombra variables, bloques (con posición), capas y slides; lo desconocido es undefined', () => {
    expect(ctx.nombreVariable('v1')).toBe('Intentos');
    expect(ctx.nombreBloque('b1')).toBe('Botón (elemento 2)');
    expect(ctx.nombreBloque('b2')).toBe('Botón (capa «Pista»)');
    expect(ctx.nombreCapa('c1')).toBe('Pista');
    expect(ctx.tituloSlide('s1')).toBe('Slide 1 — Inicio');
    expect(ctx.tituloSlide('s2')).toBe('Slide 2');
    expect(ctx.nombreBloque('x')).toBeUndefined();
  });
});

describe('describirEventoRegistrado', () => {
  it('dice qué pasó y dónde', () => {
    expect(describirEventoRegistrado(registro(1), ctx)).toBe(
      'Se hace clic · Botón (elemento 2) · Slide 1 — Inicio',
    );
  });
  it('un cambio de variable nombra la variable', () => {
    const r: RegistroEvento = {
      ...registro(1),
      evento: { tipo: 'cambio_variable', slideId: 's1', detalle: { variableId: 'v1' } },
    };
    expect(describirEventoRegistrado(r, ctx)).toContain('«Intentos»');
  });
});

describe('pasosVisibles', () => {
  const r = registro(1, [paso('disparada'), paso('no_coincide'), paso('inactiva'), paso('no_cumple')]);
  it('por defecto oculta lo que no coincide o está desactivado', () => {
    expect(pasosVisibles(r, false).map((p) => p.resultado)).toEqual(['disparada', 'no_cumple']);
  });
  it('con «ver todos» muestra todo', () => {
    expect(pasosVisibles(r, true)).toHaveLength(4);
  });
});

describe('agregarRegistro', () => {
  it('conserva solo los más recientes y no muta la lista', () => {
    let lista: RegistroEvento[] = [];
    const original = lista;
    for (let i = 0; i < MAX_REGISTROS + 5; i++) lista = agregarRegistro(lista, registro(i));
    expect(original).toEqual([]);
    expect(lista).toHaveLength(MAX_REGISTROS);
    expect(lista[0]?.id).toBe(5);
    expect(lista.at(-1)?.id).toBe(MAX_REGISTROS + 4);
  });
});
