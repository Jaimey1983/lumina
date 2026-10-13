/**
 * U12 / catálogo nuevo (U14+) — importadores de las actividades creadas después de U12.
 */
import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type {
  ClozeBancoActivity,
  LineaTiempoActivity,
  ProblemaPaso,
  ProblemaPasosActivity,
  RelacionarLineasActivity,
} from '@lumina/types/slide';

import { CLOZE_MAX_BLANCOS, generarIdCloze } from '../../cloze-banco/cloze-banco-config.js';
import { LINEA_MAX_EVENTOS } from '../../linea-tiempo/linea-tiempo-config.js';
import { PROBLEMA_MAX_PASOS, PROBLEMA_MAX_PISTAS_POR_PASO } from '../../problema-pasos/problema-pasos-config.js';
import { RELACIONAR_MAX_DERECHA, RELACIONAR_MAX_IZQUIERDA } from '../../relacionar-lineas/relacionar-lineas-config.js';
import { nuevoId, prepararFilas, type FilaDescartada, type Importador } from './importacion.js';
import { sinAcentos } from './tabla.js';

export const importadorRelacionarLineas: Importador<RelacionarLineasActivity> = {
  tipo: 'relacionar_lineas',
  titulo: 'Pares',
  formato: 'Izquierda ; Derecha  (una relación por fila; los distractores se agregan a mano)',
  ejemplo: 'Colombia;Bogotá\nPerú;Lima\nChile;Santiago',
  encabezados: ['izquierda', 'termino', 'concepto'],
  importar(actividad, filas, modo) {
    const izquierda = modo === 'reemplazar' ? [] : [...(actividad.izquierda ?? [])];
    const derecha = modo === 'reemplazar' ? [] : [...(actividad.derecha ?? [])];
    const relaciones = modo === 'reemplazar' ? [] : [...(actividad.relaciones ?? [])];
    const descartadas: FilaDescartada[] = [];
    let leidas = 0;
    for (const { fila, celdas } of prepararFilas(filas, ['izquierda', 'termino', 'concepto'], sinAcentos)) {
      const texto = celdas.join(' | ');
      const l = (celdas[0] ?? '').trim();
      const r = (celdas[1] ?? '').trim();
      if (!l || !r) {
        descartadas.push({ fila, motivo: 'Cada fila necesita los dos lados.', texto });
      } else if (izquierda.length >= RELACIONAR_MAX_IZQUIERDA) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${RELACIONAR_MAX_IZQUIERDA} a la izquierda.`, texto });
      } else if (derecha.length >= RELACIONAR_MAX_DERECHA) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${RELACIONAR_MAX_DERECHA} a la derecha.`, texto });
      } else {
        const izq = { id: nuevoId('izq'), texto: l };
        const der = { id: nuevoId('der'), texto: r };
        izquierda.push(izq);
        derecha.push(der);
        relaciones.push({ izquierdaId: izq.id, derechaId: der.id });
        leidas += 1;
      }
    }
    return { actividad: { ...actividad, izquierda, derecha, relaciones }, leidas, descartadas };
  },
};

export const importadorProblemaPasos: Importador<ProblemaPasosActivity> = {
  tipo: 'problema_pasos',
  titulo: 'Pasos',
  formato: 'Instrucción ; respuesta ; pista 1 ; pista 2 …  (la respuesta es un número, o una expresión si empieza con =)',
  ejemplo: '¿Cuál es el área del terreno?;15;Base por altura\nEscribe el costo en función de x;=2000x^2;El área es x por x',
  encabezados: ['instruccion', 'paso'],
  importar(actividad, filas, modo) {
    const pasos: ProblemaPaso[] = modo === 'reemplazar' ? [] : [...(actividad.pasos ?? [])];
    const descartadas: FilaDescartada[] = [];
    let leidas = 0;
    for (const { fila, celdas } of prepararFilas(filas, ['instruccion', 'paso'], sinAcentos)) {
      const texto = celdas.join(' | ');
      const instruccion = (celdas[0] ?? '').trim();
      const cruda = (celdas[1] ?? '').trim();
      const algebraico = cruda.startsWith('=');
      const respuesta = (algebraico ? cruda.slice(1) : cruda).trim();
      if (!instruccion) {
        descartadas.push({ fila, motivo: 'Falta la instrucción.', texto });
      } else if (!respuesta) {
        descartadas.push({ fila, motivo: 'Falta la respuesta.', texto });
      } else if (algebraico && validarExpresionAlgebraica(respuesta)) {
        descartadas.push({ fila, motivo: `La expresión no se puede leer: ${validarExpresionAlgebraica(respuesta)}`, texto });
      } else if (!algebraico && parseRespuestaNumerica(respuesta) === null) {
        descartadas.push({ fila, motivo: 'La respuesta no es un número (para una expresión, empieza con =).', texto });
      } else if (pasos.length >= PROBLEMA_MAX_PASOS) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${PROBLEMA_MAX_PASOS} pasos.`, texto });
      } else {
        const pistas = celdas.slice(2).map((c) => c.trim()).filter(Boolean);
        if (pistas.length > PROBLEMA_MAX_PISTAS_POR_PASO) {
          descartadas.push({ fila, motivo: `Tiene más de ${PROBLEMA_MAX_PISTAS_POR_PASO} pistas.`, texto });
          continue;
        }
        pasos.push({ id: nuevoId('paso'), instruccion, modo: algebraico ? 'algebraico' : 'numerico', respuesta, pistas });
        leidas += 1;
      }
    }
    return { actividad: { ...actividad, pasos }, leidas, descartadas };
  },
};

export const importadorLineaTiempo: Importador<LineaTiempoActivity> = {
  tipo: 'linea_tiempo',
  titulo: 'Eventos',
  formato: 'Fecha ; evento  (en el orden cronológico correcto: el orden de las filas fija la respuesta)',
  ejemplo: '1810;Grito de Independencia\n1819;Batalla de Boyacá\n1991;Nueva Constitución Política',
  encabezados: ['fecha', 'ano', 'anio', 'fecha del evento'],
  importar(actividad, filas, modo) {
    const eventos = modo === 'reemplazar' ? [] : [...(actividad.eventos ?? [])];
    const descartadas: FilaDescartada[] = [];
    let leidas = 0;
    let orden = eventos.reduce((m, e) => Math.max(m, e.orden), 0);
    for (const { fila, celdas } of prepararFilas(filas, ['fecha', 'ano', 'anio', 'fecha del evento'], sinAcentos)) {
      const texto = celdas.join(' | ');
      const fecha = (celdas[0] ?? '').trim();
      const evento = celdas.slice(1).join(' ; ').trim();
      if (!evento) {
        descartadas.push({ fila, motivo: 'Cada fila necesita la fecha y el evento.', texto });
      } else if (eventos.length >= LINEA_MAX_EVENTOS) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${LINEA_MAX_EVENTOS} eventos.`, texto });
      } else {
        orden += 1;
        eventos.push({ id: nuevoId('evt'), texto: evento, fechaTexto: fecha, orden });
        leidas += 1;
      }
    }
    return { actividad: { ...actividad, eventos }, leidas, descartadas };
  },
};

/**
 * «Una frase por fila, con las respuestas entre [corchetes]». `parsearTabla` parte cada fila en celdas
 * por `,` (u otro separador) y aquí se vuelven a unir con «, »: las comas de la prosa se conservan
 * (salvo el espacio que sigue a cada una). Una fila sin corchetes entra como texto sin huecos.
 */
export const importadorClozeBanco: Importador<ClozeBancoActivity> = {
  tipo: 'cloze_banco',
  titulo: 'Texto con huecos',
  formato: 'Una frase por fila, con la palabra de cada hueco entre [corchetes]',
  ejemplo: 'La [fotosíntesis] ocurre en las hojas.\nLas plantas liberan [oxígeno] al aire.',
  encabezados: [],
  importar(actividad, filas, modo) {
    const base = modo === 'reemplazar' ? '' : (actividad.texto ?? '');
    const blancos = modo === 'reemplazar' ? [] : [...(actividad.blancos ?? [])];
    const frases: string[] = [];
    const descartadas: FilaDescartada[] = [];
    let leidas = 0;
    for (const { fila, celdas } of prepararFilas(filas, [], sinAcentos)) {
      const crudo = celdas.join(', ').trim();
      const respuestas = [...crudo.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]!.trim());
      if (respuestas.some((r) => r === '')) {
        descartadas.push({ fila, motivo: 'Hay un hueco [] sin palabra.', texto: crudo });
      } else if (blancos.length + respuestas.length > CLOZE_MAX_BLANCOS) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${CLOZE_MAX_BLANCOS} huecos.`, texto: crudo });
      } else {
        let i = 0;
        const frase = crudo.replace(/\[[^\]]*\]/g, () => {
          const id = generarIdCloze();
          blancos.push({ id, respuesta: respuestas[i++]! });
          return `{{blank:${id}}}`;
        });
        frases.push(frase);
        leidas += 1;
      }
    }
    const texto = [base, ...frases].filter((t) => t.trim() !== '').join(' ');
    return { actividad: { ...actividad, texto, blancos }, leidas, descartadas };
  },
};
