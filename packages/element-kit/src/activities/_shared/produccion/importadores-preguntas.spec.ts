import { describe, expect, it } from 'vitest';
import type {
  GlobosActivity,
  LivePoll,
  QuizMultiple,
  TopoActivity,
  TorneoActivity,
  TrueFalse,
  VideoInteractive,
} from '@lumina/types/slide';

import { createDefaultGlobos } from '../../globos/globos-defaults.js';
import { createDefaultTopo } from '../../topo/topo-defaults.js';
import { createDefaultTorneo } from '../../torneo/torneo-defaults.js';
import { livePollTemplate, quizMultipleTemplate, trueFalseTemplate, videoInteractiveTemplate } from '../../_classic/activity-templates.js';
import { importadorDe, importarTexto, tiposImportables } from './importadores.js';
import { leerSegundo } from './importadores-preguntas.js';
import { validarActividad } from './validacion.js';

const nueva = <A,>(f: () => unknown): A => structuredClone(f()) as A;

describe('importadorDe', () => {
  it('cubre los 7 tipos de preguntas y cada uno trae formato y ejemplo', () => {
    expect(tiposImportables().sort()).toEqual(
      ['encuesta_viva', 'globos', 'quiz_multiple', 'topo', 'torneo', 'verdadero_falso', 'video_interactivo'].sort(),
    );
    for (const t of tiposImportables()) {
      const i = importadorDe(t as never)!;
      expect(i.formato.length, t).toBeGreaterThan(10);
      expect(i.ejemplo.length, t).toBeGreaterThan(5);
    }
  });
  it('el texto de ejemplo de cada importador se lee entero y deja una actividad sin errores', () => {
    const bases: Record<string, unknown> = {
      quiz_multiple: nueva(quizMultipleTemplate),
      torneo: nueva(createDefaultTorneo),
      globos: nueva(createDefaultGlobos),
      topo: nueva(createDefaultTopo),
      video_interactivo: { ...nueva<VideoInteractive>(videoInteractiveTemplate), urlVideo: 'https://x.dev/v.mp4' },
      verdadero_falso: nueva(trueFalseTemplate),
      encuesta_viva: nueva(livePollTemplate),
    };
    for (const [tipo, base] of Object.entries(bases)) {
      const r = importarTexto(base as never, importadorDe(tipo as never)!.ejemplo, 'reemplazar');
      expect(r.descartadas, tipo).toEqual([]);
      expect(r.leidas, tipo).toBeGreaterThan(0);
      expect(validarActividad(r.actividad).filter((p) => p.nivel === 'error'), tipo).toEqual([]);
    }
  });
  it('un tipo sin importador devuelve la actividad intacta', () => {
    const a = { tipo: 'memoria' } as never;
    expect(importarTexto(a, 'x', 'agregar')).toEqual({ actividad: a, leidas: 0, descartadas: [] });
  });
});

describe('opción múltiple', () => {
  const base = () => nueva<QuizMultiple>(quizMultipleTemplate);
  it('la primera es la correcta si ninguna lleva *', () => {
    const r = importarTexto(base(), '¿2+2?;4;3;5', 'reemplazar');
    expect(r.leidas).toBe(1);
    const p = r.actividad.preguntas[0]!;
    expect(p.texto).toBe('¿2+2?');
    expect(p.opciones.map((o) => [o.texto, o.esCorrecta])).toEqual([['4', true], ['3', false], ['5', false]]);
    expect(p.multipleRespuesta).toBeUndefined();
  });
  it('el * marca la correcta y varias * activan respuesta múltiple', () => {
    const r = importarTexto(base(), 'A;uno;*dos;*tres\nB;x;*y', 'reemplazar');
    expect(r.actividad.preguntas[0]!.opciones.map((o) => o.esCorrecta)).toEqual([false, true, true]);
    expect(r.actividad.preguntas[0]!.multipleRespuesta).toBe(true);
    expect(r.actividad.preguntas[1]!.multipleRespuesta).toBeUndefined();
  });
  it('agregar suma al final; reemplazar deja solo lo importado; ids nuevos y únicos', () => {
    const a = base();
    const antes = a.preguntas.length;
    const sumado = importarTexto(a, 'P;*a;b', 'agregar').actividad;
    expect(sumado.preguntas).toHaveLength(antes + 1);
    expect(sumado.preguntas.slice(0, antes)).toEqual(a.preguntas);
    const solo = importarTexto(a, 'P;*a;b\nQ;*a;b', 'reemplazar').actividad;
    expect(solo.preguntas).toHaveLength(2);
    const ids = solo.preguntas.flatMap((p) => [p.id, ...p.opciones.map((o) => o.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('no toca nada más que las preguntas (tipo, ajustes, layout)', () => {
    const a = { ...base(), ajustes: { estilo: 'examen' as const, sonido: false }, layoutVariant: 'color-grid' as const };
    const r = importarTexto(a, 'P;*a;b', 'reemplazar').actividad;
    expect({ ...r, preguntas: a.preguntas }).toEqual(a);
  });
  it('descarta con motivo y número de fila lo que no puede leer; nunca en silencio', () => {
    const r = importarTexto(base(), 'Pregunta;Opción\n;a;b\nSola;única\nOk;*a;b', 'reemplazar');
    expect(r.leidas).toBe(1);
    expect(r.descartadas).toEqual([
      { fila: 2, motivo: 'Falta la pregunta.', texto: ' | a | b' },
      { fila: 3, motivo: 'Necesita al menos 2 opciones.', texto: 'Sola | única' },
    ]);
  });
  it('con encabezado «Pregunta» lo salta y respeta tildes y Ñ', () => {
    const r = importarTexto(base(), 'Pregunta;Correcta;Otra\n¿Cómo se dice «niño» en inglés?;*boy;Ñandú', 'reemplazar');
    expect(r.leidas).toBe(1);
    expect(r.descartadas).toEqual([]);
    expect(r.actividad.preguntas[0]!.opciones[1]!.texto).toBe('Ñandú');
  });
  it('acepta pegar desde una hoja de cálculo (tabuladores) y comillas', () => {
    const r = importarTexto(base(), '"¿Cuál; la mejor?"\t*Esta\tOtra', 'reemplazar');
    expect(r.actividad.preguntas[0]!.texto).toBe('¿Cuál; la mejor?');
  });
});

describe('torneo', () => {
  const base = () => nueva<TorneoActivity>(createDefaultTorneo);
  it('de 2 a 4 opciones, una correcta, tiempo por defecto', () => {
    const r = importarTexto(base(), '¿7×8?;54;*56;58;64\nMarte?;*Sí;No', 'reemplazar');
    expect(r.actividad.preguntas).toEqual([
      { enunciado: '¿7×8?', opciones: ['54', '56', '58', '64'], correcta: '56', tiempoSegundos: 20 },
      { enunciado: 'Marte?', opciones: ['Sí', 'No'], correcta: 'Sí', tiempoSegundos: 20 },
    ]);
  });
  it('más de 4 opciones o dos correctas se descartan con motivo', () => {
    const r = importarTexto(base(), 'A;1;2;3;4;5\nB;*1;*2', 'reemplazar');
    expect(r.leidas).toBe(0);
    expect(r.descartadas.map((d) => d.motivo)).toEqual(['Tiene más de 4 opciones.', 'Solo puede tener una opción correcta.']);
  });
  it('conserva puntos base y bonus', () => {
    const a = { ...base(), puntosBase: 777, bonusVelocidad: 55 };
    const r = importarTexto(a, 'A;*1;2', 'agregar').actividad;
    expect([r.puntosBase, r.bonusVelocidad]).toEqual([777, 55]);
  });
});

describe('globos y topo', () => {
  it('globos exige de 3 a 8 opciones; topo de 2 a 8', () => {
    const g = importarTexto(nueva<GlobosActivity>(createDefaultGlobos), 'A;*1;2\nB;*1;2;3', 'reemplazar');
    expect(g.leidas).toBe(1);
    expect(g.descartadas[0]!.motivo).toBe('Necesita al menos 3 opciones.');
    expect(g.actividad.preguntas[0]!.opciones).toEqual([
      { texto: '1', correcta: true },
      { texto: '2', correcta: false },
      { texto: '3', correcta: false },
    ]);
    const t = importarTexto(nueva<TopoActivity>(createDefaultTopo), 'A;*1;2\nB;1;2;3;4;5;6;7;8;9', 'agregar');
    expect(t.leidas).toBe(1);
    expect(t.descartadas[0]!.motivo).toBe('Tiene más de 8 opciones.');
    expect(t.actividad.preguntas.length).toBeGreaterThan(1);
  });
  it('conserva la configuración (vidas, velocidad, colores)', () => {
    const a = nueva<GlobosActivity>(createDefaultGlobos);
    const r = importarTexto(a, 'A;*1;2;3', 'reemplazar').actividad;
    expect(r.configuracion).toEqual(a.configuracion);
  });
});

describe('video interactivo', () => {
  it('lee segundos y m:ss', () => {
    expect(leerSegundo('90')).toBe(90);
    expect(leerSegundo('1:30')).toBe(90);
    expect(leerSegundo('0:01:30')).toBe(90);
    expect(leerSegundo('1:3x')).toBeNull();
    expect(leerSegundo('abc')).toBeNull();
  });
  it('convierte filas en preguntas con pausa y conserva la dirección del video', () => {
    const a = { ...nueva<VideoInteractive>(videoInteractiveTemplate), urlVideo: 'https://x.dev/v.mp4' };
    const r = importarTexto(a, 'Segundo;Pregunta;Opciones\n0:30;¿Qué ves?;*Volcán;Río\nmal;¿?;*a;b', 'reemplazar');
    expect(r.actividad.urlVideo).toBe('https://x.dev/v.mp4');
    expect(r.actividad.preguntas).toHaveLength(1);
    expect(r.actividad.preguntas[0]).toMatchObject({ tiempoSegundos: 30, pregunta: '¿Qué ves?', pausarVideo: true });
    expect(r.descartadas).toEqual([
      { fila: 3, motivo: 'El primer dato debe ser el segundo del video (90 o 1:30).', texto: 'mal | ¿? | *a | b' },
    ]);
  });
});

describe('verdadero o falso y encuesta', () => {
  it('V/F: usa la primera fila válida y avisa de las demás', () => {
    const r = importarTexto(nueva<TrueFalse>(trueFalseTemplate), 'Afirmación;Respuesta\nLa Tierra es plana;Falso\nOtra;Verdadero\nmala;quizá', 'reemplazar');
    expect(r.actividad).toMatchObject({ afirmacion: 'La Tierra es plana', respuestaCorrecta: false });
    expect(r.leidas).toBe(1);
    expect(r.descartadas.map((d) => d.fila)).toEqual([3, 4]);
  });
  it('V/F: acepta V, sí y verdadero sin importar acentos', () => {
    for (const v of ['V', 'sí', 'Verdadero', 'true']) {
      expect(importarTexto(nueva<TrueFalse>(trueFalseTemplate), `X;${v}`, 'reemplazar').actividad.respuestaCorrecta).toBe(true);
    }
  });
  it('V/F: segunda columna inválida se descarta', () => {
    const r = importarTexto(nueva<TrueFalse>(trueFalseTemplate), 'X;talvez', 'reemplazar');
    expect(r.leidas).toBe(0);
    expect(r.descartadas[0]!.motivo).toBe('La segunda columna debe ser Verdadero o Falso.');
  });
  it('encuesta: cada fila es una opción; la pregunta no cambia', () => {
    const a = nueva<LivePoll>(livePollTemplate);
    const r = importarTexto(a, 'Opciones\nSí\nNo\n"Tal vez; depende"', 'reemplazar');
    expect(r.actividad.opciones.map((o) => o.texto)).toEqual(['Sí', 'No', 'Tal vez; depende']);
    expect(r.actividad.pregunta).toBe(a.pregunta);
    const mas = importarTexto(a, 'Una más', 'agregar').actividad;
    expect(mas.opciones).toHaveLength(a.opciones.length + 1);
  });
});
