// Etapa N / N2: operaciones aritméticas, de texto y lógicas sobre variables.
import { describe, expect, it } from 'vitest';
import type { Accion, Regla } from '@lumina/types/interaction';
import { crearEstadoInicial } from './estado.js';
import { limpiarReferenciasABloque, referenciasA, remapearIds } from './integridad.js';
import { procesarEvento } from './motor.js';
import { bloque, bool, deBloque, lit, num, regla, slide, txt, variable } from './prueba-utils.js';
import { contextoDesdeSlides } from './recolectar.js';
import type { EstadoMotor, ReglaAplicable } from './tipos.js';
import { usosDeVariable } from './uso.js';
import { validarReglas } from './validar.js';
import { MAX_TEXTO_VARIABLE } from './variables.js';

const vars = [num('n', 10), num('m', 4), txt('t', 'Hola'), bool('b', true)];
const clic = { tipo: 'clic', bloqueId: 'b1', slideId: 's1' } as const;

function correr(accion: Accion, estado?: EstadoMotor, sistema?: Record<string, number>) {
  return procesarEvento(
    [deBloque(regla('r', 'clic', [accion]), 'b1')],
    estado ?? crearEstadoInicial(vars),
    clic,
    { variables: vars, ...(sistema ? { sistema } : {}) },
  );
}
const cod = (r: ReturnType<typeof correr>) => r.avisos.map((a) => a.codigo);

describe('restar, multiplicar y dividir', () => {
  it.each([
    ['restar_variable', 3, 7],
    ['multiplicar_variable', 3, 30],
    ['dividir_variable', 4, 2.5],
  ] as const)('%s por %s → %s', (tipo, cantidad, esperado) => {
    const r = correr({ tipo, variableId: 'n', cantidad: lit(cantidad) });
    expect(r.estado.variables.n).toBe(esperado);
    expect(r.avisos).toEqual([]);
  });

  it('la cantidad puede venir de otra variable', () => {
    const r = correr({ tipo: 'restar_variable', variableId: 'n', cantidad: variable('m') });
    expect(r.estado.variables.n).toBe(6);
  });

  it('la cantidad puede venir de una variable del sistema', () => {
    const r = correr({ tipo: 'multiplicar_variable', variableId: 'n', cantidad: { tipo: 'sistema', clave: 'slide_numero' } }, undefined, { slide_numero: 3 });
    expect(r.estado.variables.n).toBe(30);
  });

  it('un dato de sistema ausente no cambia nada y avisa', () => {
    const r = correr({ tipo: 'multiplicar_variable', variableId: 'n', cantidad: { tipo: 'sistema', clave: 'tiempo_s' } });
    expect(r.estado.variables.n).toBe(10);
    expect(cod(r)).toContain('sistema_no_disponible');
  });

  it('dividir por cero NO cambia el estado y avisa (nunca Infinity ni NaN)', () => {
    const r = correr({ tipo: 'dividir_variable', variableId: 'n', cantidad: lit(0) });
    expect(r.estado.variables.n).toBe(10);
    expect(cod(r)).toContain('resultado_invalido');
    const r2 = correr({ tipo: 'dividir_variable', variableId: 'n', cantidad: variable('cero') }, crearEstadoInicial([...vars, num('cero', 0)]));
    // También si el divisor es una variable que vale 0.
    expect(r2.estado.variables.n).toBe(10);
    expect(cod(r2)).toContain('resultado_invalido');
  });

  it('un resultado no finito no se aplica', () => {
    const grande = num('g', Number.MAX_VALUE);
    const est = crearEstadoInicial([grande]);
    const r = procesarEvento(
      [deBloque(regla('r', 'clic', [{ tipo: 'multiplicar_variable', variableId: 'g', cantidad: lit(10) }]), 'b1')],
      est,
      clic,
      { variables: [grande] },
    );
    expect(r.estado.variables.g).toBe(Number.MAX_VALUE);
    expect(r.avisos.map((a) => a.codigo)).toContain('resultado_invalido');
  });

  it('sobre una variable que no es numérica no hace nada y avisa', () => {
    for (const tipo of ['restar_variable', 'multiplicar_variable', 'dividir_variable'] as const) {
      const r = correr({ tipo, variableId: 't', cantidad: lit(1) });
      expect(r.estado.variables.t).toBe('Hola');
      expect(cod(r)).toContain('tipo_incompatible');
    }
  });

  it('una cantidad no numérica no hace nada y avisa', () => {
    const r = correr({ tipo: 'restar_variable', variableId: 'n', cantidad: lit('3') });
    expect(r.estado.variables.n).toBe(10);
    expect(cod(r)).toContain('tipo_incompatible');
  });

  it('una variable inexistente avisa y no lanza', () => {
    const r = correr({ tipo: 'restar_variable', variableId: 'nada', cantidad: lit(1) });
    expect(cod(r)).toContain('variable_inexistente');
  });
});

describe('limpiar', () => {
  it('vuelve cada tipo a su valor inicial', () => {
    const est = crearEstadoInicial(vars);
    const modificado: EstadoMotor = { ...est, variables: { ...est.variables, n: 99, t: 'x', b: false } };
    for (const [id, esperado] of [['n', 10], ['t', 'Hola'], ['b', true]] as const) {
      const r = correr({ tipo: 'limpiar_variable', variableId: id }, modificado);
      expect(r.estado.variables[id]).toBe(esperado);
    }
  });

  it('una variable inexistente avisa', () => {
    expect(cod(correr({ tipo: 'limpiar_variable', variableId: 'nada' }))).toContain('variable_inexistente');
  });
});

describe('concatenar', () => {
  it('añade texto, número y verdadero/falso (Sí/No)', () => {
    expect(correr({ tipo: 'concatenar_variable', variableId: 't', texto: lit(' mundo') }).estado.variables.t).toBe('Hola mundo');
    expect(correr({ tipo: 'concatenar_variable', variableId: 't', texto: variable('n') }).estado.variables.t).toBe('Hola10');
    expect(correr({ tipo: 'concatenar_variable', variableId: 't', texto: variable('b') }).estado.variables.t).toBe('HolaSí');
  });

  it('recorta al máximo de un valor de texto y avisa', () => {
    const larga = txt('l', 'a'.repeat(MAX_TEXTO_VARIABLE - 2));
    const est = crearEstadoInicial([larga]);
    const r = procesarEvento(
      [deBloque(regla('r', 'clic', [{ tipo: 'concatenar_variable', variableId: 'l', texto: lit('bcdefg') }]), 'b1')],
      est,
      clic,
      { variables: [larga] },
    );
    expect((r.estado.variables.l as string).length).toBe(MAX_TEXTO_VARIABLE);
    expect(r.avisos.map((a) => a.codigo)).toContain('texto_recortado');
  });

  it('sobre una variable no textual no hace nada y avisa', () => {
    const r = correr({ tipo: 'concatenar_variable', variableId: 'n', texto: lit('x') });
    expect(r.estado.variables.n).toBe(10);
    expect(cod(r)).toContain('tipo_incompatible');
  });
});

describe('alternar', () => {
  it('invierte un verdadero/falso, dos veces vuelve al inicio', () => {
    const a = correr({ tipo: 'alternar_variable', variableId: 'b' });
    expect(a.estado.variables.b).toBe(false);
    const b = correr({ tipo: 'alternar_variable', variableId: 'b' }, a.estado);
    expect(b.estado.variables.b).toBe(true);
  });

  it('sobre un número avisa y no cambia', () => {
    const r = correr({ tipo: 'alternar_variable', variableId: 'n' });
    expect(r.estado.variables.n).toBe(10);
    expect(cod(r)).toContain('tipo_incompatible');
  });
});

describe('las operaciones funcionan también en «si no» y no mutan la entrada', () => {
  it('«si no» → restar', () => {
    const r: Regla = { ...regla('r', 'clic', [], [{ tipo: 'comparacion', operador: '>', izquierda: variable('n'), derecha: lit(100) }]), sino: [{ tipo: 'restar_variable', variableId: 'n', cantidad: lit(1) }] };
    const out = procesarEvento([deBloque(r, 'b1')], crearEstadoInicial(vars), clic, { variables: vars });
    expect(out.estado.variables.n).toBe(9);
  });

  it('el estado de entrada no se muta', () => {
    const est = crearEstadoInicial(vars);
    const copia = JSON.stringify(est);
    correr({ tipo: 'multiplicar_variable', variableId: 'n', cantidad: lit(2) }, est);
    expect(JSON.stringify(est)).toBe(copia);
  });

  it('el resultado es JSON serializable y válido para persistir (round-trip K5)', () => {
    const r = correr({ tipo: 'dividir_variable', variableId: 'n', cantidad: lit(4) });
    const ida = JSON.parse(JSON.stringify(r.estado)) as EstadoMotor;
    expect(ida.variables.n).toBe(2.5);
    expect(Object.values(ida.variables).every((v) => typeof v !== 'number' || Number.isFinite(v))).toBe(true);
  });
});

describe('uso, integridad y validación recorren las acciones nuevas', () => {
  const regDe = (a: Accion, sino = false): Regla =>
    sino ? { ...regla('r', 'clic', [{ tipo: 'siguiente' }]), sino: [a] } : regla('r', 'clic', [a]);

  it('usosDeVariable ve la variable objetivo y la variable de origen', () => {
    const r1 = regDe({ tipo: 'restar_variable', variableId: 'n', cantidad: variable('m') });
    expect(usosDeVariable([deBloque(r1, 'b1')], 'n')).toHaveLength(1);
    expect(usosDeVariable([deBloque(r1, 'b1')], 'm')).toHaveLength(1);
    for (const a of [
      { tipo: 'limpiar_variable', variableId: 'n' },
      { tipo: 'alternar_variable', variableId: 'n' },
      { tipo: 'concatenar_variable', variableId: 'n', texto: variable('m') },
    ] as Accion[]) {
      expect(usosDeVariable([deBloque(regDe(a, true), 'b1')], 'n')).toHaveLength(1);
    }
  });

  it('referenciasA y limpiar ven un bloque usado como origen de la cantidad', () => {
    const a: Accion = { tipo: 'concatenar_variable', variableId: 't', texto: { tipo: 'estado_bloque', bloqueId: 'x' } };
    const s = slide('s1', { bloques: [bloque('b1', { disparadores: [regDe(a)] }), bloque('x')] });
    expect(referenciasA([s], { tipo: 'bloque', id: 'x' }).map((u) => u.reglaId)).toEqual(['r']);
    const l = limpiarReferenciasABloque(s, 'x');
    expect(l.eliminadas.length + l.desactivadas.length).toBe(1);
  });

  it('remapearIds reescribe el bloque de origen de la cantidad', () => {
    const a: Accion = { tipo: 'restar_variable', variableId: 'n', cantidad: { tipo: 'estado_bloque', bloqueId: 'x' } };
    const s = slide('s1', { bloques: [bloque('b1', { disparadores: [regDe(a)] }), bloque('x')] });
    const n = remapearIds(s, { bloques: { x: 'X2' } });
    const acc = (n.bloques![0] as { disparadores: Regla[] }).disparadores[0]!.acciones[0] as Extract<Accion, { tipo: 'restar_variable' }>;
    expect(acc.cantidad).toEqual({ tipo: 'estado_bloque', bloqueId: 'X2' });
  });

  it('validarReglas detecta tipos erróneos, división por cero literal y variable inexistente', () => {
    const slides = [slide('s1', { bloques: [bloque('b1')] })];
    const ctx = contextoDesdeSlides(vars, slides);
    const mala = (a: Accion): ReglaAplicable => deBloque(regDe(a), 'b1');
    const codigos = (a: Accion) => validarReglas([mala(a)], ctx).map((e) => e.codigo);
    expect(codigos({ tipo: 'restar_variable', variableId: 't', cantidad: lit(1) })).toContain('tipo_incompatible');
    expect(codigos({ tipo: 'restar_variable', variableId: 'n', cantidad: lit('x') })).toContain('tipo_incompatible');
    expect(codigos({ tipo: 'dividir_variable', variableId: 'n', cantidad: lit(0) })).toContain('cantidad_invalida');
    expect(codigos({ tipo: 'concatenar_variable', variableId: 'n', texto: lit('x') })).toContain('tipo_incompatible');
    expect(codigos({ tipo: 'alternar_variable', variableId: 't' })).toContain('tipo_incompatible');
    expect(codigos({ tipo: 'limpiar_variable', variableId: 'nada' })).toContain('variable_inexistente');
    expect(codigos({ tipo: 'multiplicar_variable', variableId: 'n', cantidad: { tipo: 'sistema', clave: 'tiempo_s' } })).toEqual([]);
    expect(codigos({ tipo: 'concatenar_variable', variableId: 't', texto: variable('n') })).toEqual([]);
  });
});
