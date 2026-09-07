/**
 * Plantillas de "actividad nueva" de la familia clásica (quiz / V-F / blancos /
 * arrastrar / emparejar / ordenar / video / respuesta corta / encuesta / nube).
 *
 * Extraídas de `editor-client.tsx` en E2.5 para que `@lumina/element-kit` pueda
 * consumirlas como `crearPorDefecto()` de cada `ElementDefinition`, sin
 * duplicar el shape.
 */
import type { Activity } from '@/types/slide.types';
import { createDefaultEmparejar } from '@/lib/emparejar-defaults';

export function shortAnswerTemplate(): Activity {
  return {
    tipo: 'short_answer',
    question: 'Nueva pregunta',
    expectedAnswer: '',
    caseSensitive: false,
    maxLength: 200,
  };
}

export function quizMultipleTemplate(): Activity {
  return {
    tipo: 'quiz_multiple',
    preguntas: [
      {
        id: 'q-1',
        texto: '¿Nueva pregunta?',
        opciones: [
          { id: 'a', texto: 'Opción A', esCorrecta: true },
          { id: 'b', texto: 'Opción B', esCorrecta: false },
          { id: 'c', texto: 'Opción C', esCorrecta: false },
          { id: 'd', texto: 'Opción D', esCorrecta: false },
        ],
        puntos: 10,
      },
    ],
    deliveryMode: 'AUTONOMOUS',
    layoutVariant: 'classic-list',
  };
}

export function trueFalseTemplate(): Activity {
  return {
    tipo: 'verdadero_falso',
    afirmacion: 'Nueva afirmación para evaluar.',
    respuestaCorrecta: true,
    puntos: 5,
  };
}

export function fillBlanksTemplate(): Activity {
  return {
    tipo: 'completar_blancos',
    texto: 'El {{blank:b1}} es fundamental para {{blank:b2}}.',
    blancos: [
      { id: 'b1', respuesta: 'concepto', ignorarMayusculas: true },
      { id: 'b2', respuesta: 'aprender', ignorarMayusculas: true },
    ],
    puntos: 10,
  };
}

export function dragDropTemplate(): Activity {
  return {
    tipo: 'arrastrar_soltar',
    instruccion: 'Arrastra cada elemento a la categoría correcta.',
    items: [
      { id: 'i1', texto: 'Elemento 1' },
      { id: 'i2', texto: 'Elemento 2' },
      { id: 'i3', texto: 'Elemento 3' },
      { id: 'i4', texto: 'Elemento 4' },
    ],
    zonas: [
      { id: 'z1', etiqueta: 'Categoría 1', itemsCorrectos: ['i1', 'i2'] },
      { id: 'z2', etiqueta: 'Categoría 2', itemsCorrectos: ['i3', 'i4'] },
    ],
    puntos: 10,
  };
}

export function matchPairsTemplate(): Activity {
  return createDefaultEmparejar();
}

export function orderStepsTemplate(): Activity {
  return {
    tipo: 'ordenar_pasos',
    instruccion: 'Ordena los pasos del proceso correctamente.',
    pasos: [
      { id: 's1', contenido: 'Paso 1', ordenCorrecto: 1 },
      { id: 's2', contenido: 'Paso 2', ordenCorrecto: 2 },
      { id: 's3', contenido: 'Paso 3', ordenCorrecto: 3 },
      { id: 's4', contenido: 'Paso 4', ordenCorrecto: 4 },
    ],
    puntos: 10,
  };
}

export function videoInteractiveTemplate(): Activity {
  return {
    tipo: 'video_interactivo',
    urlVideo: 'https://www.youtube.com/watch?v=',
    plataforma: 'youtube',
    preguntas: [
      {
        id: 'q1',
        tiempoSegundos: 30,
        pregunta: '¿Nueva pregunta?',
        opciones: [
          { id: 'a', texto: 'Opción A', esCorrecta: true },
          { id: 'b', texto: 'Opción B', esCorrecta: false },
        ],
        pausarVideo: true,
      },
    ],
    debeResponderParaContinuar: false,
  };
}

export function livePollTemplate(): Activity {
  return {
    tipo: 'encuesta_viva',
    pregunta: '¿Nueva pregunta de encuesta?',
    opciones: [
      { id: 'o1', texto: 'Opción 1' },
      { id: 'o2', texto: 'Opción 2' },
      { id: 'o3', texto: 'Opción 3' },
    ],
    mostrarResultadosEnTiempoReal: true,
    mostrarResultadosAlFinalizar: true,
  };
}

export function wordCloudTemplate(): Activity {
  return {
    tipo: 'nube_palabras',
    instruccion: 'Escribe una palabra que asocies con el tema.',
    maxPalabrasPorUsuario: 3,
    maxPalabrasEnNube: 50,
    filtrarPalabrasComunes: true,
  };
}
