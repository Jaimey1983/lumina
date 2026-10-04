// Etapa N / N5: eventos de cambio de variable, tecla, temporizador, salir del slide, hover y media.
import { describe, expect, it } from 'vitest';
import type { Regla } from '@lumina/types/interaction';
import { describirRegla } from './describir.js';
import { cambiarEvento } from './constructor.js';
import {
  TECLAS_PERMITIDAS,
  errorDeParametro,
  esSegundosValidos,
  esTeclaPermitida,
} from './eventos.js';
import { crearEstadoInicial } from './estado.js';
import { reglasConReferenciasRotas } from './integridad.js';
import { procesarEvento } from './motor.js';
import { bloque, deBloque, deSlide, lit, num, regla, slide, txt } from './prueba-utils.js';
import { contextoDesdeSlides } from './recolectar.js';
import { temporizadoresPendientes } from './temporizadores.js';
import type { ReglaAplicable } from './tipos.js';
import { usosDeVariable } from './uso.js';
import { validarReglas } from './validar.js';
import { validarRegla } from './validar-regla.js';

const vars = [num('a', 0), num('b', 0), num('c', 0), txt('t', '')];
const con = (r: Regla, parametro?: string | number): Regla =>
  parametro === undefined ? r : { ...r, parametro };
const suma = (variableId: string, cantidad = 1) =>
  ({ tipo: 'sumar_variable', variableId, cantidad }) as const;
const correr = (reglas: ReglaAplicable[], evento: Parameters<typeof procesarEvento>[2]) =>
  procesarEvento(reglas, crearEstadoInicial(vars), evento, { variables: vars });

describe('cambio_variable', () => {
  it('se emite cuando una acción cambia el valor y dispara las reglas que la observan', () => {
    const reglas = [
      deBloque(regla('r1', 'clic', [suma('a')]), 'b1'),
      deSlide(con(regla('obs', 'cambio_variable', [suma('b', 10)]), 'a'), 's9'), // otro slide: es global
    ];
    const r = correr(reglas, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' });
    expect(r.estado.variables).toMatchObject({ a: 1, b: 10 });
  });

  it('solo reacciona a la variable indicada en `parametro`', () => {
    const reglas = [
      deBloque(regla('r1', 'clic', [suma('a')]), 'b1'),
      deSlide(con(regla('otra', 'cambio_variable', [suma('b')]), 'c')),
    ];
    const r = correr(reglas, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' });
    expect(r.estado.variables.b).toBe(0);
  });

  it('una regla sin parámetro no se dispara', () => {
    const reglas = [
      deBloque(regla('r1', 'clic', [suma('a')]), 'b1'),
      deSlide(regla('sin', 'cambio_variable', [suma('b')])),
    ];
    expect(correr(reglas, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' }).estado.variables.b).toBe(0);
  });

  it('una asignación que no cambia el valor NO emite el evento', () => {
    const reglas = [
      deBloque(
        regla('r1', 'clic', [{ tipo: 'asignar_variable', variableId: 'a', valor: lit(0) }]),
        'b1',
      ),
      deSlide(con(regla('obs', 'cambio_variable', [suma('b')]), 'a')),
    ];
    expect(correr(reglas, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' }).estado.variables.b).toBe(0);
  });

  it('bucle «cambia A → cambia B → cambia A» se corta sin colgar', () => {
    const reglas = [
      deBloque(regla('r1', 'clic', [suma('a')]), 'b1'),
      deSlide(con(regla('ab', 'cambio_variable', [suma('b')]), 'a')),
      deSlide(con(regla('ba', 'cambio_variable', [suma('a')]), 'b')),
    ];
    const r = correr(reglas, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' });
    expect(r.avisos.map((x) => x.codigo)).toContain('ciclo_cortado');
    expect(r.estado.variables.a).toBeLessThan(10);
  });

  it('una regla que se modifica a sí misma no entra en bucle', () => {
    const reglas = [
      deBloque(regla('r1', 'clic', [suma('a')]), 'b1'),
      deSlide(con(regla('auto', 'cambio_variable', [suma('a')]), 'a')),
    ];
    const r = correr(reglas, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' });
    expect(r.estado.variables.a).toBe(2); // 1 por el clic + 1 por la reacción, y se corta
    expect(r.avisos.map((x) => x.codigo)).toContain('ciclo_cortado');
  });

  it('cualquier acción que cambia una variable lo emite (restar, multiplicar, alternar, limpiar…)', () => {
    const v = [num('n', 5)];
    const base = crearEstadoInicial(v);
    for (const accion of [
      { tipo: 'restar_variable', variableId: 'n', cantidad: lit(1) },
      { tipo: 'multiplicar_variable', variableId: 'n', cantidad: lit(2) },
      { tipo: 'asignar_variable', variableId: 'n', valor: lit(9) },
    ] as const) {
      const reglas = [
        deBloque(regla('r1', 'clic', [accion]), 'b1'),
        deSlide(con(regla('obs', 'cambio_variable', [{ tipo: 'asignar_variable', variableId: 'n', valor: lit(100) }]), 'n')),
      ];
      const r = procesarEvento(reglas, base, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' }, { variables: v });
      expect(r.estado.variables.n, accion.tipo).toBe(100);
    }
  });
});

describe('tecla', () => {
  const evt = (tecla: string, slideId = 's1') =>
    ({ tipo: 'tecla', slideId, detalle: { tecla } }) as const;

  it('dispara con la tecla configurada, en reglas de bloque y de slide del mismo slide', () => {
    const reglas = [
      deBloque(con(regla('rb', 'tecla', [suma('a')]), 'Enter'), 'b1'),
      deSlide(con(regla('rs', 'tecla', [suma('b')]), 'Enter')),
    ];
    expect(correr(reglas, evt('Enter')).estado.variables).toMatchObject({ a: 1, b: 1 });
  });

  it('otra tecla, otro slide o sin parámetro no disparan', () => {
    const reglas = [
      deBloque(con(regla('rb', 'tecla', [suma('a')]), 'Enter'), 'b1'),
      deSlide(regla('sin', 'tecla', [suma('b')])),
    ];
    expect(correr(reglas, evt('Space')).estado.variables.a).toBe(0);
    expect(correr(reglas, evt('Enter', 's2')).estado.variables.a).toBe(0);
    expect(correr(reglas, evt('Enter')).estado.variables.b).toBe(0);
  });

  it('el parámetro se valida contra una lista cerrada de códigos', () => {
    expect(esTeclaPermitida('Enter')).toBe(true);
    expect(esTeclaPermitida('KeyA')).toBe(true);
    expect(esTeclaPermitida('Digit7')).toBe(true);
    for (const mala of ['Tab', 'Escape', 'F5', '', 'enter', '__proto__', 'constructor', 5, undefined, null]) {
      expect(esTeclaPermitida(mala), String(mala)).toBe(false);
    }
    expect(Object.keys(TECLAS_PERMITIDAS)).toHaveLength(6 + 10 + 26);
  });

  it('una regla con tecla inválida no dispara aunque el evento la traiga', () => {
    const reglas = [deSlide(con(regla('x', 'tecla', [suma('a')]), 'Tab'))];
    expect(correr(reglas, evt('Tab')).estado.variables.a).toBe(0);
  });
});

describe('temporizador', () => {
  const evt = (segundos: number, slideId = 's1') =>
    ({ tipo: 'temporizador', slideId, detalle: { segundos } }) as const;

  it('dispara solo para su número de segundos y deja una marca persistible', () => {
    const reglas = [deSlide(con(regla('t5', 'temporizador', [suma('a')]), 5))];
    expect(correr(reglas, evt(10)).estado.variables.a).toBe(0);
    const r = correr(reglas, evt(5));
    expect(r.estado.variables.a).toBe(1);
    expect(Object.keys(r.estado.visibles)).toHaveLength(1); // la marca
  });

  it('temporizadoresPendientes: ordena, une duplicados y omite los que ya dispararon', () => {
    const reglas = [
      deSlide(con(regla('t10', 'temporizador', [suma('a')]), 10)),
      deBloque(con(regla('t3', 'temporizador', [suma('a')]), 3), 'b1'),
      deSlide(con(regla('t3b', 'temporizador', [suma('b')]), 3)),
      deSlide(con(regla('malo', 'temporizador', [suma('b')]), 0)),
      deSlide(con(regla('otroslide', 'temporizador', [suma('b')]), 7), 's2'),
      deSlide(con(regla('off', 'temporizador', [suma('b')], [], false), 20)),
    ];
    const base = crearEstadoInicial(vars);
    expect(temporizadoresPendientes(reglas, base, 's1')).toEqual([3, 10]);
    const tras = procesarEvento(reglas, base, evt(3), { variables: vars }).estado;
    expect(temporizadoresPendientes(reglas, tras, 's1')).toEqual([10]);
    // Sobrevive a un viaje por JSON (K5 lo persiste).
    const restaurado = JSON.parse(JSON.stringify(tras));
    expect(temporizadoresPendientes(reglas, restaurado, 's1')).toEqual([10]);
  });

  it('valida el rango de segundos', () => {
    expect([1, 600, 30].every(esSegundosValidos)).toBe(true);
    for (const malo of [0, 601, -1, 2.5, NaN, '5', undefined]) expect(esSegundosValidos(malo)).toBe(false);
  });
});

describe('salir_slide', () => {
  it('dispara en las reglas del slide que se deja', () => {
    const reglas = [deSlide(regla('s', 'salir_slide', [suma('a')]), 's1')];
    expect(correr(reglas, { tipo: 'salir_slide', slideId: 's1' }).estado.variables.a).toBe(1);
    expect(correr(reglas, { tipo: 'salir_slide', slideId: 's2' }).estado.variables.a).toBe(0);
  });

  it('no puede navegar: se ignora con aviso (evita saltos encadenados)', () => {
    const reglas = [deSlide(regla('s', 'salir_slide', [{ tipo: 'siguiente' }, suma('a')]))];
    const r = correr(reglas, { tipo: 'salir_slide', slideId: 's1' });
    expect(r.efectos).toEqual([]);
    expect(r.avisos.map((x) => x.codigo)).toContain('navegacion_ignorada');
    expect(r.estado.variables.a).toBe(1);
  });
});

describe('hover y media (eventos de bloque)', () => {
  it.each(['hover_entra', 'hover_sale', 'media_inicia', 'media_termina'] as const)('%s', (tipo) => {
    const reglas = [deBloque(regla('r', tipo, [suma('a')]), 'b1')];
    expect(correr(reglas, { tipo, bloqueId: 'b1', slideId: 's1' }).estado.variables.a).toBe(1);
    expect(correr(reglas, { tipo, bloqueId: 'otro', slideId: 's1' }).estado.variables.a).toBe(0);
  });
});

describe('validación, integridad y descripción', () => {
  const ids = new Set(vars.map((v) => v.id));

  it('errorDeParametro', () => {
    expect(errorDeParametro({ evento: 'clic' })).toBeUndefined();
    expect(errorDeParametro({ evento: 'cambio_variable' }, ids)).toBeDefined();
    expect(errorDeParametro({ evento: 'cambio_variable', parametro: 'a' }, ids)).toBeUndefined();
    expect(errorDeParametro({ evento: 'cambio_variable', parametro: 'borrada' }, ids)).toMatch(/ya no existe/);
    expect(errorDeParametro({ evento: 'tecla', parametro: 'Tab' })).toBeDefined();
    expect(errorDeParametro({ evento: 'temporizador', parametro: 601 })).toBeDefined();
    expect(errorDeParametro({ evento: 'temporizador', parametro: 30 })).toBeUndefined();
  });

  it('validarRegla y validarReglas señalan el parámetro', () => {
    const r = regla('r', 'tecla', [suma('a')]);
    const ctx = { variables: vars, bloqueIds: new Set(['b1']), slideIds: new Set(['s1']), capaIds: new Set<string>() };
    expect(validarRegla(r, { tipo: 'slide', slideId: 's1' }, ctx).map((a) => a.campo)).toContain('parametro');
    expect(validarRegla({ ...r, parametro: 'Enter' }, { tipo: 'slide', slideId: 's1' }, ctx)).toEqual([]);
    expect(validarReglas([deSlide(r)], ctx).map((e) => e.codigo)).toContain('parametro_invalido');
  });

  it('borrar la variable observada deja una referencia rota y cuenta como uso', () => {
    const r = con(regla('obs', 'cambio_variable', [suma('b')]), 'a');
    const s = slide('s1', { reglas: [r] });
    expect(usosDeVariable([deSlide(r)], 'a')).toHaveLength(1);
    expect(reglasConReferenciasRotas([s], vars)).toEqual([]);
    const sin = reglasConReferenciasRotas([s], vars.filter((v) => v.id !== 'a'));
    expect(sin.map((x) => x.codigo)).toEqual(['variable_inexistente']);
    void bloque;
    void contextoDesdeSlides;
  });

  it('describirRegla nombra el parámetro', () => {
    const ctx = {
      nombreVariable: (id: string) => (id === 'a' ? 'Intentos' : undefined),
      nombreBloque: () => undefined,
      tituloSlide: () => undefined,
      nombreCapa: () => undefined,
    };
    expect(describirRegla(con(regla('r', 'cambio_variable', [suma('a')]), 'a'), ctx)).toContain('«Intentos»');
    expect(describirRegla(con(regla('r', 'cambio_variable', [suma('a')]), 'x'), ctx)).toContain('(eliminado)');
    expect(describirRegla(con(regla('r', 'tecla', [suma('a')]), 'ArrowLeft'), ctx)).toContain('Flecha izquierda');
    expect(describirRegla(con(regla('r', 'temporizador', [suma('a')]), 1), ctx)).toContain('1 segundo ');
    expect(describirRegla(con(regla('r', 'temporizador', [suma('a')]), 30), ctx)).toContain('30 segundos');
  });

  it('cambiarEvento deja un parámetro válido o lo quita', () => {
    const r = regla('r', 'clic', [suma('a')]);
    expect(cambiarEvento(r, 'tecla').parametro).toBe('Enter');
    expect(cambiarEvento(r, 'temporizador').parametro).toBe(5);
    expect(cambiarEvento(r, 'cambio_variable', 'a').parametro).toBe('a');
    expect('parametro' in cambiarEvento(cambiarEvento(r, 'tecla'), 'clic')).toBe(false);
    expect(r).not.toHaveProperty('parametro');
  });
});
