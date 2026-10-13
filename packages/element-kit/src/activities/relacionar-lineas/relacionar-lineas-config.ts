import type { RelacionarLineasActivity, RelacionarLineasItem } from '@lumina/types/slide';

export const RELACIONAR_MAX_IZQUIERDA = 8;
export const RELACIONAR_MAX_DERECHA = 10;
export const RELACIONAR_MIN_RELACIONES = 2;

export function generarIdRelacionar(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizarItem(raw: unknown, prefijo: string): RelacionarLineasItem {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const item: RelacionarLineasItem = { id: typeof o.id === 'string' && o.id ? o.id : generarIdRelacionar(prefijo) };
  if (typeof o.texto === 'string' && o.texto.length > 0) item.texto = o.texto;
  if (typeof o.imagen === 'string' && o.imagen.length > 0) item.imagen = o.imagen;
  return item;
}

/**
 * Hidrata una actividad tal como se guardó: completa los campos que falten y descarta las
 * relaciones que apuntan a un elemento que ya no existe o que repiten una izquierda (gana la
 * primera). No toca `ajustes` ni lo que no conoce.
 */
export function normalizarRelacionarLineas(
  actividad: RelacionarLineasActivity | Record<string, unknown>,
): RelacionarLineasActivity {
  const raw = actividad as Partial<RelacionarLineasActivity>;
  const izquierda = (Array.isArray(raw.izquierda) ? raw.izquierda : []).map((i) => normalizarItem(i, 'izq'));
  const derecha = (Array.isArray(raw.derecha) ? raw.derecha : []).map((d) => normalizarItem(d, 'der'));
  const idsIzq = new Set(izquierda.map((i) => i.id));
  const idsDer = new Set(derecha.map((d) => d.id));
  const vistas = new Set<string>();
  const relaciones: RelacionarLineasActivity['relaciones'] = [];
  for (const r of Array.isArray(raw.relaciones) ? raw.relaciones : []) {
    if (!r || !idsIzq.has(r.izquierdaId) || !idsDer.has(r.derechaId) || vistas.has(r.izquierdaId)) continue;
    vistas.add(r.izquierdaId);
    relaciones.push({ izquierdaId: r.izquierdaId, derechaId: r.derechaId });
  }
  return {
    ...(raw as RelacionarLineasActivity),
    tipo: 'relacionar_lineas',
    instruccion: typeof raw.instruccion === 'string' ? raw.instruccion : '',
    izquierda,
    derecha,
    relaciones,
  };
}

export function etiquetaItem(item: RelacionarLineasItem): string {
  if (item.texto) return item.texto;
  if (item.imagen) return 'imagen';
  return '';
}

/** Huella del CONTENIDO: cambiar un ajuste (estilo, sonido…) no reinicia la actividad. */
export function relacionarLineasFingerprint(a: RelacionarLineasActivity): string {
  return JSON.stringify([a.instruccion, a.izquierda, a.derecha, a.relaciones]);
}
