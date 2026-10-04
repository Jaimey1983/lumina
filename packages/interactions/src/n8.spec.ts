// Etapa N / N8: traza del motor y problemas de interacción.
import { describe, expect, it } from 'vitest';
import type { Regla } from '@lumina/types/interaction';
import { crearEstadoInicial } from './estado.js';
import { procesarEvento } from './motor.js';
import { problemasDeInteraccion } from './problemas.js';
import { bloque, cmp, deBloque, deSlide, lit, num, regla, slide, variable } from './prueba-utils.js';
import type { EventoMotor, ReglaAplicable } from './tipos.js';

const variables = [num('intentos')];
const sumar = { tipo: 'sumar_variable', variableId: 'intentos', cantidad: 1 } as const;
const clic = (bloqueId: string, slideId = 's1'): EventoMotor => ({ tipo: 'clic', bloqueId, slideId });
const ctx = { variables };

const mazo: ReglaAplicable[] = [
  deBloque(regla('r1', 'clic', [sumar]), 'b1'),
  deBloque(regla('r2', 'clic', [{ tipo: 'siguiente' }], [cmp(variable('intentos'), '>=', lit(3))]), 'b1'),
  deBloque(regla('r3', 'clic', [sumar], [], false), 'b1'),
  deBloque(regla('r4', 'clic', [sumar]), 'otro'),
  deSlide(regla('r5', 'al_entrar_slide', [sumar])),
];

describe('traza', () => {
  it('apagada: no hay traza y el resultado es el mismo que encendida (paridad)', () => {
    const estado = crearEstadoInicial(variables, []);
    for (const ev of [clic('b1'), clic('otro'), { tipo: 'al_entrar_slide', slideId: 's1' } as EventoMotor]) {
      const sin = procesarEvento(mazo, estado, ev, ctx);
      const con = procesarEvento(mazo, estado, ev, ctx, {}, { traza: true });
      expect(sin.traza).toBeUndefined();
      expect(con.traza).toBeDefined();
      const resto = { ...con, traza: undefined };
      delete resto.traza;
      expect(resto).toEqual(sin);
    }
  });

  it('explica cada regla candidata: disparada, no cumple, inactiva y no coincide', () => {
    const estado = crearEstadoInicial(variables, []);
    const { traza } = procesarEvento(mazo, estado, clic('b1'), ctx, {}, { traza: true });
    const por = Object.fromEntries((traza ?? []).map((p) => [p.reglaId, p]));
    expect(por.r1).toMatchObject({ resultado: 'disparada', evaluada: true, acciones: 1 });
    // r1 sube intentos a 1 antes de evaluar r2 (estado vivo): 1 >= 3 es falso.
    expect(por.r2).toMatchObject({ resultado: 'no_cumple', evaluada: true, acciones: 0 });
    expect(por.r2?.motivo).toContain('intentos');
    expect(por.r2?.motivo).toContain('vale 1');
    expect(por.r3).toMatchObject({ resultado: 'inactiva', evaluada: false });
    expect(por.r4).toMatchObject({ resultado: 'no_coincide', evaluada: false });
    expect(por.r4?.motivo).toContain('otro elemento');
    // r5 es de otro tipo de evento: no es candidata.
    expect(por.r5).toBeUndefined();
  });

  it('usa los nombres de la descripción y reporta la rama «si no»', () => {
    const r: Regla = { ...regla('rs', 'clic', [], [cmp(variable('intentos'), '>', lit(5))]), sino: [sumar] };
    const { traza } = procesarEvento(
      [deBloque(r, 'b1')],
      crearEstadoInicial(variables, []),
      clic('b1'),
      ctx,
      {},
      {
        traza: true,
        descripcion: {
          nombreVariable: () => 'Intentos',
          nombreBloque: () => undefined,
          tituloSlide: () => undefined,
          nombreCapa: () => undefined,
        },
      },
    );
    expect(traza?.[0]).toMatchObject({ resultado: 'sino', acciones: 1 });
    expect(traza?.[0]?.motivo).toContain('«Intentos»');
    expect(traza?.[0]?.motivo).not.toContain('««');
  });

  it('una condición rota se distingue de una que dio falso', () => {
    const r = regla('rota', 'clic', [sumar], [cmp(variable('borrada'), '>', lit(0))]);
    const { traza, estado } = procesarEvento([deBloque(r, 'b1')], crearEstadoInicial(variables, []), clic('b1'), ctx, {}, { traza: true });
    expect(traza?.[0]?.resultado).toBe('condicion_rota');
    expect(estado.variables.intentos).toBe(0);
  });

  it('registra los eventos encadenados y el ciclo cortado', () => {
    const r = regla('c', 'cambio_variable', [sumar]);
    const rr: Regla = { ...r, parametro: 'intentos' };
    const { traza } = procesarEvento(
      [deSlide(rr)],
      crearEstadoInicial(variables, []),
      { tipo: 'cambio_variable', slideId: 's1', detalle: { variableId: 'intentos' } },
      ctx,
      {},
      { traza: true },
    );
    expect(traza?.some((p) => p.resultado === 'ciclo_cortado')).toBe(true);
    expect(traza?.some((p) => p.profundidad > 0)).toBe(true);
  });
});

describe('problemasDeInteraccion', () => {
  const eventosDeBloque = (b: unknown): readonly ('clic' | 'visitado')[] =>
    (b as { tipo: string }).tipo === 'texto' ? [] : ['clic'];
  const boton = (id: string, extra: object = {}) => ({ ...bloque(id), tipo: 'boton', ...extra }) as never;

  it('un mazo sano no tiene problemas', () => {
    const s = slide('s1', {
      bloques: [boton('b1', { disparadores: [regla('r', 'clic', [sumar])] })],
    });
    expect(problemasDeInteraccion([s], variables, { eventosDeBloque })).toEqual([]);
  });

  it('referencia rota (creada a propósito) y evento que nadie emite', () => {
    const s = slide('s1', {
      bloques: [
        boton('b1', {
          disparadores: [
            regla('rota', 'clic', [{ tipo: 'mostrar', bloqueId: 'no-existe' }, sumar]),
            regla('imposible', 'visitado', [sumar]),
          ],
        }),
      ],
      reglas: [regla('slide-imposible', 'respuesta_correcta', [sumar])],
    });
    const p = problemasDeInteraccion([s], variables, { eventosDeBloque });
    expect(p.find((x) => x.reglaId === 'rota')).toMatchObject({ codigo: 'referencia_rota', severidad: 'error', bloqueId: 'b1' });
    // Ningún mensaje al docente lleva un id crudo.
    expect(p.find((x) => x.reglaId === 'rota')?.mensaje).not.toContain('no-existe');
    expect(p.find((x) => x.reglaId === 'imposible')).toMatchObject({ codigo: 'evento_imposible', bloqueId: 'b1' });
    expect(p.find((x) => x.reglaId === 'slide-imposible')).toMatchObject({ codigo: 'evento_imposible', slideId: 's1' });
  });

  it('entorno y al_entrar_slide siempre son posibles', () => {
    const s = slide('s1', {
      bloques: [boton('b1')],
      reglas: [regla('a', 'al_entrar_slide', [sumar]), { ...regla('b', 'tecla', [sumar]), parametro: 'Enter' }],
    });
    expect(problemasDeInteraccion([s], variables, { eventosDeBloque }).filter((x) => x.codigo === 'evento_imposible')).toEqual([]);
  });

  it('variable sin uso (salvo que se use en un texto)', () => {
    const s = slide('s1', { bloques: [boton('b1')] });
    const p = problemasDeInteraccion([s], variables, { eventosDeBloque });
    expect(p).toEqual([expect.objectContaining({ codigo: 'variable_sin_uso', variableId: 'intentos', severidad: 'aviso' })]);
    expect(problemasDeInteraccion([s], variables, { eventosDeBloque, variablesEnTexto: new Set(['intentos']) })).toEqual([]);
  });

  it('ciclo potencial: una regla que cambia la variable que la dispara', () => {
    const r: Regla = { ...regla('ciclo', 'cambio_variable', [sumar]), parametro: 'intentos' };
    const s = slide('s1', { bloques: [boton('b1')], reglas: [r] });
    const p = problemasDeInteraccion([s], variables, { eventosDeBloque });
    expect(p.filter((x) => x.codigo === 'ciclo_potencial').map((x) => x.reglaId)).toEqual(['ciclo']);
  });

  it('ciclo entre dos reglas; una cadena sin vuelta no es ciclo', () => {
    const vs = [num('a'), num('b')];
    const sumaA = { tipo: 'sumar_variable', variableId: 'a', cantidad: 1 } as const;
    const sumaB = { tipo: 'sumar_variable', variableId: 'b', cantidad: 1 } as const;
    const ra: Regla = { ...regla('ra', 'cambio_variable', [sumaB]), parametro: 'a' };
    const rb: Regla = { ...regla('rb', 'cambio_variable', [sumaA]), parametro: 'b' };
    const cadena: Regla = { ...regla('rc', 'cambio_variable', [sumaB]), parametro: 'a' };
    const conCiclo = slide('s1', { bloques: [boton('b1')], reglas: [ra, rb] });
    const sinCiclo = slide('s1', { bloques: [boton('b1')], reglas: [cadena] });
    const ids = (s: ReturnType<typeof slide>) =>
      problemasDeInteraccion([s], vs, { eventosDeBloque, variablesEnTexto: new Set(['a', 'b']) })
        .filter((x) => x.codigo === 'ciclo_potencial')
        .map((x) => x.reglaId);
    expect(ids(conCiclo)).toEqual(['ra', 'rb']);
    expect(ids(sinCiclo)).toEqual([]);
  });
});
