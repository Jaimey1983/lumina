import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { ProgresoModo, ProgresoWidget } from '@/types/widget.types';

export const DEFAULT_PROGRESO_MODO: ProgresoModo = 'slides';
export const DEFAULT_PROGRESO_PORCENTAJE = 45;
export const DEFAULT_PROGRESO_BARRA = '#0d6efd';
export const DEFAULT_PROGRESO_FONDO = '#e9ecef';
export const DEFAULT_PROGRESO_TEXTO = '#ffffff';

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

export function normalizeProgresoWidget(block: ProgresoWidget): ProgresoWidget {
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
  };
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
