import type {
  Accion,
  Condicion,
  EventoTipo,
  Operando,
  Regla,
} from '@lumina/types/interaction';
import { accionesDeRegla } from './reglas.js';
import { plantillaDeRegla } from './plantillas.js';

/**
 * Operaciones PURAS del constructor de reglas (N3). La interfaz solo llama a
 * estas funciones: así lo que se puede romper (árbol de condiciones, orden,
 * plantillas editadas, ids referenciados) se prueba sin un navegador.
 * Ninguna muta sus argumentos.
 */

/** Ruta dentro del árbol: `[i]` = condición `i` de la raíz; `[i, j]` = hijo `j`. */
export type RutaCondicion = readonly number[];

export function reglaNueva(id: string, evento: EventoTipo): Regla {
  return { id, evento, condiciones: [], acciones: [], activa: true };
}

const hijos = (c: Condicion): readonly Condicion[] =>
  c.tipo === 'y' || c.tipo === 'o' ? c.condiciones : c.tipo === 'no' ? [c.condicion] : [];

function conHijos(c: Condicion, nuevos: Condicion[]): Condicion {
  if (c.tipo === 'y' || c.tipo === 'o') return { ...c, condiciones: nuevos };
  if (c.tipo === 'no') return nuevos[0] ? { ...c, condicion: nuevos[0] } : c;
  return c;
}

export function condicionEn(raiz: readonly Condicion[], ruta: RutaCondicion): Condicion | undefined {
  let nivel: readonly Condicion[] = raiz;
  let actual: Condicion | undefined;
  for (const i of ruta) {
    actual = nivel[i];
    if (!actual) return undefined;
    nivel = hijos(actual);
  }
  return actual;
}

/** Aplica `fn` al nodo de la ruta; `fn` devuelve `null` para quitarlo. */
function transformar(
  nivel: readonly Condicion[],
  ruta: RutaCondicion,
  fn: (c: Condicion) => Condicion | null,
): Condicion[] {
  const [i, ...resto] = ruta;
  if (i === undefined) return [...nivel];
  const salida: Condicion[] = [];
  nivel.forEach((c, k) => {
    if (k !== i) {
      salida.push(c);
      return;
    }
    if (resto.length === 0) {
      const r = fn(c);
      if (r) salida.push(r);
      return;
    }
    salida.push(conHijos(c, transformar(hijos(c), resto, fn)));
  });
  return salida;
}

export function actualizarCondicion(
  raiz: readonly Condicion[],
  ruta: RutaCondicion,
  fn: (c: Condicion) => Condicion,
): Condicion[] {
  return transformar(raiz, ruta, fn);
}

/** Quita un nodo. Un grupo `y`/`o` que queda vacío se quita también (no deja basura). */
export function quitarCondicion(raiz: readonly Condicion[], ruta: RutaCondicion): Condicion[] {
  const sinNodo = transformar(raiz, ruta, () => null);
  return podarVacios(sinNodo);
}

function podarVacios(nivel: readonly Condicion[]): Condicion[] {
  const salida: Condicion[] = [];
  for (const c of nivel) {
    if (c.tipo === 'y' || c.tipo === 'o') {
      const sub = podarVacios(c.condiciones);
      if (sub.length > 0) salida.push({ ...c, condiciones: sub });
    } else if (c.tipo === 'no') {
      const sub = podarVacios([c.condicion]);
      if (sub[0]) salida.push({ ...c, condicion: sub[0] });
    } else salida.push(c);
  }
  return salida;
}

/** Añade `nueva` al final de la raíz (`ruta` vacía) o de un grupo `y`/`o`. */
export function agregarCondicion(
  raiz: readonly Condicion[],
  ruta: RutaCondicion,
  nueva: Condicion,
): Condicion[] {
  if (ruta.length === 0) return [...raiz, nueva];
  return actualizarCondicion(raiz, ruta, (c) =>
    c.tipo === 'y' || c.tipo === 'o' ? { ...c, condiciones: [...c.condiciones, nueva] } : c,
  );
}

/** Niega el nodo, o quita la negación si ya estaba negado. */
export function alternarNegacion(raiz: readonly Condicion[], ruta: RutaCondicion): Condicion[] {
  return actualizarCondicion(raiz, ruta, (c) =>
    c.tipo === 'no' ? c.condicion : { tipo: 'no', condicion: c },
  );
}

/** Convierte un grupo `y` en `o` y viceversa. Sobre otro nodo, lo envuelve en un grupo. */
export function alternarGrupo(raiz: readonly Condicion[], ruta: RutaCondicion): Condicion[] {
  return actualizarCondicion(raiz, ruta, (c) =>
    c.tipo === 'y'
      ? { tipo: 'o', condiciones: c.condiciones }
      : c.tipo === 'o'
        ? { tipo: 'y', condiciones: c.condiciones }
        : c,
  );
}

/** Envuelve el nodo en un grupo `o` junto a `hermana` (para «esto O aquello»). */
export function envolverEnGrupo(
  raiz: readonly Condicion[],
  ruta: RutaCondicion,
  tipo: 'y' | 'o',
  hermana: Condicion,
): Condicion[] {
  return actualizarCondicion(raiz, ruta, (c) => ({ tipo, condiciones: [c, hermana] }));
}

// ─── Listas de reglas y de acciones ──────────────────────────────────────────

export function moverEnLista<T>(lista: readonly T[], desde: number, hacia: number): T[] {
  if (desde < 0 || desde >= lista.length) return [...lista];
  const destino = Math.max(0, Math.min(lista.length - 1, hacia));
  const copia = [...lista];
  const [x] = copia.splice(desde, 1);
  copia.splice(destino, 0, x as T);
  return copia;
}

export function quitarDeLista<T>(lista: readonly T[], i: number): T[] {
  return lista.filter((_, k) => k !== i);
}

export function reemplazarEnLista<T>(lista: readonly T[], i: number, nuevo: T): T[] {
  return lista.map((x, k) => (k === i ? nuevo : x));
}

/**
 * Quita la marca de plantilla de una regla editada: su id deja de empezar por
 * `tpl:`. Así, reaplicar la plantilla no la pisa (el upsert es por id) y la
 * regla del docente se conserva junto a la nueva.
 */
export function sinMarcaDePlantilla(regla: Regla, idNuevo: string): Regla {
  return plantillaDeRegla(regla.id) === null ? regla : { ...regla, id: idNuevo };
}

/**
 * Guarda `nueva` en `reglas`: si `idAnterior` existe, la reemplaza en su misma
 * posición (aunque el id haya cambiado); si no, la agrega al final.
 */
export function guardarEnLista(
  reglas: readonly Regla[] | undefined,
  nueva: Regla,
  idAnterior?: string,
): Regla[] {
  const base = reglas ?? [];
  const objetivo = idAnterior ?? nueva.id;
  const i = base.findIndex((r) => r.id === objetivo);
  if (i < 0) return [...base, nueva];
  return base.map((r, k) => (k === i ? nueva : r));
}

/** Copia de una regla con id nuevo; queda desactivada solo si `desactivar`. */
export function duplicarRegla(regla: Regla, idNuevo: string): Regla {
  return structuredClone({ ...regla, id: idNuevo });
}

// ─── Ids de bloque referenciados (D8: reciben id perezoso al guardar) ────────

function operandosDeCondicion(c: Condicion, salida: Operando[]): void {
  switch (c.tipo) {
    case 'comparacion':
      salida.push(c.izquierda, c.derecha);
      return;
    case 'entre':
      salida.push(c.valor, c.desde, c.hasta);
      return;
    case 'y':
    case 'o':
      c.condiciones.forEach((s) => operandosDeCondicion(s, salida));
      return;
    case 'no':
      operandosDeCondicion(c.condicion, salida);
  }
}

function bloqueDeAccion(a: Accion): string | undefined {
  return a.tipo === 'mostrar' || a.tipo === 'ocultar' || a.tipo === 'cambiar_estado'
    ? a.bloqueId
    : undefined;
}

/** Ids de bloque que la regla nombra (operandos y acciones), sin repetir. */
export function bloqueIdsReferenciados(regla: Regla): string[] {
  const ids = new Set<string>();
  const operandos: Operando[] = [];
  regla.condiciones.forEach((c) => operandosDeCondicion(c, operandos));
  for (const a of accionesDeRegla(regla)) {
    const b = bloqueDeAccion(a);
    if (b) ids.add(b);
    if (
      a.tipo === 'asignar_variable' ||
      a.tipo === 'restar_variable' ||
      a.tipo === 'multiplicar_variable' ||
      a.tipo === 'dividir_variable' ||
      a.tipo === 'concatenar_variable'
    ) {
      operandos.push('valor' in a ? a.valor : 'cantidad' in a ? a.cantidad : a.texto);
    }
  }
  for (const op of operandos) {
    if (op.tipo === 'estado_bloque' || op.tipo === 'respuesta_correcta') ids.add(op.bloqueId);
  }
  ids.delete('');
  return [...ids];
}
