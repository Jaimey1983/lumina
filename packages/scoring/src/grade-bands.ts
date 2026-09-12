// ─── Bandas de desempeño de la escala colombiana (0.0–5.0) ─────────────────
// Fuente ÚNICA de los umbrales 3.0/4.0/4.6 que clasifican una nota ya
// calculada por `notaColombiana()` en una banda de desempeño (Bajo/Básico/
// Alto/Superior — convención MEN, Decreto 1290). Antes de esto, los mismos
// tres umbrales estaban copiados a mano 3 veces dentro de
// `lumina-frontend/src/hooks/api/use-course-analytics.ts` (`getPerformance`,
// el filtro de `atRisk`, y `distribution`) más una cuarta vez como texto
// literal en `analytics-client.tsx` (Etapa H, H2).
//
// Los límites son los mismos de siempre, expresados como intervalo semi-abierto
// [min, max) para que la clasificación sea una sola comparación por banda, sin
// reproducir las asimetrías `<=`/`>` del código original banda por banda.
// Como `notaColombiana()` redondea a 1 decimal, el límite superior de "alto"
// se expresa en 4.7 (el siguiente valor representable tras 4.6) — equivalente
// exacto a la condición original `>= 4.0 && <= 4.6`.

export type NotaColombianaBandaId = 'bajo' | 'basico' | 'alto' | 'superior';

export interface NotaColombianaBanda {
  id: NotaColombianaBandaId;
  /** Etiqueta corta para UI (tablas, badges). */
  etiqueta: string;
  /** Texto de rango para mostrar en ejes/leyendas de gráficos. */
  rangoTexto: string;
  /** Límite inferior, inclusive. */
  min: number;
  /** Límite superior, exclusivo. `null` = sin tope (banda "superior"). */
  max: number | null;
}

/** Orden fijo: de menor a mayor desempeño — así lo esperan tablas y gráficos. */
export const NOTA_COLOMBIANA_BANDAS: readonly NotaColombianaBanda[] = [
  { id: 'bajo', etiqueta: 'Bajo', rangoTexto: '<3.0', min: 0, max: 3.0 },
  { id: 'basico', etiqueta: 'Básico', rangoTexto: '3.0–3.9', min: 3.0, max: 4.0 },
  { id: 'alto', etiqueta: 'Alto', rangoTexto: '4.0–4.6', min: 4.0, max: 4.7 },
  { id: 'superior', etiqueta: 'Superior', rangoTexto: '≥4.7', min: 4.7, max: null },
] as const;

/**
 * Clasifica una nota (escala 0.0–5.0) en su banda de desempeño.
 * `null`/`undefined` (sin nota — el estudiante no tiene promedio todavía)
 * devuelve `null`, no una banda por defecto.
 */
export function clasificarNotaColombiana(
  nota: number | null | undefined,
): NotaColombianaBandaId | null {
  if (nota === null || nota === undefined || !Number.isFinite(nota)) return null;

  for (const banda of NOTA_COLOMBIANA_BANDAS) {
    if (nota >= banda.min && (banda.max === null || nota < banda.max)) {
      return banda.id;
    }
  }
  // Nota fuera de [0, 5] (dato corrupto) — degrada a la banda extrema más cercana
  // en vez de `null`, para no esconder un dato inválido como "sin nota".
  return nota < 0 ? 'bajo' : 'superior';
}

export function obtenerBandaNotaColombiana(id: NotaColombianaBandaId): NotaColombianaBanda {
  const banda = NOTA_COLOMBIANA_BANDAS.find((b) => b.id === id);
  if (!banda) {
    throw new Error(`Banda de nota colombiana desconocida: ${id}`);
  }
  return banda;
}
