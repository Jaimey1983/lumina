import type { BlockMarco } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';
import type {
  ProgresoHito,
  ProgresoModo,
  ProgresoVariante,
  ProgresoWidget,
} from '@lumina/types/widget';

export const DEFAULT_PROGRESO_MODO: ProgresoModo = 'slides';
export const DEFAULT_PROGRESO_PORCENTAJE = 45;
export const DEFAULT_PROGRESO_BARRA = '#0d6efd';
export const DEFAULT_PROGRESO_FONDO = '#e9ecef';
export const DEFAULT_PROGRESO_TEXTO = '#ffffff';

/**
 * Opciones de T9 (variantes, hitos, modo objetivo): viven en `ProgresoWidget` de `@lumina/types`;
 * estos alias conservan los nombres que ya usaba el kit.
 */
export type { ProgresoHito, ProgresoVariante };
export type ProgresoT9 = Pick<
  ProgresoWidget,
  'variante' | 'hitos' | 'numeroPasos' | 'modoObjetivo' | 'valorActual' | 'meta' | 'unidad'
>;
export type ProgresoWidgetT9 = ProgresoWidget;

export const PROGRESO_VARIANTES: { id: ProgresoVariante; label: string }[] = [
  { id: 'lineal', label: 'Lineal' },
  { id: 'circular', label: 'Circular' },
  { id: 'semicirculo', label: 'Semicírculo' },
  { id: 'pasos', label: 'Pasos' },
];

export const DEFAULT_PROGRESO_PASOS = 5;
export const PROGRESO_MAX_HITOS = 8;
export const PROGRESO_MAX_PASOS = 12;

const VALID_VARIANTES = new Set<ProgresoVariante>(['lineal', 'circular', 'semicirculo', 'pasos']);

function normalizarHitos(raw: unknown): ProgresoHito[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h): h is { valor: unknown; etiqueta?: unknown } => !!h && typeof h === 'object')
    .map((h) => ({
      valor: clampPercent(h.valor, 0),
      etiqueta: typeof h.etiqueta === 'string' ? h.etiqueta.trim().slice(0, 24) : '',
    }))
    .slice(0, PROGRESO_MAX_HITOS)
    .sort((a, b) => a.valor - b.valor);
}

const VALID_MODOS = new Set<ProgresoModo>(['manual', 'slides']);
const HEX = /^#[0-9A-Fa-f]{6}$/;

function asHex(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value) ? value : fallback;
}

function clampPercent(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function normalizeProgresoWidget(rawBlock: ProgresoWidget): ProgresoWidget {
  const block = rawBlock;
  const modo = VALID_MODOS.has(block.modo) ? block.modo : DEFAULT_PROGRESO_MODO;
  return {
    tipo: 'progreso',
    x: block.x,
    y: block.y,
    ancho: block.ancho,
    alto: block.alto,
    zIndex: block.zIndex,
    modo,
    porcentaje: clampPercent(block.porcentaje, DEFAULT_PROGRESO_PORCENTAJE),
    etiqueta: typeof block.etiqueta === 'string' ? block.etiqueta : '',
    mostrarPorcentaje: block.mostrarPorcentaje !== false,
    striped: Boolean(block.striped),
    animated: Boolean(block.animated),
    colorBarra: asHex(block.colorBarra, DEFAULT_PROGRESO_BARRA),
    colorFondo: asHex(block.colorFondo, DEFAULT_PROGRESO_FONDO),
    colorTexto: asHex(block.colorTexto, DEFAULT_PROGRESO_TEXTO),
    // T9: opciones nuevas; solo se escriben cuando traen un valor válido y no el de por defecto.
    ...(VALID_VARIANTES.has(block.variante as ProgresoVariante) && block.variante !== 'lineal'
      ? { variante: block.variante }
      : {}),
    ...(normalizarHitos(block.hitos).length > 0 ? { hitos: normalizarHitos(block.hitos) } : {}),
    ...(Number.isFinite(Number(block.numeroPasos)) &&
    Math.round(Number(block.numeroPasos)) !== DEFAULT_PROGRESO_PASOS
      ? {
          numeroPasos: Math.min(PROGRESO_MAX_PASOS, Math.max(2, Math.round(Number(block.numeroPasos)))),
        }
      : {}),
    ...(block.modoObjetivo === true ? { modoObjetivo: true } : {}),
    ...(Number.isFinite(Number(block.valorActual)) && Number(block.valorActual) > 0
      ? { valorActual: Number(block.valorActual) }
      : {}),
    ...(Number.isFinite(Number(block.meta)) && Number(block.meta) > 0 && Number(block.meta) !== 100
      ? { meta: Number(block.meta) }
      : {}),
    ...(typeof block.unidad === 'string' && block.unidad.trim()
      ? { unidad: block.unidad.trim().slice(0, 12) }
      : {}),
  } as ProgresoWidget;
}

export function createDefaultProgresoBlock(marco?: BlockMarco): ProgresoWidget {
  const fb = BLOCK_FALLBACKS.progreso;
  return normalizeProgresoWidget({
    tipo: 'progreso',
    modo: DEFAULT_PROGRESO_MODO,
    porcentaje: DEFAULT_PROGRESO_PORCENTAJE,
    etiqueta: '',
    mostrarPorcentaje: true,
    striped: false,
    animated: false,
    colorBarra: DEFAULT_PROGRESO_BARRA,
    colorFondo: DEFAULT_PROGRESO_FONDO,
    colorTexto: DEFAULT_PROGRESO_TEXTO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
  });
}

export function resolveProgresoPercent(
  porcentaje: number,
  modo: ProgresoModo,
  slideIndex: number,
  slideCount: number,
): number {
  if (modo === 'manual') return clampPercent(porcentaje, 0);
  if (slideCount <= 0) return 0;
  const idx = Math.min(Math.max(0, slideIndex), slideCount - 1);
  return Math.round(((idx + 1) / slideCount) * 100);
}

/** Porcentaje (0–100) del modo objetivo: `actual / meta`. Sin meta válida, 0. */
export function resolveProgresoObjetivo(actual: number, meta: number): number {
  if (!Number.isFinite(actual) || !Number.isFinite(meta) || meta <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((actual / meta) * 100)));
}
