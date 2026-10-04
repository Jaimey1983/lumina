// Etapa N / N7: variables del sistema de solo lectura (D18).
import { describe, expect, it } from 'vitest';
import type { ClaveSistema } from '@lumina/types/interaction';
import { crearEstadoInicial, entrarASlide } from './estado.js';
import { procesarEvento } from './motor.js';
import { bloque, cmp, deSlide, lit, regla, slide } from './prueba-utils.js';
import {
  TIEMPO_MAX_S,
  calcularSistema,
  conTiempoActivo,
  marcaDeVisitado,
  slidesVisitados,
  tiempoActivoPersistido,
} from './sistema.js';
import { CLAVES_SISTEMA } from './tipos.js';

const ids = ['s1', 's2', 's3', 's4'];
const slides = ids.map((id) => slide(id, { bloques: [bloque(`b-${id}`)] }));
const sis = (clave: ClaveSistema) => ({ tipo: 'sistema', clave }) as const;

describe('visitados y progreso', () => {
  it('crearEstadoInicial no marca nada como visitado; entrarASlide sí', () => {
    const inicial = crearEstadoInicial([], slides);
    expect(slidesVisitados(inicial, ids)).toBe(0);
    const e = entrarASlide(entrarASlide(inicial, { ...slides[0]!, id: 's1' }), { ...slides[1]!, id: 's2' });
    expect(slidesVisitados(e, ids)).toBe(2);
    expect(e.visibles[marcaDeVisitado('s1')]).toBe(true);
  });
  it('volver a entrar no cuenta dos veces; slides que ya no existen no cuentan', () => {
    let e = crearEstadoInicial([], slides);
    e = entrarASlide(e, { ...slides[0]!, id: 's1' });
    e = entrarASlide(e, { ...slides[0]!, id: 's1' });
    expect(slidesVisitados(e, ids)).toBe(1);
    expect(slidesVisitados({ visibles: { ...e.visibles, [marcaDeVisitado('borrado')]: true } }, ids)).toBe(1);
  });
});

describe('calcularSistema', () => {
  const visibles = Object.fromEntries(['s1', 's2'].map((i) => [marcaDeVisitado(i), true]));
  const base = { estado: { visibles }, slideIds: ids, slideId: 's2', tiempoActivoS: 12.9, intento: 3 };
  it('calcula las cinco claves de D18', () => {
    expect(calcularSistema(base)).toEqual({
      slide_total: 4,
      slide_numero: 2,
      progreso_pct: 50,
      tiempo_s: 12,
      intento: 3,
    });
  });
  it('progreso_pct es entero, 0–100', () => {
    expect(calcularSistema({ ...base, estado: { visibles: { [marcaDeVisitado('s1')]: true } }, slideIds: ['s1', 's2', 's3'] }).progreso_pct).toBe(33);
    expect(calcularSistema({ ...base, estado: { visibles: {} } }).progreso_pct).toBe(0);
    const todos = Object.fromEntries(ids.map((i) => [marcaDeVisitado(i), true]));
    expect(calcularSistema({ ...base, estado: { visibles: todos } }).progreso_pct).toBe(100);
  });
  it('omite lo que no se sabe (falla cerrado en el evaluador)', () => {
    expect(calcularSistema({ ...base, slideId: undefined }).slide_numero).toBeUndefined();
    expect(calcularSistema({ ...base, slideId: 'otro' }).slide_numero).toBeUndefined();
    expect(calcularSistema({ ...base, slideIds: [] })).toEqual({ tiempo_s: 12, intento: 3 });
    expect(calcularSistema({ ...base, intento: 0 }).intento).toBeUndefined();
    expect(calcularSistema({ ...base, tiempoActivoS: Number.NaN }).tiempo_s).toBeUndefined();
  });
  it('solo produce claves de D18 y ninguna menciona nota/puntaje (C1/C4)', () => {
    const claves = Object.keys(calcularSistema(base));
    for (const k of claves) expect(CLAVES_SISTEMA).toContain(k);
    expect(claves.join(' ')).not.toMatch(/nota|puntaje|score|banda/i);
  });
});

describe('tiempo activo persistido', () => {
  const e0 = crearEstadoInicial([], slides);
  it('sin marca vale 0 y sellar 0 no cambia nada', () => {
    expect(tiempoActivoPersistido(e0)).toBe(0);
    expect(conTiempoActivo(e0, 0)).toBe(e0);
  });
  it('sella, reemplaza la marca anterior y devuelve el mismo objeto si no cambia', () => {
    const a = conTiempoActivo(e0, 7.8);
    expect(tiempoActivoPersistido(a)).toBe(7);
    const b = conTiempoActivo(a, 20);
    expect(tiempoActivoPersistido(b)).toBe(20);
    expect(Object.keys(b.visibles).filter((k) => k.startsWith('\u001d'))).toHaveLength(1);
    expect(conTiempoActivo(b, 20)).toBe(b);
  });
  it('sobrevive a un viaje por JSON y conserva el resto de marcas', () => {
    const e = conTiempoActivo(entrarASlide(e0, { ...slides[0]!, id: 's1' }), 42);
    const ida = JSON.parse(JSON.stringify(e)) as typeof e;
    expect(tiempoActivoPersistido(ida)).toBe(42);
    expect(slidesVisitados(ida, ids)).toBe(1);
  });
  it('un JSON hostil no lo rompe (no numérico, enorme, varias marcas)', () => {
    const v = { '\u001dabc': true, '\u001d99999999999': true, '\u001d5': true, '\u001d9': true } as Record<string, boolean>;
    expect(tiempoActivoPersistido({ visibles: v })).toBe(9);
    expect(tiempoActivoPersistido({ visibles: { [`\u001d${TIEMPO_MAX_S + 1}`]: true } })).toBe(0);
  });
});

describe('motor con variables del sistema', () => {
  const ultimo = regla('r', 'al_entrar_slide', [{ tipo: 'mostrar', bloqueId: 'meta' }], [
    cmp(sis('slide_numero'), '==', sis('slide_total')),
  ]);
  const reglas = [deSlide(ultimo, 's4')];
  const correr = (sistema?: Partial<Record<ClaveSistema, number>>) =>
    procesarEvento(reglas, crearEstadoInicial([], slides), { tipo: 'al_entrar_slide', slideId: 's4' }, { variables: [], ...(sistema ? { sistema } : {}) });

  it('slide_numero == slide_total en el último slide → mostrar', () => {
    const r = correr(calcularSistema({ estado: { visibles: {} }, slideIds: ids, slideId: 's4', tiempoActivoS: 0, intento: 1 }));
    expect(r.estado.visibles.meta).toBe(true);
  });
  it('en otro slide no dispara', () => {
    const r = correr(calcularSistema({ estado: { visibles: {} }, slideIds: ids, slideId: 's3', tiempoActivoS: 0, intento: 1 }));
    expect(r.estado.visibles.meta).toBeUndefined();
  });
  it('sin datos del sistema falla cerrado y deja aviso', () => {
    const r = correr();
    expect(r.estado.visibles.meta).toBeUndefined();
    expect(r.avisos.map((a) => a.codigo)).toContain('sistema_no_disponible');
  });
  it('«progreso ≥ 50» y «pasaron 60 s» se evalúan con las claves derivadas', () => {
    const r = procesarEvento(
      [deSlide(regla('p', 'al_entrar_slide', [{ tipo: 'mostrar', bloqueId: 'x' }], [cmp(sis('progreso_pct'), '>=', lit(50)), cmp(sis('tiempo_s'), '>=', lit(60))]), 's2')],
      crearEstadoInicial([], slides),
      { tipo: 'al_entrar_slide', slideId: 's2' },
      { variables: [], sistema: { progreso_pct: 50, tiempo_s: 61 } },
    );
    expect(r.estado.visibles.x).toBe(true);
  });
});
