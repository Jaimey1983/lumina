export const SOPA_LETRAS_MAX_PALABRAS = 20;
export const SOPA_LETRAS_MIN_PALABRAS = 3;
export const SOPA_LETRAS_MIN_FILAS = 10;
export const SOPA_LETRAS_MAX_FILAS = 20;
export const SOPA_LETRAS_MIN_COLUMNAS = 10;
export const SOPA_LETRAS_MAX_COLUMNAS = 20;

export const SOPA_LETRAS_GAP_PX = 1;

export type Direccion = 'horizontal' | 'vertical' | 'diagonal';

export interface PalabraColocada {
  texto: string;
  fila: number;
  columna: number;
  direccion: Direccion;
  celdas: { fila: number; columna: number }[];
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function letraAleatoria(): string {
  return LETRAS[Math.floor(Math.random() * LETRAS.length)];
}

const DELTAS: Record<Direccion, { df: number; dc: number }> = {
  horizontal: { df: 0, dc: 1 },
  vertical: { df: 1, dc: 0 },
  diagonal: { df: 1, dc: 1 },
};

function intentarColocar(
  grid: string[][],
  palabra: string,
  direccion: Direccion,
  filas: number,
  columnas: number,
): PalabraColocada | null {
  const { df, dc } = DELTAS[direccion];
  const len = palabra.length;
  const maxFila = filas - df * (len - 1) - 1;
  const maxCol = columnas - dc * (len - 1) - 1;
  if (maxFila < 0 || maxCol < 0) return null;

  const intentos = 40;
  for (let t = 0; t < intentos; t++) {
    const fila = Math.floor(Math.random() * (maxFila + 1));
    const col = Math.floor(Math.random() * (maxCol + 1));
    let ok = true;
    for (let i = 0; i < len; i++) {
      const r = fila + df * i;
      const c = col + dc * i;
      if (grid[r][c] !== '' && grid[r][c] !== palabra[i]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      const celdas: { fila: number; columna: number }[] = [];
      for (let i = 0; i < len; i++) {
        const r = fila + df * i;
        const c = col + dc * i;
        grid[r][c] = palabra[i];
        celdas.push({ fila: r, columna: c });
      }
      return { texto: palabra, fila, columna: col, direccion, celdas };
    }
  }
  return null;
}

export function generarGrid(
  filas: number,
  columnas: number,
  palabras: string[],
  direcciones: Direccion[],
): { grid: string[][]; colocadas: PalabraColocada[] } {
  const grid: string[][] = Array.from({ length: filas }, () => Array(columnas).fill(''));
  const colocadas: PalabraColocada[] = [];
  const ordenadas = [...palabras]
    .map((p) => p.toUpperCase().replace(/\s/g, ''))
    .sort((a, b) => b.length - a.length);

  for (const palabra of ordenadas) {
    const dirs = [...direcciones].sort(() => Math.random() - 0.5);
    for (const dir of dirs) {
      const resultado = intentarColocar(grid, palabra, dir, filas, columnas);
      if (resultado) {
        colocadas.push(resultado);
        break;
      }
    }
  }

  for (let r = 0; r < filas; r++) {
    for (let c = 0; c < columnas; c++) {
      if (grid[r][c] === '') grid[r][c] = letraAleatoria();
    }
  }

  return { grid, colocadas };
}

export function seleccionEsPalabra(
  celdas: { fila: number; columna: number }[],
  colocadas: PalabraColocada[],
): PalabraColocada | null {
  if (celdas.length === 0) return null;
  for (const p of colocadas) {
    if (p.celdas.length !== celdas.length) continue;
    const match =
      p.celdas.every(
        (c, i) => c.fila === celdas[i].fila && c.columna === celdas[i].columna,
      ) ||
      p.celdas.every(
        (c, i) =>
          c.fila === celdas[celdas.length - 1 - i].fila &&
          c.columna === celdas[celdas.length - 1 - i].columna,
      );
    if (match) return p;
  }
  return null;
}

/** Tamaño cuadrado de cada celda para que la sopa quepa en el espacio disponible. */
export function calcularTamanoCeldaSopa(
  anchoDisponible: number,
  altoDisponible: number,
  filas: number,
  columnas: number,
  gapPx = SOPA_LETRAS_GAP_PX,
): number {
  if (anchoDisponible <= 0 || altoDisponible <= 0 || filas <= 0 || columnas <= 0) {
    return 0;
  }
  const gapTotalW = gapPx * Math.max(columnas - 1, 0);
  const gapTotalH = gapPx * Math.max(filas - 1, 0);
  const maxW = (anchoDisponible - gapTotalW) / columnas;
  const maxH = (altoDisponible - gapTotalH) / filas;
  return Math.max(0, Math.floor(Math.min(maxW, maxH)));
}
