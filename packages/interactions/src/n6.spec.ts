// Etapa N / N6: estados personalizados y apariencia por estado.
import { describe, expect, it } from 'vitest';
import { describirAccion } from './describir.js';
import { crearEstadoInicial } from './estado.js';
import {
  aparienciaDeEstado,
  cumpleAA,
  estadoDeclarado,
  estadosPersonalizadosPorBloque,
  razonDeContraste,
  sanearApariencia,
  usosDeEstado,
  validarApariencia,
  validarEstadosPersonalizados,
} from './estados-bloque.js';
import { procesarEvento } from './motor.js';
import { bloque, cmp, deBloque, lit, regla, slide } from './prueba-utils.js';
import { contextoDesdeSlides } from './recolectar.js';
import { validarReglas } from './validar.js';
import { validarRegla } from './validar-regla.js';

const ok = { id: 'correcto', nombre: 'Correcto', apariencia: { fondo: '#16a34a' } };
const cambiar = (estado: string) =>
  regla('r1', 'clic', [{ tipo: 'cambiar_estado', bloqueId: 'b2', estado }]);
const correr = (estado: string, declarados?: Record<string, string[]>) =>
  procesarEvento([deBloque(cambiar(estado), 'b1')], crearEstadoInicial([]), { tipo: 'clic', bloqueId: 'b1', slideId: 's1' }, {
    variables: [],
    ...(declarados ? { estadosPersonalizados: declarados } : {}),
  });

describe('motor: estados personalizados', () => {
  it('aplica un estado personalizado declarado en ese bloque', () => {
    const r = correr('correcto', { b2: ['correcto'] });
    expect(r.estado.estados.b2).toBe('correcto');
    expect(r.avisos).toEqual([]);
  });
  it('un estado no declarado deja aviso y no se aplica', () => {
    const r = correr('correcto', { b3: ['correcto'] });
    expect(r.estado.estados.b2).toBeUndefined();
    expect(r.avisos.map((a) => a.codigo)).toEqual(['estado_inexistente']);
  });
  it('sin contexto de estados personalizados solo valen los base', () => {
    expect(correr('correcto').avisos[0]?.codigo).toBe('estado_inexistente');
    expect(correr('deshabilitado').estado.estados.b2).toBe('deshabilitado');
  });
  it('un personalizado no emite visitado/seleccionado', () => {
    const r = correr('correcto', { b2: ['correcto'] });
    expect(r.avisos).toEqual([]);
  });
  it('la comparación con estado_bloque ve el id personalizado', () => {
    const estado = correr('correcto', { b2: ['correcto'] }).estado;
    const r2 = regla('r2', 'clic', [{ tipo: 'siguiente' }], [
      cmp({ tipo: 'estado_bloque', bloqueId: 'b2' }, '==', lit('correcto')),
    ]);
    const res = procesarEvento([deBloque(r2, 'b1')], estado, { tipo: 'clic', bloqueId: 'b1', slideId: 's1' }, { variables: [] });
    expect(res.efectos).toHaveLength(1);
  });
});

describe('validación', () => {
  const slides = [slide('s1', { bloques: [bloque('b1'), bloque('b2', { estadosPersonalizados: [ok] })] })];
  const ctx = contextoDesdeSlides([], slides);
  it('contextoDesdeSlides recoge los estados declarados', () => {
    expect(estadosPersonalizadosPorBloque(slides)).toEqual({ b2: ['correcto'] });
    expect(estadoDeclarado('correcto', 'b2', ctx.estadosPersonalizados)).toBe(true);
    expect(estadoDeclarado('correcto', 'b1', ctx.estadosPersonalizados)).toBe(false);
  });
  it('validarReglas y validarRegla marcan un estado inexistente', () => {
    const r = deBloque(cambiar('otro'), 'b1');
    expect(validarReglas([r], ctx).map((e) => e.codigo)).toContain('estado_inexistente');
    expect(validarRegla(r.regla, r.origen, ctx).map((a) => a.codigo)).toContain('estado_inexistente');
    const bien = deBloque(cambiar('correcto'), 'b1');
    expect(validarReglas([bien], ctx)).toEqual([]);
    expect(validarRegla(bien.regla, bien.origen, ctx)).toEqual([]);
  });
  it('valida la lista de estados', () => {
    expect(validarEstadosPersonalizados([ok])).toEqual([]);
    expect(validarEstadosPersonalizados([ok, ok]).length).toBeGreaterThan(0);
    expect(validarEstadosPersonalizados([{ ...ok, id: 'hover' }]).length).toBe(1);
    expect(validarEstadosPersonalizados([{ ...ok, nombre: ' ' }]).length).toBe(1);
    const nueve = Array.from({ length: 9 }, (_, i) => ({ ...ok, id: `e${i}` }));
    expect(validarEstadosPersonalizados(nueve)[0]?.indice).toBe(-1);
  });
  it('describe el estado personalizado por su nombre', () => {
    const c = {
      nombreVariable: () => undefined,
      nombreBloque: () => 'Botón',
      tituloSlide: () => undefined,
      nombreCapa: () => undefined,
      nombreEstado: (_b: string, e: string) => (e === 'correcto' ? 'Correcto' : undefined),
    };
    const a = (estado: string) => ({ tipo: 'cambiar_estado', bloqueId: 'b2', estado }) as const;
    expect(describirAccion(a('correcto'), c)).toBe('poner Botón en «Correcto»');
    expect(describirAccion(a('visitado'), c)).toBe('poner Botón en «visitado»');
    expect(describirAccion(a('borrado'), c)).toContain('(eliminado)');
  });
});

describe('uso de un estado', () => {
  it('encuentra acciones y comparaciones, también en sino', () => {
    const r1 = deBloque(cambiar('correcto'), 'b1');
    const r2 = deBloque(
      { ...regla('r2', 'clic', [{ tipo: 'siguiente' }], [cmp({ tipo: 'estado_bloque', bloqueId: 'b2' }, '==', lit('correcto'))]) },
      'b1',
    );
    const r3 = deBloque({ ...regla('r3', 'clic', []), sino: [{ tipo: 'cambiar_estado', bloqueId: 'b2', estado: 'correcto' }] }, 'b1');
    const r4 = deBloque(cambiar('visitado'), 'b1');
    expect(usosDeEstado([r1, r2, r3, r4], 'b2', 'correcto').map((u) => u.reglaId)).toEqual(['r1', 'r2', 'r3']);
    expect(usosDeEstado([r1], 'b9', 'correcto')).toEqual([]);
  });
});

describe('apariencia', () => {
  it('valida rangos y colores', () => {
    expect(validarApariencia({ opacidad: 0.5, escala: 1.1, fondo: '#abc', borde: '#aabbcc', sombra: 2, brillo: 1 })).toEqual([]);
    expect(validarApariencia({ opacidad: 2 }).length).toBe(1);
    expect(validarApariencia({ fondo: 'red' }).length).toBe(1);
    expect(validarApariencia({ fondo: 'url(javascript:1)' }).length).toBe(1);
    expect(validarApariencia({ css: 'x' } as never).length).toBe(1);
    expect(validarApariencia(null).length).toBe(1);
  });
  it('sanea JSON editable', () => {
    expect(sanearApariencia({ opacidad: 9, escala: 1, fondo: 'red', borde: '#fff', css: 'x' })).toEqual({ escala: 1, borde: '#fff' });
    expect(sanearApariencia(7)).toEqual({});
  });
  it('resuelve la apariencia de un estado base, hover/down y personalizado', () => {
    const b = { apariencias: { hover: { escala: 1.1 } }, estadosPersonalizados: [ok] };
    expect(aparienciaDeEstado(b, 'hover')).toEqual({ escala: 1.1 });
    expect(aparienciaDeEstado(b, 'correcto')).toEqual(ok.apariencia);
    expect(aparienciaDeEstado(b, 'visitado')).toBeUndefined();
    expect(aparienciaDeEstado(b, 'zzz')).toBeUndefined();
  });
  it('contraste WCAG', () => {
    expect(razonDeContraste('#000', '#fff')).toBeCloseTo(21, 0);
    expect(cumpleAA('#777777', '#ffffff')).toBe(false);
    expect(cumpleAA('#000000', '#ffffff')).toBe(true);
    expect(cumpleAA('rojo', '#fff')).toBeUndefined();
  });
});
