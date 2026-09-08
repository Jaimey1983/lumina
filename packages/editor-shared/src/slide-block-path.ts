import type { Block } from "@lumina/types/slide";

// Helpers de ruta sobre `Block[]` extraídos de `lumina-frontend/src/lib/class-slide-normalize.ts`
// (E7.6.3-pre): son puros y `widgets/shared` los necesita sin arrastrar el
// registro de `normalize*` de cada elemento. `class-slide-normalize.ts` los
// re-exporta para sus consumidores existentes.

/** Obtiene un bloque por la misma ruta que `updateBlockAtPath`. */
export function getBlockAtPath(bloques: Block[], path: string): Block | null {
  const parts = path.split("-").map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  function go(arr: Block[], depth: number): Block | null {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return null;
    if (depth === parts.length - 1) return arr[i]!;

    const block = arr[i];
    if (block.tipo !== "columnas") return null;
    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return null;
    return go(block.columnas[colIdx]!, depth + 2);
  }

  return go(bloques, 0);
}

/** Actualiza un bloque por ruta tipo `"2"` o `"5-0-1"` (columnas anidadas). */
export function updateBlockAtPath(
  bloques: Block[],
  path: string,
  fn: (b: Block) => Block,
): Block[] {
  const parts = path.split("-").map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return bloques;

  function go(arr: Block[], depth: number): Block[] {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return arr;

    if (depth === parts.length - 1) {
      return arr.map((b, j) => (j === i ? fn(b) : b));
    }

    const block = arr[i];
    if (block.tipo !== "columnas") return arr;

    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return arr;

    const newColumnas = block.columnas.map((col: Block[], cj: number) => {
      if (cj !== colIdx) return col;
      return go(col, depth + 2);
    });

    return arr.map((b, j) => (j === i ? { ...block, columnas: newColumnas } : b));
  }

  return go(bloques, 0);
}

/** Elimina el bloque en la ruta (`"2"` o `"5-0-1"`). */
export function removeBlockAtPath(bloques: Block[], path: string): Block[] {
  const parts = path.split("-").map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return bloques;

  function go(arr: Block[], depth: number): Block[] {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return arr;

    if (depth === parts.length - 1) {
      return arr.filter((_, j) => j !== i);
    }

    const block = arr[i];
    if (block.tipo !== "columnas") return arr;

    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return arr;

    const newColumnas = block.columnas.map((col: Block[], cj: number) => {
      if (cj !== colIdx) return col;
      return go(col, depth + 2);
    });

    return arr.map((b, j) => (j === i ? { ...block, columnas: newColumnas } : b));
  }

  return go(bloques, 0);
}
