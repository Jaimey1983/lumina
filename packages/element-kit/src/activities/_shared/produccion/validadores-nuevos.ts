/**
 * U12 / catálogo nuevo (U14+) — validadores de las actividades creadas después de U12. Un archivo por
 * tanda, para no mezclar con los de las actividades migradas (`validadores-clasicos`, `-grupo4`).
 */
import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type {
  ClozeBancoActivity,
  EtiquetarImagenActivity,
  LineaTiempoActivity,
  ProblemaPasosActivity,
  RelacionarLineasActivity,
  RelacionarLineasItem,
} from '@lumina/types/slide';

import { CLOZE_MAX_BLANCOS, CLOZE_MAX_DISTRACTORES, MARCADOR } from '../../cloze-banco/cloze-banco-config.js';
import { LINEA_MAX_EVENTOS, LINEA_MIN_EVENTOS } from '../../linea-tiempo/linea-tiempo-config.js';
import { ETIQUETAR_MAX_ETIQUETAS, ETIQUETAR_MAX_ZONAS, ETIQUETAR_MIN_ZONAS } from '../../etiquetar-imagen/etiquetar-imagen-config.js';
import { PROBLEMA_MAX_PASOS } from '../../problema-pasos/problema-pasos-config.js';
import { RELACIONAR_MIN_RELACIONES } from '../../relacionar-lineas/relacionar-lineas-config.js';
import { aviso, error, hayTexto, type ProblemaActividad as P } from './problemas.js';

const itemVacio = (i: RelacionarLineasItem) => !hayTexto(i.texto) && !hayTexto(i.imagen);

export const validarRelacionarLineas = (a: RelacionarLineasActivity): P[] => {
  const out: P[] = [];
  const izq = a.izquierda ?? [];
  const der = a.derecha ?? [];
  const rels = a.relaciones ?? [];
  izq.forEach((i, n) => {
    if (itemVacio(i)) out.push(error('No tiene texto ni imagen.', `Izquierda ${n + 1}`));
  });
  der.forEach((d, n) => {
    if (itemVacio(d)) out.push(error('No tiene texto ni imagen.', `Derecha ${n + 1}`));
  });
  if (rels.length < RELACIONAR_MIN_RELACIONES) out.push(error(`Necesita al menos ${RELACIONAR_MIN_RELACIONES} relaciones.`));
  const idsIzq = new Set(izq.map((i) => i.id));
  const idsDer = new Set(der.map((d) => d.id));
  for (const r of rels) {
    if (!idsIzq.has(r.izquierdaId) || !idsDer.has(r.derechaId)) {
      out.push(error('Hay una relación que apunta a un elemento que no existe.'));
      break;
    }
  }
  const sinPareja = izq.filter((i) => !rels.some((r) => r.izquierdaId === i.id));
  for (const i of sinPareja) {
    out.push(aviso(`«${i.texto || 'Elemento'}» no tiene pareja: no se podrá calificar.`, 'Columna izquierda'));
  }
  const usos = new Map<string, number>();
  for (const r of rels) usos.set(r.derechaId, (usos.get(r.derechaId) ?? 0) + 1);
  if ([...usos.values()].some((n) => n > 1)) out.push(aviso('Dos elementos de la izquierda se unen con el mismo de la derecha.'));
  if (der.length > 0 && der.every((d) => usos.has(d.id))) {
    out.push(aviso('Todos los de la derecha se usan: sin distractores es un emparejar.'));
  }
  return out;
};

export const validarProblemaPasos = (a: ProblemaPasosActivity): P[] => {
  const out: P[] = [];
  const pasos = a.pasos ?? [];
  if (!hayTexto(a.enunciado)) out.push(error('Falta el enunciado.'));
  if (pasos.length === 0) return [...out, error('No tiene pasos.')];
  if (pasos.length > PROBLEMA_MAX_PASOS) out.push(aviso(`Tiene más de ${PROBLEMA_MAX_PASOS} pasos.`));
  pasos.forEach((p, i) => {
    const campo = `Paso ${i + 1}`;
    if (!hayTexto(p.instruccion)) out.push(error('Falta la instrucción.', campo));
    if (!hayTexto(p.respuesta)) out.push(error('Falta la respuesta modelo.', campo));
    else if (p.modo === 'algebraico') {
      const m = validarExpresionAlgebraica(p.respuesta);
      if (m) out.push(error(`La respuesta modelo no se puede leer: ${m}`, campo));
    } else if (parseRespuestaNumerica(p.respuesta) === null) {
      out.push(error('La respuesta modelo no es un número.', campo));
    }
    if (p.tolerancia !== undefined && !(p.tolerancia >= 0)) out.push(error('La tolerancia no puede ser negativa.', campo));
    if ((p.pistas ?? []).some((x) => !hayTexto(x))) out.push(aviso('Tiene pistas vacías (no se ofrecerán).', campo));
  });
  return out;
};

export const validarEtiquetarImagen = (a: EtiquetarImagenActivity): P[] => {
  const out: P[] = [];
  const zonas = a.zonas ?? [];
  const etiquetas = a.etiquetas ?? [];
  if (!hayTexto(a.imagen)) out.push(error('Falta la imagen.'));
  if (!hayTexto(a.textoAlternativo)) out.push(aviso('Falta el texto alternativo: quien no ve la imagen no sabrá qué se etiqueta.'));
  if (zonas.length < ETIQUETAR_MIN_ZONAS) out.push(error(`Necesita al menos ${ETIQUETAR_MIN_ZONAS} marcadores.`));
  if (zonas.length > ETIQUETAR_MAX_ZONAS) out.push(aviso(`Tiene más de ${ETIQUETAR_MAX_ZONAS} marcadores.`));
  if (etiquetas.length > ETIQUETAR_MAX_ETIQUETAS) out.push(aviso(`Tiene más de ${ETIQUETAR_MAX_ETIQUETAS} etiquetas.`));
  etiquetas.forEach((e, n) => {
    if (!hayTexto(e.texto)) out.push(error('No tiene texto.', `Etiqueta ${n + 1}`));
  });
  const ids = new Set(etiquetas.map((e) => e.id));
  const usos = new Map<string, number>();
  zonas.forEach((z, n) => {
    const campo = `Marcador ${n + 1}`;
    if (!z.etiquetaId) out.push(error('No tiene etiqueta asignada.', campo));
    else if (!ids.has(z.etiquetaId)) out.push(error('Su etiqueta ya no existe.', campo));
    else usos.set(z.etiquetaId, (usos.get(z.etiquetaId) ?? 0) + 1);
    const fuera = (v: unknown) => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1;
    if (fuera(z.x) || fuera(z.y)) out.push(error('Está fuera de la imagen.', campo));
  });
  if ([...usos.values()].some((n) => n > 1)) {
    out.push(error('Una misma etiqueta no puede ir en dos marcadores: solo se puede colocar una vez.'));
  }
  return out;
};

export const validarLineaTiempo = (a: LineaTiempoActivity): P[] => {
  const out: P[] = [];
  const eventos = a.eventos ?? [];
  if (eventos.length < LINEA_MIN_EVENTOS) out.push(error(`Necesita al menos ${LINEA_MIN_EVENTOS} eventos.`));
  if (eventos.length > LINEA_MAX_EVENTOS) out.push(aviso(`Tiene más de ${LINEA_MAX_EVENTOS} eventos.`));
  eventos.forEach((e, n) => {
    if (!hayTexto(e.texto)) out.push(error('No tiene texto.', `Evento ${n + 1}`));
    else if (!hayTexto(e.fechaTexto)) out.push(aviso('No tiene fecha: al comprobar no se podrá mostrar.', `Evento ${n + 1}`));
  });
  const ordenes = eventos.map((e) => e.orden);
  if (ordenes.some((o) => typeof o !== 'number' || !Number.isFinite(o))) {
    out.push(error('Hay un evento sin número de orden válido.'));
  } else {
    if (new Set(ordenes).size !== ordenes.length) {
      out.push(error('Hay números de orden repetidos: no se sabría cuál va primero.'));
    } else {
      const orden = [...ordenes].sort((x, y) => x - y);
      if (orden.some((o, i) => o !== i + 1)) out.push(aviso('Los números de orden tienen huecos (usa «Ordenar por orden» para renumerarlos).'));
    }
  }
  return out;
};

export const validarClozeBanco = (a: ClozeBancoActivity): P[] => {
  const out: P[] = [];
  if (!hayTexto(a.texto)) out.push(error('El texto está vacío.'));
  const blancos = a.blancos ?? [];
  if (blancos.length === 0) out.push(error('No tiene huecos para completar.'));
  if (blancos.length > CLOZE_MAX_BLANCOS) out.push(aviso(`Tiene más de ${CLOZE_MAX_BLANCOS} huecos.`));
  if ((a.distractores ?? []).length > CLOZE_MAX_DISTRACTORES) {
    out.push(aviso(`Tiene más de ${CLOZE_MAX_DISTRACTORES} distractores.`));
  }
  const marcados = [...(a.texto ?? '').matchAll(MARCADOR)].map((m) => m[1]!);
  const definidos = new Set(blancos.map((b) => b.id));
  for (const id of new Set(marcados)) {
    if (!definidos.has(id)) out.push(error(`El texto marca el hueco «${id}» pero no tiene respuesta.`));
  }
  const repetidos = marcados.filter((id, i) => marcados.indexOf(id) !== i);
  for (const id of new Set(repetidos)) out.push(error(`El hueco «${id}» aparece más de una vez en el texto.`));
  const usados = new Set(marcados);
  for (const b of blancos) {
    if (!usados.has(b.id)) out.push(aviso(`El hueco «${b.id}» no aparece en el texto.`));
    if (!hayTexto(b.respuesta)) out.push(error(`El hueco «${b.id}» no tiene respuesta.`));
  }
  if (new Set(blancos.map((b) => b.id)).size !== blancos.length) out.push(error('Hay huecos con el mismo identificador.'));
  const respuestas = new Set(blancos.map((b) => b.respuesta.trim()));
  for (const d of (a.distractores ?? []).map((x) => x.trim()).filter((x) => x !== '')) {
    if (respuestas.has(d)) out.push(aviso(`El distractor «${d}» es igual a una respuesta: la actividad quedaría ambigua.`));
  }
  return out;
};
