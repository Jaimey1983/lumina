import { describe, expect, it } from 'vitest';
import type { Condicion, Regla } from '@lumina/types/interaction';
import {
  actualizarCondicion,
  agregarCondicion,
  alternarGrupo,
  alternarNegacion,
  bloqueIdsReferenciados,
  condicionEn,
  duplicarRegla,
  envolverEnGrupo,
  fusionarReglas,
  guardarEnLista,
  moverEnLista,
  plantillaIrARefuerzo,
  quitarCondicion,
  reglaNueva,
  sinMarcaDePlantilla,
  totalAcciones,
  describirRegla,
  describirCondicion,
  validarRegla,
  procesarEvento,
  crearEstadoInicial,
} from './index.js';
import type { ContextoDescripcion, ContextoValidacion } from './index.js';
import { cmp, lit, num, txt, bool, variable } from './prueba-utils.js';

const ctx: ContextoDescripcion = {
  nombreVariable: (id) => ({ v_int: 'intentos', v_nom: 'nombre', v_ok: 'listo' })[id],
  nombreBloque: (id) => ({ b_pista: 'la pista', b_x: 'el botón X' })[id],
  tituloSlide: (id) => ({ s2: 'Slide 2 — Refuerzo' })[id],
  nombreCapa: (id) => ({ c1: 'Ayuda' })[id],
};

const vctx = (over: Partial<ContextoValidacion> = {}): ContextoValidacion => ({
  variables: [num('v_int'), txt('v_nom'), bool('v_ok')],
  bloqueIds: new Set(['b_x', 'b_pista']),
  slideIds: new Set(['s1', 's2']),
  capaIds: new Set(['c1']),
  ...over,
});
const origen = { tipo: 'bloque', bloqueId: 'b_x', slideId: 's1' } as const;

// La regla del entregable de N3.
const reglaEntregable = (): Regla => ({
  id: 'r1',
  evento: 'clic',
  activa: true,
  condiciones: [
    {
      tipo: 'o',
      condiciones: [
        cmp(variable('v_int'), '>=', lit(3)),
        cmp({ tipo: 'estado_bloque', bloqueId: 'b_x' }, '==', lit('visitado')),
      ],
    },
  ],
  acciones: [{ tipo: 'mostrar', bloqueId: 'b_pista' }],
  sino: [{ tipo: 'sumar_variable', variableId: 'v_int', cantidad: 1 }],
});

describe('describirRegla (N3)', () => {
  it('describe la regla del entregable con nombres y «si no»', () => {
    expect(describirRegla(reglaEntregable(), ctx)).toBe(
      'Cuando se hace clic → si «intentos» es mayor o igual que 3 o el estado de el botón X es igual a «visitado» → mostrar la pista; si no → sumar 1 a «intentos»',
    );
  });

  it('una referencia que ya no existe se escribe (eliminado), nunca el id', () => {
    const r: Regla = {
      id: 'x',
      evento: 'clic',
      activa: true,
      condiciones: [cmp(variable('v_borrada'), '==', lit(1))],
      acciones: [
        { tipo: 'mostrar', bloqueId: 'b_borrado' },
        { tipo: 'ir_a_slide', slideId: 's_borrado' },
        { tipo: 'abrir_capa', capaId: 'c_borrada' },
      ],
    };
    const t = describirRegla(r, ctx);
    expect(t).toContain('(eliminado)');
    expect(t).not.toMatch(/v_borrada|b_borrado|s_borrado|c_borrada/);
  });

  it('describe «entre», operadores de texto, sistema y negación', () => {
    const c: Condicion[] = [
      { tipo: 'entre', valor: variable('v_int'), desde: lit(3), hasta: lit(5) },
      cmp(variable('v_nom'), 'empieza_con', lit('Ana')),
      cmp({ tipo: 'sistema', clave: 'slide_numero' }, '>', lit(2)),
      { tipo: 'no', condicion: cmp(variable('v_nom'), 'contiene', lit('x')) },
    ];
    const t = c.map((x) => describirCondicion(x, ctx));
    expect(t[0]).toBe('«intentos» está entre 3 y 5');
    expect(t[1]).toBe('«nombre» empieza con «Ana»');
    expect(t[2]).toBe('el número de slide es mayor que 2');
    expect(t[3]).toBe('no se cumple que «nombre» contiene «x»');
  });

  it('describe todas las acciones de N2 con la variable por su nombre', () => {
    const r: Regla = {
      id: 'x',
      evento: 'visitado',
      activa: false,
      condiciones: [],
      acciones: [
        { tipo: 'restar_variable', variableId: 'v_int', cantidad: lit(2) },
        { tipo: 'multiplicar_variable', variableId: 'v_int', cantidad: variable('v_int') },
        { tipo: 'dividir_variable', variableId: 'v_int', cantidad: lit(2) },
        { tipo: 'limpiar_variable', variableId: 'v_int' },
        { tipo: 'concatenar_variable', variableId: 'v_nom', texto: lit('!') },
        { tipo: 'alternar_variable', variableId: 'v_ok' },
        { tipo: 'asignar_variable', variableId: 'v_ok', valor: lit(true) },
      ],
    };
    const t = describirRegla(r, ctx);
    expect(t).toContain('restar 2 a «intentos»');
    expect(t).toContain('multiplicar «intentos» por «intentos»');
    expect(t).toContain('dividir «intentos» entre 2');
    expect(t).toContain('reiniciar «intentos»');
    expect(t).toContain('añadir «!» al final de «nombre»');
    expect(t).toContain('invertir «listo» (sí/no)');
    expect(t).toContain('asignar a «listo» sí');
    expect(t.endsWith('(desactivada)')).toBe(true);
    expect(totalAcciones(r)).toBe(7);
  });

  it('una regla sin acciones lo dice', () => {
    expect(describirRegla(reglaNueva('n', 'clic'), ctx)).toBe('Cuando se hace clic → no hace nada');
  });
});

describe('validarRegla por campo (N3)', () => {
  it('la regla del entregable no tiene avisos', () => {
    expect(validarRegla(reglaEntregable(), origen, vctx())).toEqual([]);
  });

  it('regla sin acciones avisa en «acciones»', () => {
    const a = validarRegla(reglaNueva('n', 'clic'), origen, vctx());
    expect(a).toEqual([
      expect.objectContaining({ campo: 'acciones', codigo: 'regla_sin_acciones' }),
    ]);
  });

  it('señala el campo exacto: tipo incompatible, variable, cantidad, capa, slide, bloque', () => {
    const r: Regla = {
      id: 'x',
      evento: 'clic',
      activa: true,
      condiciones: [
        {
          tipo: 'o',
          condiciones: [
            cmp(variable('v_nom'), '>', lit(1)),
            cmp(variable('v_int'), 'contiene', lit('a')),
          ],
        },
      ],
      acciones: [
        { tipo: 'dividir_variable', variableId: 'v_int', cantidad: lit(0) },
        { tipo: 'sumar_variable', variableId: 'v_nom', cantidad: 1 },
        { tipo: 'abrir_capa', capaId: 'c_no' },
      ],
      sino: [
        { tipo: 'ir_a_slide', slideId: 's_no' },
        { tipo: 'mostrar', bloqueId: 'b_no' },
        { tipo: 'alternar_variable', variableId: 'v_borrada' },
      ],
    };
    const campos = validarRegla(r, origen, vctx()).map((a) => `${a.campo}:${a.codigo}`);
    expect(campos).toContain('condiciones.0.condiciones.0.izquierda:tipo_incompatible');
    expect(campos).toContain('condiciones.0.condiciones.1.izquierda:tipo_incompatible');
    expect(campos).toContain('acciones.0.cantidad:cantidad_invalida');
    expect(campos).toContain('acciones.1.variableId:tipo_incompatible');
    expect(campos).toContain('acciones.2.capaId:capa_inexistente');
    expect(campos).toContain('sino.0.slideId:slide_inexistente');
    expect(campos).toContain('sino.1.bloqueId:bloque_inexistente');
    expect(campos).toContain('sino.2.variableId:variable_inexistente');
  });

  it('valida «entre» y campos vacíos que el formulario deja sin elegir', () => {
    const r: Regla = {
      id: 'x',
      evento: 'clic',
      activa: true,
      condiciones: [{ tipo: 'entre', valor: variable('v_nom'), desde: lit(1), hasta: lit('z') }],
      acciones: [{ tipo: 'mostrar', bloqueId: '' }, { tipo: 'limpiar_variable', variableId: '' }],
    };
    const campos = validarRegla(r, origen, vctx()).map((a) => `${a.campo}:${a.codigo}`);
    expect(campos).toContain('condiciones.0.valor:tipo_incompatible');
    expect(campos).toContain('condiciones.0.hasta:tipo_incompatible');
    expect(campos).toContain('acciones.0.bloqueId:bloque_inexistente');
    expect(campos).toContain('acciones.1.variableId:variable_invalida');
  });

  it('evento que el elemento no emite y «al entrar al slide» en un bloque', () => {
    const r = { ...reglaEntregable(), evento: 'fin_contador' as const };
    expect(
      validarRegla(r, origen, vctx(), { eventosPermitidos: ['clic'] }).map((a) => a.codigo),
    ).toContain('evento_no_soportado');
    const e = { ...reglaEntregable(), evento: 'al_entrar_slide' as const };
    expect(validarRegla(e, origen, vctx()).map((a) => a.codigo)).toContain('evento_incoherente');
    expect(
      validarRegla(e, { tipo: 'slide', slideId: 's1' }, vctx()).map((a) => a.codigo),
    ).not.toContain('evento_incoherente');
  });
});

describe('árbol de condiciones (N3)', () => {
  const a = cmp(variable('v_int'), '>=', lit(1));
  const b = cmp(variable('v_int'), '<=', lit(9));
  const c = cmp(variable('v_nom'), '==', lit('x'));

  it('agrega a la raíz y a un grupo, sin mutar', () => {
    const raiz: Condicion[] = [a];
    const r1 = agregarCondicion(raiz, [], b);
    expect(r1).toEqual([a, b]);
    expect(raiz).toEqual([a]);
    const grupo = envolverEnGrupo(r1, [1], 'o', c);
    expect(grupo[1]).toEqual({ tipo: 'o', condiciones: [b, c] });
    const r2 = agregarCondicion(grupo, [1], a);
    expect((r2[1] as { condiciones: Condicion[] }).condiciones).toHaveLength(3);
  });

  it('niega y quita la negación (ida y vuelta)', () => {
    const n = alternarNegacion([a, b], [1]);
    expect(n[1]).toEqual({ tipo: 'no', condicion: b });
    expect(alternarNegacion(n, [1])).toEqual([a, b]);
    expect(condicionEn(n, [1, 0])).toEqual(b);
  });

  it('alterna Y/O de un grupo y no toca una comparación', () => {
    const g: Condicion[] = [{ tipo: 'y', condiciones: [a, b] }, c];
    expect(alternarGrupo(g, [0])[0]).toEqual({ tipo: 'o', condiciones: [a, b] });
    expect(alternarGrupo(g, [1])[1]).toEqual(c);
  });

  it('quitar un nodo poda los grupos que quedan vacíos', () => {
    const g: Condicion[] = [{ tipo: 'o', condiciones: [a] }, c];
    expect(quitarCondicion(g, [0, 0])).toEqual([c]);
    const neg: Condicion[] = [{ tipo: 'no', condicion: { tipo: 'y', condiciones: [a] } }];
    expect(quitarCondicion(neg, [0, 0, 0])).toEqual([]);
  });

  it('actualiza un nodo profundo', () => {
    const g: Condicion[] = [{ tipo: 'o', condiciones: [a, { tipo: 'no', condicion: b }] }];
    const out = actualizarCondicion(g, [0, 1, 0], () => c);
    expect(condicionEn(out, [0, 1, 0])).toEqual(c);
    expect(condicionEn(g, [0, 1, 0])).toEqual(b);
  });

  it('una ruta inexistente no rompe', () => {
    expect(condicionEn([a], [5])).toBeUndefined();
    expect(quitarCondicion([a], [5])).toEqual([a]);
  });
});

describe('listas y plantillas editadas (N3)', () => {
  it('mueve reglas respetando los extremos', () => {
    expect(moverEnLista(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moverEnLista(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moverEnLista(['a', 'b', 'c'], 0, -5)).toEqual(['a', 'b', 'c']);
    expect(moverEnLista(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
  });

  it('editar una regla de plantilla le quita la marca y reaplicar NO la pisa', () => {
    const tpl = plantillaIrARefuerzo({ bloqueId: 'b1', slideRefuerzoId: 's2' }).reglas[0]!.regla;
    expect(tpl.id.startsWith('tpl:')).toBe(true);
    const editada = sinMarcaDePlantilla(
      { ...tpl, acciones: [{ tipo: 'siguiente' }] },
      'regla_docente_1',
    );
    expect(editada.id).toBe('regla_docente_1');
    const lista = guardarEnLista([tpl], editada, tpl.id);
    expect(lista).toEqual([editada]); // reemplaza en su posición
    // Reaplicar la plantilla: la del docente se conserva y la plantilla vuelve.
    const trasReaplicar = fusionarReglas(lista, [tpl]);
    expect(trasReaplicar.map((r) => r.id)).toEqual(['regla_docente_1', tpl.id]);
    expect(trasReaplicar[0]!.acciones).toEqual([{ tipo: 'siguiente' }]);
  });

  it('una regla que no es de plantilla conserva su id', () => {
    const r = reglaNueva('mia', 'clic');
    expect(sinMarcaDePlantilla(r, 'otro').id).toBe('mia');
  });

  it('guardarEnLista agrega las nuevas y reemplaza por id', () => {
    const r1 = reglaNueva('a', 'clic');
    const r2 = reglaNueva('b', 'clic');
    expect(guardarEnLista(undefined, r1)).toEqual([r1]);
    expect(guardarEnLista([r1], r2)).toEqual([r1, r2]);
    const r1b = { ...r1, activa: false };
    expect(guardarEnLista([r1, r2], r1b)).toEqual([r1b, r2]);
  });

  it('duplicar copia en profundidad con id nuevo', () => {
    const r = reglaEntregable();
    const d = duplicarRegla(r, 'copia');
    expect(d.id).toBe('copia');
    expect(d.sino).toEqual(r.sino);
    d.sino![0] = { tipo: 'siguiente' };
    expect(r.sino![0]).toEqual({ tipo: 'sumar_variable', variableId: 'v_int', cantidad: 1 });
  });

  it('bloqueIdsReferenciados junta acciones, sino y operandos', () => {
    const r: Regla = {
      id: 'x',
      evento: 'clic',
      activa: true,
      condiciones: [
        {
          tipo: 'no',
          condicion: {
            tipo: 'y',
            condiciones: [
              cmp({ tipo: 'respuesta_correcta', bloqueId: 'b_r' }, '==', lit(true)),
              { tipo: 'entre', valor: { tipo: 'estado_bloque', bloqueId: 'b_e' }, desde: lit(0), hasta: lit(1) },
            ],
          },
        },
      ],
      acciones: [{ tipo: 'mostrar', bloqueId: 'b_a' }],
      sino: [
        { tipo: 'cambiar_estado', bloqueId: 'b_s', estado: 'visitado' },
        { tipo: 'asignar_variable', variableId: 'v', valor: { tipo: 'estado_bloque', bloqueId: 'b_v' } },
      ],
    };
    expect(bloqueIdsReferenciados(r).sort()).toEqual(['b_a', 'b_e', 'b_r', 'b_s', 'b_v']);
  });
});

describe('la regla armada con el constructor la ejecuta el motor (N3)', () => {
  it('«clic → si intentos >= 3 o visitado → mostrar; si no → sumar 1»', () => {
    const vars = [num('v_int')];
    const reglas = [{ regla: reglaEntregable(), origen }];
    const ev = { tipo: 'clic', bloqueId: 'b_x', slideId: 's1' } as const;
    let estado = crearEstadoInicial(vars, []);
    for (let i = 0; i < 3; i++) {
      estado = procesarEvento(reglas, estado, ev, { variables: vars }).estado;
    }
    expect(estado.variables['v_int']).toBe(3);
    expect(estado.visibles['b_pista']).toBeUndefined();
    const fin = procesarEvento(reglas, estado, ev, { variables: vars }).estado;
    expect(fin.visibles['b_pista']).toBe(true);
    expect(fin.variables['v_int']).toBe(3);
  });
});
