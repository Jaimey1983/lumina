/** U14+ — validadores e importadores de las actividades nuevas (catálogo posterior a U12). */
import { describe, expect, it } from 'vitest';
import type { EtiquetarImagenActivity, ProblemaPasosActivity, RelacionarLineasActivity } from '@lumina/types/slide';

import { createDefaultEtiquetarImagen } from '../../etiquetar-imagen/etiquetar-imagen-defaults.js';
import { createDefaultProblemaPasos } from '../../problema-pasos/problema-pasos-defaults.js';
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

describe('problema_pasos — validación', () => {
  const pb = (): ProblemaPasosActivity => structuredClone(createDefaultProblemaPasos());
  const er = (a: ProblemaPasosActivity) => validarActividad(a).filter((p) => p.nivel === 'error').map((p) => p.mensaje);
  const av = (a: ProblemaPasosActivity) => validarActividad(a).filter((p) => p.nivel === 'aviso').map((p) => p.mensaje);

  it('lo que se crea por defecto no tiene problemas', () => {
    expect(validarActividad(pb())).toEqual([]);
  });
  it('sin enunciado ni pasos', () => {
    const a = pb();
    a.enunciado = ' ';
    a.pasos = [];
    expect(er(a)).toEqual(['Falta el enunciado.', 'No tiene pasos.']);
  });
  it('instrucción y respuesta faltantes, no numérica, expresión ilegible y tolerancia negativa', () => {
    const a = pb();
    a.pasos[0]!.instruccion = '';
    a.pasos[0]!.respuesta = '';
    a.pasos[1]!.respuesta = 'doce';
    a.pasos[1]!.modo = 'numerico';
    a.pasos[2]!.respuesta = '2(x+';
    a.pasos[1]!.tolerancia = -1;
    const e = er(a);
    expect(e).toContain('Falta la instrucción.');
    expect(e).toContain('Falta la respuesta modelo.');
    expect(e).toContain('La respuesta modelo no es un número.');
    expect(e.some((m) => m.startsWith('La respuesta modelo no se puede leer:'))).toBe(true);
    expect(e).toContain('La tolerancia no puede ser negativa.');
  });
  it('pistas vacías son un aviso', () => {
    const a = pb();
    a.pasos[0]!.pistas = ['Una', ''];
    expect(er(a)).toEqual([]);
    expect(av(a)).toEqual(['Tiene pistas vacías (no se ofrecerán).']);
  });
});

describe('problema_pasos — importación', () => {
  const pb = (): ProblemaPasosActivity => structuredClone(createDefaultProblemaPasos());
  it('el ejemplo se lee entero y deja la actividad sin errores', () => {
    const imp = importadorDe('problema_pasos')!;
    const r = importarTexto(pb(), imp.ejemplo, 'reemplazar');
    expect(r.descartadas).toEqual([]);
    expect(r.leidas).toBe(2);
    expect(r.actividad.pasos.map((p) => p.modo)).toEqual(['numerico', 'algebraico']);
    expect(r.actividad.pasos[1]).toMatchObject({ respuesta: '2000x^2', pistas: ['El área es x por x'] });
    expect(validarActividad(r.actividad).filter((p) => p.nivel === 'error')).toEqual([]);
  });
  it('acepta coma decimal y fracciones; descarta con motivo lo que no se puede leer', () => {
    const r = importarTexto(
      pb(),
      'Instrucción;Respuesta\nA;3,14\nB;3/4\n;5\nC;\nD;doce\nE;=2(x+\nF;7;p1;p2;p3;p4;p5;p6',
      'reemplazar',
    );
    expect(r.leidas).toBe(2);
    expect(r.descartadas.map((d) => d.motivo)).toEqual([
      'Falta la instrucción.',
      'Falta la respuesta.',
      'La respuesta no es un número (para una expresión, empieza con =).',
      expect.stringMatching(/^La expresión no se puede leer:/),
      'Tiene más de 5 pistas.',
    ]);
  });
  it('agregar conserva los pasos anteriores y respeta el máximo de 10', () => {
    const a = pb();
    const filas = Array.from({ length: 12 }, (_, i) => `P${i};${i}`).join('\n');
    const r = importarTexto(a, filas, 'agregar');
    expect(r.actividad.pasos).toHaveLength(10);
    expect(r.actividad.pasos.slice(0, 3)).toEqual(a.pasos);
    expect(r.descartadas).toHaveLength(12 - (10 - 3));
  });
  it('no toca enunciado, secuencial ni ajustes', () => {
    const a = { ...pb(), secuencial: false, ajustes: { estilo: 'examen' as const } };
    const r = importarTexto(a, 'A;1', 'reemplazar').actividad;
    expect([r.enunciado, r.secuencial, r.ajustes]).toEqual([a.enunciado, false, a.ajustes]);
  });
});

describe('etiquetar_imagen — validación', () => {
  const nueva = (): EtiquetarImagenActivity => structuredClone(createDefaultEtiquetarImagen());
  const err = (a: EtiquetarImagenActivity) => validarActividad(a).filter((p) => p.nivel === 'error').map((p) => p.mensaje);
  const avi = (a: EtiquetarImagenActivity) => validarActividad(a).filter((p) => p.nivel === 'aviso').map((p) => p.mensaje);

  it('lo que se crea por defecto no tiene problemas (con un distractor)', () => {
    expect(validarActividad(nueva())).toEqual([]);
  });
  it('sin imagen, con menos de 2 marcadores y etiquetas vacías: no se puede jugar', () => {
    const a = nueva();
    a.imagen = ' ';
    a.zonas = [a.zonas[0]!];
    a.etiquetas[3] = { id: 'etq-4', texto: '' };
    expect(err(a)).toEqual(['Falta la imagen.', 'Necesita al menos 2 marcadores.', 'No tiene texto.']);
  });
  it('marcador sin etiqueta, con etiqueta inexistente o con coordenadas fuera de 0–1', () => {
    const a = nueva();
    a.zonas[0] = { ...a.zonas[0]!, etiquetaId: '' };
    a.zonas[1] = { ...a.zonas[1]!, etiquetaId: 'nada' };
    a.zonas[2] = { ...a.zonas[2]!, x: 1.2 };
    expect(err(a)).toEqual(['No tiene etiqueta asignada.', 'Su etiqueta ya no existe.', 'Está fuera de la imagen.']);
  });
  it('la misma etiqueta en dos marcadores es un error', () => {
    const a = nueva();
    a.zonas[1] = { ...a.zonas[1]!, etiquetaId: a.zonas[0]!.etiquetaId };
    expect(err(a)).toContain('Una misma etiqueta no puede ir en dos marcadores: solo se puede colocar una vez.');
  });
  it('sin texto alternativo es un aviso, no un error', () => {
    const a = nueva();
    a.textoAlternativo = '';
    expect(err(a)).toEqual([]);
    expect(avi(a)).toHaveLength(1);
  });
  it('no tiene importador: la ubicación es visual', () => {
    expect(importadorDe('etiquetar_imagen')).toBeUndefined();
  });
});
