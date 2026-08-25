/** ID estable para useDraggable de bloques en el canvas (evita colisión con ids numéricos ajenos). */
export function blockDragId(index: number): string {
  return `block-${index}`;
}

/** Índice de bloque de nivel raíz a partir del id del draggable. */
export function parseBlockDragIndex(id: string | number): number | null {
  const s = String(id);
  const prefixed = /^block-(\d+)$/.exec(s);
  if (prefixed) {
    const n = Number(prefixed[1]);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }
  return null;
}
