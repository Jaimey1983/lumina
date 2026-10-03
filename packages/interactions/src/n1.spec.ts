// Etapa N / N1: «si no», operadores de rango y de texto, variables del sistema.
import { describe, expect, it } from 'vitest';
import type { Accion, Condicion, Regla } from '@lumina/types/interaction';
import { evaluarCondicion } from './condiciones.js';
import { crearEstadoInicial } from './estado.js';
import { limpiarReferenciasABloque, limpiarReferenciasASlide, remapearIds, referenciasA } from './integridad.js';
import { procesarEvento } from './motor.js';
import { bloque, bool, cmp, deBloque, lit, num, regla, slide, txt, variable } from './prueba-utils.js';
import type { Aviso, ContextoMotor, EventoMotor } from './tipos.js';
import { usosDeVariable } from './uso.js';
import { validarReglas } from './validar.js';
import { contextoDesdeSlides } from './recolectar.js';
import { accionesDeRegla } from './reglas.js';

const estado = crearEstadoInicial([num('n', 5), txt('t', 'Árbol Grande'), bool('b', true)]);
const ev = (c: Condicion, sistema?: ContextoMotor['sistema']) => {
  const avisos: Aviso[] = [];
  const r = evaluarCondicion(c, estado, { avisos, profundidadMax: 16, ...(sistema ? { sistema } : {}) });
  return { r, avisos };
};
const entre = (
  valor: Extract<Condicion, { tipo: 'entre' }>['valor'],
  desde: Extract<Condicion, { tipo: 'entre' }>['desde'],
  hasta: Extract<Condicion, { tipo: 'entre' }>['hasta'],
): Condicion => ({ tipo: 'entre', valor, desde, hasta });

describe('«entre» (incluye extremos, solo números)', () => {
  it.each([
    [3, 5, true],
    [5, 7, true],
    [6, 9, false],
    [1, 4, false],
    [5, 5, true],
  ])('n entre %s y %s → %s', (d, h, esperado) => {
    expect(ev(entre(variable('n'), lit(d), lit(h))).r).toBe(esperado);
  });

  it('si vienen al revés se toman al revés', () => {
    expect(ev(entre(variable('n'), lit(7), lit(3))).r).toBe(true);
  });

  it('no numérico → falso con aviso (falla cerrado, también bajo `no`)', () => {
    const c = entre(variable('t'), lit(1), lit(9));
    const { r, avisos } = ev(c);
    expect(r).toBe(false);
    expect(avisos.map((a) => a.codigo)).toContain('rango_invalido');
    expect(ev({ tipo: 'no', condicion: c }).r).toBe(false);
  });

  it('una variable borrada deja la condición rota (también bajo `no`)', () => {
    const c = entre(variable('nada'), lit(1), lit(9));
    expect(ev(c).r).toBe(false);
    expect(ev({ tipo: 'no', condicion: c }).r).toBe(false);
  });
});

describe('operadores de texto (sin mayúsculas ni acentos)', () => {
  it.each([
    ['contiene', 'ARBOL', true],
    ['contiene', 'árbol g', true],
    ['contiene', 'roble', false],
    ['no_contiene', 'roble', true],
    ['no_contiene', 'arbol', false],
    ['empieza_con', 'arbol', true],
    ['empieza_con', 'grande', false],
    ['termina_con', 'GRANDE', true],
    ['termina_con', 'arbol', false],
  ] as const)('t %s «%s» → %s', (op, valor, esperado) => {
    expect(ev(cmp(variable('t'), op, lit(valor))).r).toBe(esperado);
  });

  it('solo valen entre textos: un número deja la regla rota con aviso', () => {
    const c = cmp(variable('n'), 'contiene', lit(5));
    const { r, avisos } = ev(c);
    expect(r).toBe(false);
    expect(avisos.map((a) => a.codigo)).toContain('tipo_incompatible');
    expect(ev({ tipo: 'no', condicion: c }).r).toBe(false);
  });
});

describe('variables del sistema (operando de solo lectura)', () => {
  const c = cmp({ tipo: 'sistema', clave: 'slide_numero' }, '==', { tipo: 'sistema', clave: 'slide_total' });

  it('lee el valor que entrega el runtime', () => {
    expect(ev(c, { slide_numero: 3, slide_total: 3 }).r).toBe(true);
    expect(ev(c, { slide_numero: 2, slide_total: 3 }).r).toBe(false);
  });

  it('sin dato falla cerrado con aviso (también bajo `no`)', () => {
    const { r, avisos } = ev(c);
    expect(r).toBe(false);
    expect(avisos.map((a) => a.codigo)).toContain('sistema_no_disponible');
    expect(ev({ tipo: 'no', condicion: c }).r).toBe(false);
  });

  it('un valor no finito se trata como no disponible', () => {
    expect(ev(c, { slide_numero: Number.NaN, slide_total: 3 }).r).toBe(false);
  });
});

describe('«si no» (D15)', () => {
  const sumar = (id: string, cantidad = 1): Accion => ({ tipo: 'sumar_variable', variableId: id, cantidad });
  const conSino = (r: Regla, sino: Accion[]): Regla => ({ ...r, sino });
  const clic: EventoMotor = { tipo: 'clic', bloqueId: 'b', slideId: 's1' };
  const ctx: ContextoMotor = { variables: [num('si'), num('no'), num('n', 5)] };

  it('con condición verdadera ejecuta solo `acciones`', () => {
    const r = conSino(regla('r', 'clic', [sumar('si')], [cmp(variable('n'), '>=', lit(5))]), [sumar('no')]);
    const out = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, ctx);
    expect(out.estado.variables).toMatchObject({ si: 1, no: 0 });
  });

  it('con condición falsa ejecuta solo `sino`', () => {
    const r = conSino(regla('r', 'clic', [sumar('si')], [cmp(variable('n'), '>', lit(5))]), [sumar('no')]);
    const out = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, ctx);
    expect(out.estado.variables).toMatchObject({ si: 0, no: 1 });
  });

  it('una regla inactiva no ejecuta ninguna de las dos ramas', () => {
    const r = { ...conSino(regla('r', 'clic', [sumar('si')], [cmp(variable('n'), '>', lit(5))]), [sumar('no')]), activa: false };
    const out = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, ctx);
    expect(out.estado.variables).toMatchObject({ si: 0, no: 0 });
  });

  it('otro evento no ejecuta `sino`', () => {
    const r = conSino(regla('r', 'clic', [sumar('si')], [cmp(variable('n'), '>', lit(5))]), [sumar('no')]);
    const out = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), { tipo: 'visitado', bloqueId: 'b', slideId: 's1' }, ctx);
    expect(out.estado.variables).toMatchObject({ si: 0, no: 0 });
  });

  it('una condición ROTA no ejecuta `sino` (ni directa ni bajo `no`)', () => {
    const rota = cmp(variable('borrada'), '==', lit(1));
    for (const cond of [rota, { tipo: 'no', condicion: rota } as Condicion]) {
      const r = conSino(regla('r', 'clic', [sumar('si')], [cond]), [sumar('no')]);
      const out = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, ctx);
      expect(out.estado.variables).toMatchObject({ si: 0, no: 0 });
      expect(out.avisos.map((a) => a.codigo)).toContain('variable_inexistente');
    }
  });

  it('una condición de sistema sin dato también falla cerrado (no ejecuta `sino`)', () => {
    const r = conSino(
      regla('r', 'clic', [sumar('si')], [cmp({ tipo: 'sistema', clave: 'progreso_pct' }, '>=', lit(50))]),
      [sumar('no')],
    );
    const sin = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, ctx);
    expect(sin.estado.variables).toMatchObject({ si: 0, no: 0 });
    const bajo = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, { ...ctx, sistema: { progreso_pct: 10 } });
    expect(bajo.estado.variables).toMatchObject({ si: 0, no: 1 });
    const alto = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, { ...ctx, sistema: { progreso_pct: 80 } });
    expect(alto.estado.variables).toMatchObject({ si: 1, no: 0 });
  });

  it('«si falla ir a refuerzo, si no, siguiente»: una sola navegación según la condición', () => {
    const r = conSino(
      regla('r', 'respuesta_incorrecta', [{ tipo: 'ir_a_slide', slideId: 'refuerzo' }]),
      [{ tipo: 'siguiente' }],
    );
    // Con respuesta incorrecta el evento coincide y las condiciones (vacías) son verdaderas.
    const out = procesarEvento([deBloque(r, 'q')], crearEstadoInicial([]), { tipo: 'respuesta_incorrecta', bloqueId: 'q', slideId: 's1' }, { variables: [] });
    expect(out.efectos).toEqual([{ tipo: 'navegar', destino: { tipo: 'slide', slideId: 'refuerzo' } }]);
  });

  it('un ciclo A→B→A hecho con `sino` se corta con aviso y no se cuelga', () => {
    const falsa = [cmp(lit(1), '==', lit(2))];
    const reglas = [
      deBloque(conSino(regla('r1', 'visitado', [], falsa), [{ tipo: 'cambiar_estado', bloqueId: 'x', estado: 'seleccionado' }]), 'x'),
      deBloque(conSino(regla('r2', 'seleccionado', [], falsa), [{ tipo: 'cambiar_estado', bloqueId: 'x', estado: 'visitado' }]), 'x'),
    ];
    const out = procesarEvento(reglas, crearEstadoInicial([]), { tipo: 'visitado', bloqueId: 'x', slideId: 's1' }, { variables: [] });
    expect(out.avisos.map((a) => a.codigo)).toContain('ciclo_cortado');
  });

  it('las acciones de `sino` cuentan para el tope de acciones', () => {
    const muchas = Array.from({ length: 300 }, () => sumar('no'));
    const r = conSino(regla('r', 'clic', [], [cmp(lit(1), '==', lit(2))]), muchas);
    const out = procesarEvento([deBloque(r, 'b')], crearEstadoInicial(ctx.variables), clic, ctx);
    expect(out.avisos.map((a) => a.codigo)).toContain('limite_acciones');
    expect(out.estado.variables.no).toBe(200);
  });

  it('el estado de entrada no se muta', () => {
    const r = conSino(regla('r', 'clic', [], [cmp(lit(1), '==', lit(2))]), [sumar('no')]);
    const antes = crearEstadoInicial(ctx.variables);
    const copia = JSON.stringify(antes);
    procesarEvento([deBloque(r, 'b')], antes, clic, ctx);
    expect(JSON.stringify(antes)).toBe(copia);
  });
});

describe('`sino` en integridad, uso y validación', () => {
  const sinoIrA = (slideId: string): Regla => ({
    ...regla('r', 'clic', [{ tipo: 'siguiente' }]),
    sino: [{ tipo: 'ir_a_slide', slideId }],
  });

  it('accionesDeRegla junta las dos ramas', () => {
    expect(accionesDeRegla(sinoIrA('s2'))).toHaveLength(2);
    expect(accionesDeRegla(regla('x', 'clic', [{ tipo: 'siguiente' }]))).toHaveLength(1);
  });

  it('referenciasA ve un slide mencionado solo en `sino`', () => {
    const slides = [slide('s1', { bloques: [bloque('b', { disparadores: [sinoIrA('s2')] })] }), slide('s2')];
    expect(referenciasA(slides, { tipo: 'slide', id: 's2' }).map((x) => x.reglaId)).toEqual(['r']);
  });

  it('borrar el slide al que solo apunta `sino` desactiva la regla (no la borra: la rama «sí» sigue viva)', () => {
    const s1 = slide('s1', { bloques: [bloque('b', { disparadores: [sinoIrA('s2')] })] });
    const r = limpiarReferenciasASlide([s1], 's2');
    expect(r.eliminadas).toEqual([]);
    expect(r.desactivadas).toEqual(['r']);
  });

  it('borrar el bloque mencionado por TODAS las acciones (sí y sino) elimina la regla', () => {
    const r: Regla = { ...regla('r', 'clic', [{ tipo: 'mostrar', bloqueId: 'm' }]), sino: [{ tipo: 'ocultar', bloqueId: 'm' }] };
    const s = slide('s1', { reglas: [r] });
    const out = limpiarReferenciasABloque(s, 'm');
    expect(out.eliminadas).toEqual(['r']);
  });

  it('remapearIds reescribe también `sino` y la condición `entre`', () => {
    const r: Regla = {
      ...regla('r', 'clic', [{ tipo: 'siguiente' }], [entre({ tipo: 'estado_bloque', bloqueId: 'a' }, lit(1), lit(2))]),
      sino: [{ tipo: 'mostrar', bloqueId: 'a' }],
    };
    const s = slide('s1', { bloques: [bloque('a', { disparadores: [r] })] });
    const nuevo = remapearIds(s, { bloques: { a: 'A2' } });
    const regNueva = (nuevo.bloques![0] as { disparadores: Regla[] }).disparadores[0]!;
    expect(regNueva.sino).toEqual([{ tipo: 'mostrar', bloqueId: 'A2' }]);
    const c = regNueva.condiciones[0] as Extract<Condicion, { tipo: 'entre' }>;
    expect(c.valor).toEqual({ tipo: 'estado_bloque', bloqueId: 'A2' });
  });

  it('usosDeVariable cuenta una variable que solo aparece en `sino` o en `entre`', () => {
    const rSino: Regla = { ...regla('r1', 'clic', [{ tipo: 'siguiente' }]), sino: [{ tipo: 'sumar_variable', variableId: 'v', cantidad: 1 }] };
    const rEntre = regla('r2', 'clic', [{ tipo: 'siguiente' }], [entre(variable('v'), lit(1), lit(2))]);
    const usos = usosDeVariable([deBloque(rSino, 'b'), deBloque(rEntre, 'b')], 'v');
    expect(usos.map((u) => u.reglaId).sort()).toEqual(['r1', 'r2']);
  });

  it('validarReglas revisa las acciones de `sino`, «entre», el texto y la clave de sistema', () => {
    const slides = [slide('s1', { bloques: [bloque('b')] })];
    const ctx = contextoDesdeSlides([num('n'), txt('t')], slides);
    const mala: Regla = {
      ...regla('r', 'clic', [{ tipo: 'siguiente' }], [
        entre(variable('t'), lit(1), lit(2)),
        cmp(variable('n'), 'contiene', lit('x')),
        cmp({ tipo: 'sistema', clave: 'nota_final' as never }, '>', lit(1)),
      ]),
      sino: [{ tipo: 'ir_a_slide', slideId: 'no-existe' }, { tipo: 'sumar_variable', variableId: 'fantasma', cantidad: 1 }],
    };
    const codigos = validarReglas([deBloque(mala, 'b')], ctx).map((e) => e.codigo);
    expect(codigos).toContain('tipo_incompatible');
    expect(codigos).toContain('clave_sistema_invalida');
    expect(codigos).toContain('slide_inexistente');
    expect(codigos).toContain('variable_inexistente');
  });

  it('una regla guardada antes de N1 (sin `sino`) valida y se comporta igual', () => {
    const slides = [slide('s1', { bloques: [bloque('b')] })];
    const ctx = contextoDesdeSlides([num('n')], slides);
    expect(validarReglas([deBloque(regla('r', 'clic', [{ tipo: 'siguiente' }]), 'b')], ctx)).toEqual([]);
  });
});

describe('C1/C4 con las ampliaciones de N1', () => {
  it('«si no», «entre», texto y sistema solo producen efectos de navegación y las 5 claves de flujo', () => {
    const r: Regla = {
      ...regla('r', 'clic', [{ tipo: 'siguiente' }], [
        entre({ tipo: 'sistema', clave: 'progreso_pct' }, lit(0), lit(50)),
      ]),
      sino: [{ tipo: 'ir_a_slide', slideId: 's9' }],
    };
    const out = procesarEvento(
      [deBloque(r, 'b')],
      crearEstadoInicial([]),
      { tipo: 'clic', bloqueId: 'b', slideId: 's1' },
      { variables: [], sistema: { progreso_pct: 90 } },
    );
    expect(out.efectos.every((e) => e.tipo === 'navegar')).toBe(true);
    expect(Object.keys(out.estado).sort()).toEqual(['capasAbiertas', 'estados', 'respuestas', 'variables', 'visibles']);
  });
});
