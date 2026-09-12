// ─── Formato de valores de @lumina/charts ──────────────────────────────────
// Utilidades de presentación puras (sin lógica de negocio). El significado de
// un valor (p. ej. las bandas de la escala colombiana) vive en su propio
// paquete de dominio (`@lumina/scoring`, ver H2) — acá solo se decide cómo
// se ve un número, no qué representa.

const LOCALE = 'es-CO';

export function formatInteger(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value: number, decimals = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** `value` en fracción de 1 (0.42 → "42%"), no en porcentaje ya multiplicado. */
export function formatPercent(value: number, decimals = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(value);
}

/**
 * Formato de escala 0–5 (redondeo a 1 decimal — misma convención que
 * `notaColombiana()` en `@lumina/scoring`, sin depender de ese paquete).
 */
export function formatScale0a5(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return formatDecimal(rounded, 1);
}

export type LuminaValueFormat = 'entero' | 'decimal' | 'porcentaje' | 'moneda' | 'escala0a5';

export function formatChartValue(value: number, format: LuminaValueFormat = 'decimal'): string {
  switch (format) {
    case 'entero':
      return formatInteger(value);
    case 'porcentaje':
      return formatPercent(value);
    case 'moneda':
      return formatCurrency(value);
    case 'escala0a5':
      return formatScale0a5(value);
    case 'decimal':
    default:
      return formatDecimal(value);
  }
}
