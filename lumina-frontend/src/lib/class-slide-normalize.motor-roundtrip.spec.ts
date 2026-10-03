import { describe, expect, it } from 'vitest';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block } from '@lumina/types/slide';
import type { Regla } from '@lumina/types/interaction';
import './element-registry-bootstrap';
import { elementRegistry } from '@lumina/element-kit-core';
import {
  classSlideToRendererSlide,
  sanitizeSlideContentForPersistence,
} from './class-slide-normalize';

/**
 * Etapa K / K6 — GUARDA DE IDA Y VUELTA.
 *
 * Una regla guardada sobre un bloque cuyo `id`/`disparadores`/`estado`/`ocultoInicial`
 * se pierde en el siguiente autoguardado es una regla huérfana silenciosa. Este spec
 * recorre TODOS los tipos registrados en `elementRegistry` y exige que esos campos
 * sobrevivan tanto a hidratar (`classSlideToRendererSlide`) como a
 * persistir (`sanitizeSlideContentForPersistence`). Si falla un tipo, se corrige
 * su `normalize*`, no este spec.
 */
const REGLA: Regla = {
  id: 'r-guarda',
  evento: 'clic',
  // N1: una regla con condición «entre», variable de sistema y rama «si no» debe
  // sobrevivir igual que una simple (si algún `normalize*` la reconstruyera, se perdería).
  condiciones: [
    {
      tipo: 'entre',
      valor: { tipo: 'sistema', clave: 'slide_numero' },
      desde: { tipo: 'literal', valor: 1 },
      hasta: { tipo: 'literal', valor: 3 },
    },
  ],
  acciones: [{ tipo: 'siguiente' }],
  sino: [{ tipo: 'anterior' }],
  activa: true,
};

type Definicion = {
  tipo: string;
  crearPorDefecto: () => unknown;
  catalogo?: { familia?: string };
};

function bloqueDe(def: Definicion): Block {
  const estado = def.crearPorDefecto();
  const base: Record<string, unknown> =
    def.catalogo?.familia === 'actividad'
      ? { tipo: 'actividad', actividad: estado }
      : { ...(estado as Record<string, unknown>) };
  return {
    ...base,
    id: 'bloque-guarda',
    disparadores: [REGLA],
    estado: 'visitado',
    ocultoInicial: true,
  } as unknown as Block;
}

function apiSlide(bloques: Block[]): ApiSlide {
  return {
    id: 's1',
    order: 0,
    type: 'CONTENT',
    title: 'x',
    content: { bloques },
  } as ApiSlide;
}

const definiciones = (elementRegistry.listar() as readonly Definicion[]).filter(
  (d) => typeof d.crearPorDefecto === 'function',
);

function campos(b: Block) {
  const r = b as unknown as {
    id?: unknown;
    disparadores?: unknown;
    estado?: unknown;
    ocultoInicial?: unknown;
  };
  return { id: r.id, disparadores: r.disparadores, estado: r.estado, ocultoInicial: r.ocultoInicial };
}

describe('K6 · el motor sobrevive a hidratar y persistir, para todos los tipos', () => {
  it('el registro tiene los 45 elementos', () => {
    expect(definiciones.length).toBeGreaterThanOrEqual(45);
  });

  it.each(definiciones.map((d) => [d.tipo, d] as const))(
    '%s conserva id, disparadores, estado y ocultoInicial',
    (_tipo, def) => {
      const bloque = bloqueDe(def);
      const esperado = {
        id: 'bloque-guarda',
        disparadores: [REGLA],
        estado: 'visitado',
        ocultoInicial: true,
      };

      const hidratado = classSlideToRendererSlide(apiSlide([bloque])).bloques ?? [];
      expect(hidratado, 'hidratar').toHaveLength(1);
      expect(campos(hidratado[0]!), 'hidratar').toEqual(esperado);

      const persistido = sanitizeSlideContentForPersistence({ bloques: [bloque] });
      const bloques = (persistido?.bloques ?? []) as Block[];
      expect(bloques, 'persistir').toHaveLength(1);
      expect(campos(bloques[0]!), 'persistir').toEqual(esperado);
    },
  );

  it('los bloques HIJOS de «columnas» también conservan el motor', () => {
    const textoDef = definiciones.find((d) => d.tipo === 'texto')!;
    const hijo = bloqueDe(textoDef);
    const columnas = { tipo: 'columnas', columnas: [[hijo], []] } as unknown as Block;
    const esperado = {
      id: 'bloque-guarda',
      disparadores: [REGLA],
      estado: 'visitado',
      ocultoInicial: true,
    };
    const hidratado = (classSlideToRendererSlide(apiSlide([columnas])).bloques ?? [])[0] as unknown as {
      columnas: Block[][];
    };
    expect(campos(hidratado.columnas[0]![0]!)).toEqual(esperado);
    const persistido = sanitizeSlideContentForPersistence({ bloques: [columnas] });
    const col = (persistido?.bloques as unknown as Array<{ columnas: Block[][] }>)[0]!;
    expect(campos(col.columnas[0]![0]!)).toEqual(esperado);
  });

  it('K8a: classSlideToRendererSlide conserva capas y el ocultoInicial de sus bloques', () => {
    const textoDef = definiciones.find((d) => d.tipo === 'texto')!;
    const oculto = bloqueDe(textoDef);
    const api = {
      id: 's1',
      order: 0,
      type: 'CONTENT',
      title: 'x',
      content: {
        bloques: [],
        capas: [
          {
            id: 'c1',
            nombre: 'Pista',
            modal: true,
            visibleInicial: true,
            bloques: [oculto],
          },
        ],
      },
    } as ApiSlide;
    const slide = classSlideToRendererSlide(api);
    expect(slide.capas).toHaveLength(1);
    expect(slide.capas?.[0]).toMatchObject({
      id: 'c1',
      nombre: 'Pista',
      modal: true,
      visibleInicial: true,
    });
    expect(campos(slide.capas![0]!.bloques[0]!)).toEqual({
      id: 'bloque-guarda',
      disparadores: [REGLA],
      estado: 'visitado',
      ocultoInicial: true,
    });
  });
});
