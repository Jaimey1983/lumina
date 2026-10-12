/**
 * U12.2a — importadores de actividades hechas de preguntas con opciones: opción múltiple, torneo,
 * globos, topo, video interactivo, verdadero/falso y encuesta.
 *
 * Convención de opciones (común a todos): la opción correcta lleva `*` al inicio; si ninguna lo lleva,
 * la correcta es la primera. Varias con `*` = varias correctas (solo donde el tipo lo permite).
 */
import type {
  GlobosActivity,
  LivePoll,
  QuizMultiple,
  QuizPregunta,
  TopoActivity,
  TorneoActivity,
  TrueFalse,
  VideoInteractive,
  VideoQuestion,
} from '@lumina/types/slide';

import {
  celdasConTexto,
  combinar,
  nuevoId,
  prepararFilas,
  type FilaDescartada,
  type Importador,
  type ModoImportacion,
  type ResultadoImportacion,
} from './importacion.js';
import { sinAcentos } from './tabla.js';

interface OpcionLeida {
  texto: string;
  correcta: boolean;
}

/** Interpreta las celdas de opciones con la convención del `*`. `null` si no hay ninguna. */
function leerOpciones(celdas: readonly string[]): OpcionLeida[] | null {
  const textos = celdasConTexto(celdas);
  if (textos.length === 0) return null;
  const ops = textos.map((t) => {
    const marcada = t.startsWith('*');
    return { texto: (marcada ? t.slice(1) : t).trim(), correcta: marcada };
  });
  if (!ops.some((o) => o.correcta)) ops[0]!.correcta = true;
  return ops.filter((o) => o.texto.length > 0);
}

interface PreguntaLeida {
  enunciado: string;
  opciones: OpcionLeida[];
}

interface ReglasPregunta {
  minOpciones: number;
  maxOpciones: number;
  /** Cuántas correctas admite; `1` descarta las filas con varios `*`. */
  maxCorrectas: number;
}

/** Lee `pregunta | opción…` de cada fila; el resto de las filas va a `descartadas`. */
function leerPreguntas(
  filas: readonly { fila: number; celdas: readonly string[] }[],
  reglas: ReglasPregunta,
): { ok: PreguntaLeida[]; descartadas: FilaDescartada[] } {
  const ok: PreguntaLeida[] = [];
  const descartadas: FilaDescartada[] = [];
  for (const { fila, celdas } of filas) {
    const texto = celdas.join(' | ');
    const rechazar = (motivo: string) => descartadas.push({ fila, motivo, texto });
    const enunciado = (celdas[0] ?? '').trim();
    if (!enunciado) {
      rechazar('Falta la pregunta.');
      continue;
    }
    const opciones = leerOpciones(celdas.slice(1));
    if (!opciones || opciones.length < reglas.minOpciones) {
      rechazar(`Necesita al menos ${reglas.minOpciones} opciones.`);
      continue;
    }
    if (opciones.length > reglas.maxOpciones) {
      rechazar(`Tiene más de ${reglas.maxOpciones} opciones.`);
      continue;
    }
    if (opciones.filter((o) => o.correcta).length > reglas.maxCorrectas) {
      rechazar(reglas.maxCorrectas === 1 ? 'Solo puede tener una opción correcta.' : 'Tiene demasiadas opciones correctas.');
      continue;
    }
    ok.push({ enunciado, opciones });
  }
  return { ok, descartadas };
}

const ENCABEZADOS_PREGUNTA = ['pregunta', 'enunciado', 'preguntas'];

// ─── Opción múltiple ──────────────────────────────────────────────────────────

export const importadorQuizMultiple: Importador<QuizMultiple> = {
  tipo: 'quiz_multiple',
  titulo: 'Preguntas',
  formato: 'Pregunta ; opción ; *opción correcta ; opción …  (la correcta lleva * al inicio)',
  ejemplo: '¿Capital de Colombia?;*Bogotá;Lima;Quito\n¿Cuántos lados tiene un triángulo?;2;*3;4;5',
  encabezados: ENCABEZADOS_PREGUNTA,
  importar(actividad, filas, modo) {
    const { ok, descartadas } = leerPreguntas(prepararFilas(filas, ENCABEZADOS_PREGUNTA, sinAcentos), {
      minOpciones: 2,
      maxOpciones: 10,
      maxCorrectas: 10,
    });
    const nuevas: QuizPregunta[] = ok.map((p) => ({
      id: nuevoId('q'),
      texto: p.enunciado,
      opciones: p.opciones.map((o) => ({ id: nuevoId('o'), texto: o.texto, esCorrecta: o.correcta })),
      ...(p.opciones.filter((o) => o.correcta).length > 1 ? { multipleRespuesta: true } : {}),
    }));
    return {
      actividad: { ...actividad, preguntas: combinar(actividad.preguntas ?? [], nuevas, modo) },
      leidas: nuevas.length,
      descartadas,
    };
  },
};

// ─── Torneo ───────────────────────────────────────────────────────────────────

const TORNEO_TIEMPO_POR_DEFECTO = 20;

export const importadorTorneo: Importador<TorneoActivity> = {
  tipo: 'torneo',
  titulo: 'Preguntas',
  formato: 'Pregunta ; opción ; *opción correcta ; … (de 2 a 4 opciones, una sola correcta)',
  ejemplo: '¿Cuánto es 7 × 8?;54;*56;58;64\n¿Planeta rojo?;*Marte;Venus',
  encabezados: ENCABEZADOS_PREGUNTA,
  importar(actividad, filas, modo) {
    const { ok, descartadas } = leerPreguntas(prepararFilas(filas, ENCABEZADOS_PREGUNTA, sinAcentos), {
      minOpciones: 2,
      maxOpciones: 4,
      maxCorrectas: 1,
    });
    const nuevas = ok.map((p) => ({
      enunciado: p.enunciado,
      opciones: p.opciones.map((o) => o.texto),
      correcta: p.opciones.find((o) => o.correcta)!.texto,
      tiempoSegundos: TORNEO_TIEMPO_POR_DEFECTO,
    }));
    return {
      actividad: { ...actividad, preguntas: combinar(actividad.preguntas ?? [], nuevas, modo) },
      leidas: nuevas.length,
      descartadas,
    };
  },
};

// ─── Globos y topo ────────────────────────────────────────────────────────────

function importadorArcade<A extends GlobosActivity | TopoActivity>(
  tipo: A['tipo'],
  min: number,
  max: number,
  ejemplo: string,
): Importador<A> {
  return {
    tipo,
    titulo: 'Preguntas',
    formato: `Pregunta ; opción ; *opción correcta ; … (de ${min} a ${max} opciones, una sola correcta)`,
    ejemplo,
    encabezados: ENCABEZADOS_PREGUNTA,
    importar(actividad, filas, modo) {
      const { ok, descartadas } = leerPreguntas(prepararFilas(filas, ENCABEZADOS_PREGUNTA, sinAcentos), {
        minOpciones: min,
        maxOpciones: max,
        maxCorrectas: 1,
      });
      const nuevas = ok.map((p) => ({
        id: nuevoId('q'),
        enunciado: p.enunciado,
        opciones: p.opciones.map((o) => ({ texto: o.texto, correcta: o.correcta })),
      }));
      return {
        actividad: { ...actividad, preguntas: combinar(actividad.preguntas ?? [], nuevas, modo) },
        leidas: nuevas.length,
        descartadas,
      } as ResultadoImportacion<A>;
    },
  };
}

export const importadorGlobos = importadorArcade<GlobosActivity>(
  'globos',
  3,
  8,
  '¿Capital de Francia?;*París;Roma;Madrid;Berlín\n¿Cuánto es 2 + 2?;3;*4;5',
);
export const importadorTopo = importadorArcade<TopoActivity>(
  'topo',
  2,
  8,
  '¿Capital de Francia?;*París;Roma;Madrid\n¿Cuánto es 2 + 2?;3;*4',
);

// ─── Video interactivo ────────────────────────────────────────────────────────

/** `90`, `1:30` o `0:01:30` → segundos; `null` si no se entiende. */
export function leerSegundo(texto: string): number | null {
  const t = texto.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const partes = t.split(':');
  if (partes.length < 2 || partes.length > 3 || partes.some((p) => !/^\d+$/.test(p))) return null;
  return partes.reduce((acc, p) => acc * 60 + Number(p), 0);
}

const ENCABEZADOS_VIDEO = ['segundo', 'tiempo', 'minuto', 'momento'];

export const importadorVideoInteractivo: Importador<VideoInteractive> = {
  tipo: 'video_interactivo',
  titulo: 'Preguntas del video',
  formato: 'Segundo (o m:ss) ; pregunta ; opción ; *opción correcta ; … (una sola correcta)',
  ejemplo: '0:30;¿Qué se ve en pantalla?;*Un volcán;Un río;Un lago\n1:45;¿Cuántos son?;2;*3',
  encabezados: ENCABEZADOS_VIDEO,
  importar(actividad, filas, modo) {
    const preparadas = prepararFilas(filas, ENCABEZADOS_VIDEO, sinAcentos);
    const nuevas: VideoQuestion[] = [];
    const descartadas: FilaDescartada[] = [];
    for (const { fila, celdas } of preparadas) {
      const segundo = leerSegundo(celdas[0] ?? '');
      if (segundo === null) {
        descartadas.push({ fila, motivo: 'El primer dato debe ser el segundo del video (90 o 1:30).', texto: celdas.join(' | ') });
        continue;
      }
      const { ok, descartadas: malas } = leerPreguntas([{ fila, celdas: celdas.slice(1) }], {
        minOpciones: 2,
        maxOpciones: 10,
        maxCorrectas: 1,
      });
      descartadas.push(...malas);
      for (const p of ok) {
        nuevas.push({
          id: nuevoId('vq'),
          tiempoSegundos: segundo,
          pregunta: p.enunciado,
          opciones: p.opciones.map((o) => ({ id: nuevoId('o'), texto: o.texto, esCorrecta: o.correcta })),
          pausarVideo: true,
        });
      }
    }
    return {
      actividad: { ...actividad, preguntas: combinar(actividad.preguntas ?? [], nuevas, modo) },
      leidas: nuevas.length,
      descartadas,
    };
  },
};

// ─── Verdadero o falso ────────────────────────────────────────────────────────

const VERDADEROS = ['verdadero', 'v', 'true', 'si', 'sí', 'cierto'];
const FALSOS = ['falso', 'f', 'false', 'no'];
const ENCABEZADOS_VF = ['afirmacion', 'enunciado'];

export const importadorVerdaderoFalso: Importador<TrueFalse> = {
  tipo: 'verdadero_falso',
  titulo: 'Afirmación',
  formato: 'Afirmación ; Verdadero o Falso  (esta actividad tiene una sola afirmación: se usa la primera fila)',
  ejemplo: 'El sol es una estrella;Verdadero',
  encabezados: ENCABEZADOS_VF,
  importar(actividad, filas) {
    const preparadas = prepararFilas(filas, ENCABEZADOS_VF, sinAcentos);
    const descartadas: FilaDescartada[] = [];
    let actual = actividad;
    let leidas = 0;
    for (const { fila, celdas } of preparadas) {
      const texto = celdas.join(' | ');
      if (leidas === 1) {
        descartadas.push({ fila, motivo: 'Verdadero o falso tiene una sola afirmación: se usó la primera fila.', texto });
        continue;
      }
      const afirmacion = (celdas[0] ?? '').trim();
      const valor = sinAcentos(celdas[1] ?? '');
      if (!afirmacion) {
        descartadas.push({ fila, motivo: 'Falta la afirmación.', texto });
      } else if (!VERDADEROS.map(sinAcentos).includes(valor) && !FALSOS.includes(valor)) {
        descartadas.push({ fila, motivo: 'La segunda columna debe ser Verdadero o Falso.', texto });
      } else {
        actual = { ...actual, afirmacion, respuestaCorrecta: VERDADEROS.map(sinAcentos).includes(valor) };
        leidas = 1;
      }
    }
    return { actividad: actual, leidas, descartadas };
  },
};

// ─── Encuesta ─────────────────────────────────────────────────────────────────

const ENCABEZADOS_ENCUESTA = ['opcion', 'opciones', 'respuesta'];

export const importadorEncuestaViva: Importador<LivePoll> = {
  tipo: 'encuesta_viva',
  titulo: 'Opciones',
  formato: 'Una opción por fila (la pregunta no cambia)',
  ejemplo: 'Muy de acuerdo\nDe acuerdo\nEn desacuerdo',
  encabezados: ENCABEZADOS_ENCUESTA,
  importar(actividad, filas, modo) {
    const preparadas = prepararFilas(filas, ENCABEZADOS_ENCUESTA, sinAcentos);
    const nuevas: LivePoll['opciones'] = [];
    const descartadas: FilaDescartada[] = [];
    for (const { fila, celdas } of preparadas) {
      const texto = (celdas[0] ?? '').trim();
      if (!texto) descartadas.push({ fila, motivo: 'La opción está vacía.', texto: celdas.join(' | ') });
      else nuevas.push({ id: nuevoId('o'), texto });
    }
    return {
      actividad: { ...actividad, opciones: combinar(actividad.opciones ?? [], nuevas, modo) },
      leidas: nuevas.length,
      descartadas,
    };
  },
};

export type { ModoImportacion };
