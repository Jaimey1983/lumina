export type DiffOp = { type: 'same' | 'del' | 'add'; text: string };

/**
 * Diff a nivel de palabra (LCS) para mostrar el resultado de la IA como
 * verde (añadido) / rojo tachado (eliminado). Conserva los espacios.
 */
export function wordDiff(before: string, after: string): DiffOp[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const m = a.length;
  const n = b.length;

  // Tabla LCS
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  const push = (type: DiffOp['type'], text: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += text;
    else ops.push({ type, text });
  };
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      push('same', a[i]!);
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      push('del', a[i]!);
      i++;
    } else {
      push('add', b[j]!);
      j++;
    }
  }
  while (i < m) push('del', a[i++]!);
  while (j < n) push('add', b[j++]!);
  return ops;
}

/** Palabras y espacios como tokens separados, para no perder el espaciado. */
function tokenize(s: string): string[] {
  return s.match(/\s+|[^\s]+/g) ?? [];
}
