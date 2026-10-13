/**
 * U12.1a — validadores de las actividades clásicas. Cada uno es una función pura
 * `actividad → problemas`; ninguno modifica la actividad ni consulta nada fuera de ella.
 */
import { parseEquation } from '@lumina/chemistry';
import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type {
  BalancearEcuacionActivity,
  DragDrop,
  FillBlanks,
  FormularCompuestoActivity,
  LivePoll,
  MatchPairs,
  MathAnswerActivity,
  OrderSteps,
  QuizMultiple,
  QuizOption,
  ShortAnswerActivity,
  TrueFalse,
  UbicarElementoActivity,
  VideoInteractive,
  WordCloud,
} from '@lumina/types/slide';

import { aviso, duplicados, error, hayTexto, type ProblemaActividad as P } from './problemas.js';

const nOpcionesCorrectas = (ops: readonly QuizOption[]) => ops.filter((o) => o.esCorrecta).length;

function validarOpciones(ops: readonly QuizOption[], campo: string, multiple: boolean): P[] {
  const out: P[] = [];
  if (ops.length < 2) out.push(error('Necesita al menos 2 opciones.', campo));
  if (ops.some((o) => !hayTexto(o.texto))) out.push(aviso('Hay opciones sin texto.', campo));
  const dup = duplicados(ops.map((o) => o.texto ?? ''));
  if (dup.length) out.push(aviso(`Opciones repetidas: ${dup.map((d) => `«${d}»`).join(', ')}.`, campo));
  const correctas = nOpcionesCorrectas(ops);
  if (correctas === 0) out.push(error('Ninguna opción está marcada como correcta.', campo));
  else if (correctas > 1 && !multiple) {
    out.push(aviso('Hay varias correctas pero la pregunta es de respuesta única.', campo));
  }
  return out;
}

export const validarQuizMultiple = (a: QuizMultiple): P[] => {
  if (!a.preguntas?.length) return [error('No tiene preguntas.')];
  return a.preguntas.flatMap((p, i) => {
    const campo = `Pregunta ${i + 1}`;
    const out: P[] = [];
    if (!hayTexto(p.texto)) out.push(error('La pregunta no tiene enunciado.', campo));
    return [...out, ...validarOpciones(p.opciones ?? [], campo, !!p.multipleRespuesta)];
  });
};

export const validarVerdaderoFalso = (a: TrueFalse): P[] =>
  hayTexto(a.afirmacion) ? [] : [error('La afirmación está vacía.')];

export const validarShortAnswer = (a: ShortAnswerActivity): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.question)) out.push(error('La pregunta está vacía.'));
  if (!hayTexto(a.expectedAnswer)) out.push(aviso('Sin respuesta de referencia para quien califique.'));
  if (!(a.maxLength >= 1)) out.push(error('El largo máximo de la respuesta debe ser al menos 1.'));
  return out;
};

export const validarRespuestaMatematica = (a: MathAnswerActivity): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.question)) out.push(error('La pregunta está vacía.'));
  if (!hayTexto(a.respuesta)) {
    out.push(error('Falta la respuesta modelo.'));
  } else if (a.modo === 'algebraico') {
    const msg = validarExpresionAlgebraica(a.respuesta);
    if (msg) out.push(error(`La respuesta modelo no se puede leer: ${msg}`));
  } else if (parseRespuestaNumerica(a.respuesta) === null) {
    out.push(error('La respuesta modelo no es un número.'));
  }
  if (a.tolerancia !== undefined && !(a.tolerancia >= 0)) out.push(error('La tolerancia no puede ser negativa.'));
  return out;
};

export const validarCompletarBlancos = (a: FillBlanks): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.texto)) out.push(error('El texto está vacío.'));
  const blancos = a.blancos ?? [];
  if (blancos.length === 0) out.push(error('No tiene blancos para completar.'));
  const marcados = [...(a.texto ?? '').matchAll(/\{\{blank:([^}]+)\}\}/g)].map((m) => m[1]!);
  const definidos = new Set(blancos.map((b) => b.id));
  for (const id of new Set(marcados)) {
    if (!definidos.has(id)) out.push(error(`El texto marca el blanco «${id}» pero no tiene respuesta.`));
  }
  const usados = new Set(marcados);
  for (const b of blancos) {
    if (!usados.has(b.id)) out.push(aviso(`El blanco «${b.id}» no aparece en el texto.`));
    if (!hayTexto(b.respuesta)) out.push(error(`El blanco «${b.id}» no tiene respuesta.`));
  }
  if (new Set(blancos.map((b) => b.id)).size !== blancos.length) out.push(error('Hay blancos con el mismo identificador.'));
  return out;
};

export const validarArrastrarSoltar = (a: DragDrop): P[] => {
  const out: P[] = [];
  const items = a.items ?? [];
  const zonas = a.zonas ?? [];
  if (items.length === 0) out.push(error('No tiene elementos para arrastrar.'));
  if (zonas.length === 0) out.push(error('No tiene zonas donde soltar.'));
  else if (zonas.length === 1) out.push(aviso('Con una sola zona no hay nada que distinguir.'));
  const ids = new Set(items.map((i) => i.id));
  const conteo = new Map<string, number>();
  for (const z of zonas) {
    const campo = `Zona «${z.etiqueta || z.id}»`;
    const correctos = z.itemsCorrectos ?? [];
    if (correctos.length === 0) out.push(aviso('No tiene ningún elemento correcto.', campo));
    for (const id of correctos) {
      if (!ids.has(id)) out.push(error(`Apunta a un elemento que no existe («${id}»).`, campo));
      conteo.set(id, (conteo.get(id) ?? 0) + 1);
    }
    if (z.capacidadMaxima !== undefined && z.capacidadMaxima < correctos.length) {
      out.push(error(`Su capacidad (${z.capacidadMaxima}) es menor que sus ${correctos.length} elementos correctos.`, campo));
    }
  }
  for (const it of items) {
    const n = conteo.get(it.id) ?? 0;
    if (!hayTexto(it.texto) && !it.imagenUrl) out.push(aviso('Hay un elemento sin texto ni imagen.'));
    if (n === 0) out.push(aviso(`«${it.texto || it.id}» no pertenece a ninguna zona (será un distractor).`));
    if (n > 1) out.push(aviso(`«${it.texto || it.id}» pertenece a ${n} zonas.`));
  }
  return out;
};

export const validarEmparejar = (a: MatchPairs): P[] => {
  const out: P[] = [];
  const pares = a.pares ?? [];
  if (pares.length < 2) out.push(error('Necesita al menos 2 pares.'));
  pares.forEach((p, i) => {
    const lado = (l: { texto?: string; imagen?: string } | undefined) => hayTexto(l?.texto) || hayTexto(l?.imagen);
    if (!lado(p.izquierda) || !lado(p.derecha)) out.push(error('Tiene un lado vacío.', `Par ${i + 1}`));
  });
  const dupI = duplicados(pares.map((p) => p.izquierda?.texto ?? ''));
  if (dupI.length) out.push(aviso(`Hay elementos repetidos a la izquierda: ${dupI.map((d) => `«${d}»`).join(', ')}.`));
  return out;
};

export const validarOrdenarPasos = (a: OrderSteps): P[] => {
  const out: P[] = [];
  const pasos = a.pasos ?? [];
  if (pasos.length < 2) out.push(error('Necesita al menos 2 pasos.'));
  pasos.forEach((p, i) => {
    if (!hayTexto(p.contenido) && !p.imagenUrl) out.push(error('El paso está vacío.', `Paso ${i + 1}`));
  });
  const pos = pasos.map((p) => p.ordenCorrecto);
  if (new Set(pos).size !== pos.length) out.push(error('Hay dos pasos con la misma posición correcta.'));
  else if ([...pos].sort((x, y) => x - y).some((v, i) => v !== i + 1)) {
    out.push(error('Las posiciones correctas deben ser 1, 2, 3… sin huecos.'));
  }
  return out;
};

export const validarVideoInteractivo = (a: VideoInteractive): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.urlVideo)) out.push(error('Falta la dirección del video.'));
  const pregs = a.preguntas ?? [];
  if (pregs.length === 0) out.push(aviso('El video no tiene preguntas.'));
  pregs.forEach((q, i) => {
    const campo = `Pregunta ${i + 1}`;
    if (!hayTexto(q.pregunta)) out.push(error('La pregunta no tiene enunciado.', campo));
    if (!(q.tiempoSegundos >= 0)) out.push(error('El segundo en que aparece no es válido.', campo));
    out.push(...validarOpciones(q.opciones ?? [], campo, false));
  });
  const tiempos = pregs.map((q) => q.tiempoSegundos);
  if (new Set(tiempos).size !== tiempos.length) out.push(aviso('Dos preguntas aparecen en el mismo segundo.'));
  return out;
};

export const validarEncuestaViva = (a: LivePoll): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.pregunta)) out.push(error('La pregunta está vacía.'));
  const ops = a.opciones ?? [];
  if (ops.length < 2) out.push(error('Necesita al menos 2 opciones.'));
  if (ops.some((o) => !hayTexto(o.texto))) out.push(aviso('Hay opciones sin texto.'));
  const dup = duplicados(ops.map((o) => o.texto ?? ''));
  if (dup.length) out.push(aviso(`Opciones repetidas: ${dup.map((d) => `«${d}»`).join(', ')}.`));
  return out;
};

export const validarNubePalabras = (a: WordCloud): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.instruccion)) out.push(error('Falta la instrucción.'));
  if (a.maxPalabrasPorUsuario !== undefined && !(a.maxPalabrasPorUsuario >= 1)) {
    out.push(error('Cada alumno debe poder escribir al menos 1 palabra.'));
  }
  return out;
};

export const validarBalancearEcuacion = (a: BalancearEcuacionActivity): P[] => {
  if (!hayTexto(a.ecuacion)) return [error('Falta la ecuación.')];
  try {
    parseEquation(a.ecuacion);
    return [];
  } catch (e) {
    return [error(`La ecuación no se puede leer: ${e instanceof Error ? e.message : 'formato no válido'}.`)];
  }
};

export const validarUbicarElemento = (a: UbicarElementoActivity): P[] => {
  const out: P[] = [];
  const els = a.elementos ?? [];
  if (els.length === 0) out.push(error('No tiene elementos para ubicar.'));
  els.forEach((e, i) => {
    const campo = `Elemento ${i + 1}`;
    if (!hayTexto(e.symbol)) out.push(error('Falta el símbolo.', campo));
    if (!(e.periodo >= 1 && e.periodo <= 7)) out.push(error('El periodo debe estar entre 1 y 7.', campo));
    if (!(e.grupo >= 1 && e.grupo <= 18)) out.push(error('El grupo debe estar entre 1 y 18.', campo));
  });
  const dup = duplicados(els.map((e) => e.symbol ?? ''));
  if (dup.length) out.push(aviso(`Símbolos repetidos: ${dup.join(', ')}.`));
  return out;
};

export const validarFormularCompuesto = (a: FormularCompuestoActivity): P[] => {
  const pregs = a.preguntas ?? [];
  if (pregs.length === 0) return [error('No tiene preguntas.')];
  return pregs.flatMap((q, i) => {
    const campo = `Pregunta ${i + 1}`;
    const out: P[] = [];
    if (!hayTexto(q.enunciado)) out.push(error('Falta el enunciado.', campo));
    if (!hayTexto(q.formula)) out.push(error('Falta la fórmula esperada.', campo));
    return out;
  });
};
