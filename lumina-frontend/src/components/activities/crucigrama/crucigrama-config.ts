export const CRUCIGRAMA_MAX_PALABRAS = 20;
export const CRUCIGRAMA_MIN_PALABRAS = 2;

export const CRUCIGRAMA_GAP_PX = 1;

export function generarIdCrucigrama(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function calcularBounds(palabras: {
  texto: string;
  direccion: 'horizontal' | 'vertical';
  fila: number;
  columna: number;
}[]): { minFila: number; maxFila: number; minCol: number; maxCol: number } {
  if (palabras.length === 0) return { minFila: 0, maxFila: 0, minCol: 0, maxCol: 0 };
  let minFila = Infinity;
  let maxFila = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  for (const p of palabras) {
    const endFila = p.direccion === 'vertical' ? p.fila + p.texto.length - 1 : p.fila;
    const endCol = p.direccion === 'horizontal' ? p.columna + p.texto.length - 1 : p.columna;
    minFila = Math.min(minFila, p.fila);
    maxFila = Math.max(maxFila, endFila);
    minCol = Math.min(minCol, p.columna);
    maxCol = Math.max(maxCol, endCol);
  }
  return { minFila, maxFila, minCol, maxCol };
}

export function construirMapaCeldas(palabras: {
  id: string;
  texto: string;
  direccion: 'horizontal' | 'vertical';
  fila: number;
  columna: number;
}[]): Map<string, { letra: string; palabraIds: string[]; conflicto?: boolean }> {
  const mapa = new Map<string, { letra: string; palabraIds: string[]; conflicto?: boolean }>();
  for (const p of palabras) {
    for (let i = 0; i < p.texto.length; i++) {
      const r = p.direccion === 'vertical' ? p.fila + i : p.fila;
      const c = p.direccion === 'horizontal' ? p.columna + i : p.columna;
      const key = `${r}-${c}`;
      const letra = p.texto[i].toUpperCase();
      const existing = mapa.get(key);
      if (existing) {
        if (existing.letra !== letra) {
          existing.conflicto = true;
        }
        if (!existing.palabraIds.includes(p.id)) {
          existing.palabraIds.push(p.id);
        }
      } else {
        mapa.set(key, { letra, palabraIds: [p.id] });
      }
    }
  }
  return mapa;
}

export interface ConflictoInterseccion {
  fila: number;
  columna: number;
  letras: string[];
}

/** Detecta celdas donde dos palabras exigen letras distintas. */
export function detectarConflictosInterseccion(
  palabras: {
    texto: string;
    direccion: 'horizontal' | 'vertical';
    fila: number;
    columna: number;
  }[],
): ConflictoInterseccion[] {
  const letrasPorCelda = new Map<string, Set<string>>();

  for (const p of palabras) {
    for (let i = 0; i < p.texto.length; i++) {
      const r = p.direccion === 'vertical' ? p.fila + i : p.fila;
      const c = p.direccion === 'horizontal' ? p.columna + i : p.columna;
      const key = `${r}-${c}`;
      const letra = p.texto[i].toUpperCase();
      if (!letrasPorCelda.has(key)) letrasPorCelda.set(key, new Set());
      letrasPorCelda.get(key)!.add(letra);
    }
  }

  const conflictos: ConflictoInterseccion[] = [];
  letrasPorCelda.forEach((letras, key) => {
    if (letras.size <= 1) return;
    const [fila, columna] = key.split('-').map(Number);
    conflictos.push({ fila, columna, letras: [...letras] });
  });
  return conflictos;
}

/** Tamaño cuadrado de celda para que el crucigrama quepa en el espacio disponible. */
export function calcularTamanoCeldaCrucigrama(
  anchoDisponible: number,
  altoDisponible: number,
  filas: number,
  columnas: number,
  gapPx = CRUCIGRAMA_GAP_PX,
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

export function numerarPalabras(palabras: {
  id: string;
  fila: number;
  columna: number;
  direccion: 'horizontal' | 'vertical';
}[]): Map<string, number> {
  const sorted = [...palabras].sort((a, b) =>
    a.fila !== b.fila ? a.fila - b.fila : a.columna - b.columna,
  );
  const numeracion = new Map<string, number>();
  sorted.forEach((p, i) => numeracion.set(p.id, i + 1));
  return numeracion;
}
