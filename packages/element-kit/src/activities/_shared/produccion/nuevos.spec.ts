/** U14+ — validadores e importadores de las actividades nuevas (catálogo posterior a U12). */
import { describe, expect, it } from 'vitest';
import type { RelacionarLineasActivity } from '@lumina/types/slide';

import { createDefaultRelacionarLineas } from '../../relacionar-lineas/relacionar-lineas-defaults.js';
import { importadorDe, importarTexto } from './importadores.js';
import { validarActividad } from './validacion.js';

const base = (): RelacionarLineasActivity => structuredClone(createDefaultRelacionarLineas());
const errores = (a: RelacionarLineasActivity) => validarActividad(a).filter((p) => p.nivel === 'error').map((p) => p.mensaje);
const avisos = (a: RelacionarLineasActivity) => validarActividad(a).filter((p) => p.nivel === 'aviso').map((p) => p.mensaje);

describe('relacionar_lineas — validación', () => {
  it('lo que se crea por defecto no tiene problemas', () => {
    expect(validarActividad(base())).toEqual([]);
  });
  it('menos de 2 relaciones, elementos vacíos y relaciones rotas', () => {
    const a = base();
    a.relaciones = [a.relaciones[0]!];
    a.izquierda[1] = { id: a.izquierda[1]!.id };
    a.derecha[0] = { id: a.derecha[0]!.id, texto: '  ' };
    const e = errores(a);
    expect(e).toContain('Necesita al menos 2 relaciones.');
    expect(e.filter((m) => m === 'No tiene texto ni imagen.')).toHaveLength(2);
    const rota = base();
    rota.relaciones.push({ izquierdaId: 'nada', derechaId: rota.derecha[0]!.id });
    expect(errores(rota)).toContain('Hay una relación que apunta a un elemento que no existe.');
  });
  it('avisos: izquierda sin pareja, derecha compartida y sin distractores', () => {
    const a = base();
    a.relaciones = a.relaciones.slice(0, 2);
    expect(avisos(a).some((m) => m.endsWith('no tiene pareja: no se podrá calificar.'))).toBe(true);
    const c = base();
    c.relaciones[1] = { izquierdaId: c.relaciones[1]!.izquierdaId, derechaId: c.relaciones[0]!.derechaId };
    expect(avisos(c)).toContain('Dos elementos de la izquierda se unen con el mismo de la derecha.');
    const s = base();
    s.derecha = s.derecha.filter((d) => s.relaciones.some((r) => r.derechaId === d.id));
    expect(avisos(s)).toContain('Todos los de la derecha se usan: sin distractores es un emparejar.');
  });
});

describe('relacionar_lineas — importación', () => {
  it('cada fila crea un elemento a cada lado y su relación; el ejemplo no deja errores', () => {
    const imp = importadorDe('relacionar_lineas')!;
    const r = importarTexto(base(), imp.ejemplo, 'reemplazar');
    expect(r.descartadas).toEqual([]);
    expect(r.leidas).toBe(3);
    expect(r.actividad.izquierda.map((i) => i.texto)).toEqual(['Colombia', 'Perú', 'Chile']);
    expect(r.actividad.derecha.map((d) => d.texto)).toEqual(['Bogotá', 'Lima', 'Santiago']);
    expect(r.actividad.relaciones).toHaveLength(3);
    expect(validarActividad(r.actividad).filter((p) => p.nivel === 'error')).toEqual([]);
  });
  it('agregar conserva lo anterior (incluidos los distractores); respeta los máximos y descarta con motivo', () => {
    const a = base();
    const antes = { i: a.izquierda.length, d: a.derecha.length };
    const filas = Array.from({ length: 6 }, (_, i) => `L${i};R${i}`).join('\n');
    const r = importarTexto(a, `Izquierda;Derecha\n${filas}\nsola;`, 'agregar');
    expect(r.actividad.izquierda).toHaveLength(8);
    expect(r.actividad.derecha).toHaveLength(antes.d + (8 - antes.i));
    expect(r.actividad.derecha.slice(0, antes.d)).toEqual(a.derecha);
    expect(r.descartadas.map((d) => d.motivo)).toEqual([
      'Se superó el máximo de 8 a la izquierda.',
      'Se superó el máximo de 8 a la izquierda.',
      'Cada fila necesita los dos lados.',
    ]);
  });
  it('no toca ajustes ni instrucción', () => {
    const a = { ...base(), ajustes: { estilo: 'examen' as const } };
    const r = importarTexto(a, 'A;1', 'reemplazar').actividad;
    expect(r.ajustes).toEqual(a.ajustes);
    expect(r.instruccion).toBe(a.instruccion);
  });
});
