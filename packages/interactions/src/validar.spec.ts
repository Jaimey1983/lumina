import { describe, expect, it } from 'vitest';
import type { Accion, Condicion } from '@lumina/types/interaction';
import { contextoDesdeSlides } from './recolectar.js';
import { validarReglas } from './validar.js';
import {
  bloque,
  bool,
  cmp,
  deBloque,
  deSlide,
  lit,
  num,
  regla,
  slide,
  txt,
  variable,
} from './prueba-utils.js';

const ctx = contextoDesdeSlides(
  [num('n'), txt('t'), bool('b')],
  [
    slide('s1', {
      bloques: [bloque('a'), bloque('q')],
      capas: [{ id: 'c1', nombre: 'C', bloques: [] }],
    }),
    slide('s2'),
  ],
);
const codigos = (...rs: Parameters<typeof validarReglas>[0]) =>
  validarReglas(rs, ctx).map((e) => e.codigo);

describe('reglas válidas', () => {
  it('una regla completa y coherente no da errores', () => {
    const r = regla(
      'ok',
      'respuesta_incorrecta',
      [
        { tipo: 'sumar_variable', variableId: 'n', cantidad: 1 },
        { tipo: 'abrir_capa', capaId: 'c1' },
        { tipo: 'ir_a_slide', slideId: 's2' },
        { tipo: 'cambiar_estado', bloqueId: 'a', estado: 'visitado' },
        { tipo: 'asignar_variable', variableId: 'b', valor: { tipo: 'respuesta_correcta', bloqueId: 'q' } },
      ],
      [cmp(variable('n'), '<', lit(3))],
    );
    expect(validarReglas([deBloque(r, 'q')], ctx)).toEqual([]);
  });
});

describe('integridad referencial (lo que deja una regla rota al borrar algo)', () => {
  const acc = (a: Accion) => codigos(deBloque(regla('r', 'clic', [a]), 'a'));

  it('bloque, slide, capa y variable inexistentes', () => {
    expect(acc({ tipo: 'mostrar', bloqueId: 'borrado' })).toEqual(['bloque_inexistente']);
    expect(acc({ tipo: 'ocultar', bloqueId: 'borrado' })).toEqual(['bloque_inexistente']);
    expect(acc({ tipo: 'cambiar_estado', bloqueId: 'borrado', estado: 'normal' })).toEqual(['bloque_inexistente']);
    expect(acc({ tipo: 'ir_a_slide', slideId: 'borrado' })).toEqual(['slide_inexistente']);
    expect(acc({ tipo: 'abrir_capa', capaId: 'borrada' })).toEqual(['capa_inexistente']);
    expect(acc({ tipo: 'cerrar_capa', capaId: 'borrada' })).toEqual(['capa_inexistente']);
    expect(acc({ tipo: 'sumar_variable', variableId: 'borrada', cantidad: 1 })).toEqual(['variable_inexistente']);
  });

  it('el dueño de la regla y su slide deben existir', () => {
    expect(codigos(deBloque(regla('r', 'clic', []), 'fantasma'))).toEqual(['bloque_inexistente']);
    expect(codigos(deSlide(regla('r', 'clic', []), 'fantasma'))).toEqual(['slide_inexistente']);
  });

  it('condiciones: variable y bloque inexistentes', () => {
    const c: Condicion = {
      tipo: 'y',
      condiciones: [
        cmp(variable('borrada'), '==', lit(1)),
        cmp({ tipo: 'estado_bloque', bloqueId: 'borrado' }, '==', lit('visitado')),
      ],
    };
    expect(codigos(deBloque(regla('r', 'clic', [], [c]), 'a'))).toEqual([
      'variable_inexistente',
      'bloque_inexistente',
    ]);
  });
});

describe('tipos', () => {
  it('sumar a una variable que no es numérica, o con cantidad no finita', () => {
    const r = (a: Accion) => codigos(deBloque(regla('r', 'clic', [a]), 'a'));
    expect(r({ tipo: 'sumar_variable', variableId: 't', cantidad: 1 })).toEqual(['tipo_incompatible']);
    expect(r({ tipo: 'sumar_variable', variableId: 'n', cantidad: Number.NaN })).toEqual(['cantidad_invalida']);
    expect(r({ tipo: 'sumar_variable', variableId: 'n', cantidad: Infinity })).toEqual(['cantidad_invalida']);
  });

  it('asignar un valor de otro tipo', () => {
    const r = (a: Accion) => codigos(deBloque(regla('r', 'clic', [a]), 'a'));
    expect(r({ tipo: 'asignar_variable', variableId: 'n', valor: lit('x') })).toEqual(['tipo_incompatible']);
    expect(r({ tipo: 'asignar_variable', variableId: 'b', valor: variable('n') })).toEqual(['tipo_incompatible']);
    expect(r({ tipo: 'asignar_variable', variableId: 't', valor: { tipo: 'estado_bloque', bloqueId: 'a' } })).toEqual([]);
  });

  it('comparaciones: orden solo entre números; == entre tipos distintos', () => {
    const c = (cond: Condicion) => codigos(deBloque(regla('r', 'clic', [], [cond]), 'a'));
    expect(c(cmp(variable('t'), '<', lit('z')))).toEqual(['tipo_incompatible']);
    expect(c(cmp(variable('n'), '==', lit('5')))).toEqual(['tipo_incompatible']);
    expect(c(cmp(variable('n'), '>=', lit(2)))).toEqual([]);
  });
});

describe('estructura', () => {
  it('ids duplicados de regla y de variable', () => {
    expect(codigos(deBloque(regla('dup', 'clic', []), 'a'), deBloque(regla('dup', 'clic', []), 'q'))).toEqual(['regla_duplicada']);
    const e = validarReglas([], { ...ctx, variables: [num('x'), num('x')] }).map((x) => x.codigo);
    expect(e).toEqual(['variable_duplicada']);
  });

  it('valor inicial incoherente con el tipo', () => {
    const e = validarReglas([], {
      ...ctx,
      variables: [{ id: 'n', nombre: 'n', tipo: 'numero', valorInicial: 'x' }],
    });
    expect(e.map((x) => x.codigo)).toEqual(['valor_inicial_incoherente']);
  });

  it('«al entrar al slide» en una regla de bloque nunca disparará', () => {
    expect(codigos(deBloque(regla('r', 'al_entrar_slide', []), 'a'))).toEqual(['evento_incoherente']);
    expect(codigos(deSlide(regla('r', 'al_entrar_slide', [])))).toEqual([]);
  });

  it('condición demasiado profunda', () => {
    let c: Condicion = cmp(lit(1), '==', lit(1));
    for (let i = 0; i < 30; i++) c = { tipo: 'no', condicion: c };
    expect(codigos(deBloque(regla('r', 'clic', [], [c]), 'a'))).toEqual(['condicion_demasiado_profunda']);
  });

  it('devuelve TODOS los problemas, no solo el primero', () => {
    const r = regla('r', 'clic', [
      { tipo: 'mostrar', bloqueId: 'x1' },
      { tipo: 'abrir_capa', capaId: 'x2' },
      { tipo: 'ir_a_slide', slideId: 'x3' },
    ]);
    expect(codigos(deBloque(r, 'a'))).toEqual([
      'bloque_inexistente',
      'capa_inexistente',
      'slide_inexistente',
    ]);
  });
});
