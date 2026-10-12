/**
 * U12 / catálogo nuevo (U14+) — validadores de las actividades creadas después de U12. Un archivo por
 * tanda, para no mezclar con los de las actividades migradas (`validadores-clasicos`, `-grupo4`).
 */
import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type { ProblemaPasosActivity, RelacionarLineasActivity, RelacionarLineasItem } from '@lumina/types/slide';

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
