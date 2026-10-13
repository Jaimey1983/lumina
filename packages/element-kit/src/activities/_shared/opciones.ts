/**
 * U10.1 — banco de opciones de opción múltiple compartido (etapa U).
 *
 * Siete actividades corrigen opciones (quiz, globos, topo, abrir caja, historia ramificada, video
 * interactivo y V/F) con TRES formas de guardarlas: `{ id, texto, esCorrecta }`, `{ texto, correcta }` (sin
 * `id`, globos y topo) y `contenido.esCorrecta` (abrir caja). Los datos guardados NO se tocan: este
 * módulo solo los LEE de una manera, para que cada viewer no repita las mismas reglas.
 */

/** Cualquier opción guardada: lee `esCorrecta` y, si no está, `correcta`. */
export interface OpcionLeible {
  readonly texto?: unknown;
  readonly correcta?: unknown;
  readonly esCorrecta?: unknown;
}

/** `true`/`false` si la opción declara si es correcta; `undefined` si no dice nada. */
export function leerCorrecta(op: OpcionLeible | null | undefined): boolean | undefined {
  const v = op?.esCorrecta ?? op?.correcta;
  return typeof v === 'boolean' ? v : undefined;
}

/** ¿Alguna opción declara explícitamente si es correcta o no? (la actividad es evaluable). */
export function hayJuicioDefinido(opciones: readonly (OpcionLeible | null | undefined)[]): boolean {
  return opciones.some((op) => leerCorrecta(op) !== undefined);
}

/** Ids de las opciones correctas (las opciones sin `id` no cuentan). */
export function idsCorrectos(opciones: readonly (OpcionLeible & { id?: string })[]): string[] {
  return opciones.filter((op) => leerCorrecta(op) === true && typeof op.id === 'string').map((op) => op.id as string);
}

/**
 * ¿La selección es EXACTAMENTE el conjunto de correctas? Sin correctas definidas siempre es `false`.
 * (Misma regla del quiz: ni una de más ni una de menos.)
 */
export function seleccionEsCorrecta(correctIds: readonly string[], seleccion: readonly string[]): boolean {
  if (correctIds.length === 0) return false;
  if (seleccion.length !== correctIds.length) return false;
  const set = new Set(seleccion);
  return correctIds.every((id) => set.has(id));
}

export interface OpcionTexto {
  texto: string;
  correcta: boolean;
}

/**
 * Normaliza las opciones `{ texto, correcta }` de un juego arcade: recorta el texto, descarta las
 * vacías y, si alcanzan el mínimo, garantiza una correcta (la primera, si ninguna lo era). Si no
 * alcanzan, devuelve `porDefecto()`.
 */
export function normalizarOpcionesTexto(
  opciones: readonly OpcionLeible[],
  minimo: number,
  porDefecto: () => OpcionTexto[],
): OpcionTexto[] {
  const limpias = opciones
    .map((op) => ({
      texto: typeof op.texto === 'string' ? op.texto.trim() : '',
      correcta: leerCorrecta(op) === true,
    }))
    .filter((op) => op.texto.length > 0);

  if (limpias.length >= minimo) {
    if (!limpias.some((op) => op.correcta)) {
      return limpias.map((op, index) => ({ ...op, correcta: index === 0 }));
    }
    return limpias;
  }
  return porDefecto();
}
