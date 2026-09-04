import type { CSSProperties } from 'react';

import type {
  Background,
  BackgroundGradient,
  BackgroundImage,
  GradientColorStop,
} from '@/types/slide.types';

const DEFAULT_GRADIENT_START = '#6366f1';
const DEFAULT_GRADIENT_END = '#ec4899';

export const SOLID_BACKGROUND_PRESETS = [
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#fef3c7',
  '#dbeafe',
  '#dcfce7',
  '#fce7f3',
  '#1e293b',
  '#111827',
  '#2563eb',
  '#7c3aed',
  '#059669',
] as const;

export interface GradientPreset {
  label: string;
  direccion: number;
  stops: GradientColorStop[];
}

export const GRADIENT_BACKGROUND_PRESETS: GradientPreset[] = [
  {
    label: 'Azul',
    direccion: 135,
    stops: [
      { color: '#0ea5e9', position: 0 },
      { color: '#6366f1', position: 100 },
    ],
  },
  {
    label: 'Atardecer',
    direccion: 135,
    stops: [
      { color: '#f97316', position: 0 },
      { color: '#ec4899', position: 55 },
      { color: '#8b5cf6', position: 100 },
    ],
  },
  {
    label: 'Verde',
    direccion: 135,
    stops: [
      { color: '#22c55e', position: 0 },
      { color: '#14b8a6', position: 100 },
    ],
  },
  {
    label: 'Oscuro',
    direccion: 135,
    stops: [
      { color: '#18181b', position: 0 },
      { color: '#3f3f46', position: 100 },
    ],
  },
  {
    label: 'Aurora',
    direccion: 120,
    stops: [
      { color: '#312e81', position: 0 },
      { color: '#7c3aed', position: 35 },
      { color: '#ec4899', position: 70 },
      { color: '#fbbf24', position: 100 },
    ],
  },
  {
    label: 'Océano',
    direccion: 160,
    stops: [
      { color: '#0c4a6e', position: 0 },
      { color: '#0284c7', position: 45 },
      { color: '#38bdf8', position: 100 },
    ],
  },
];

function clampPosition(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function clampPositionFloat(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function sortGradientStops(stops: GradientColorStop[]): GradientColorStop[] {
  return [...stops].sort((a, b) => a.position - b.position);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex);
  const match = normalized.match(/^#([0-9a-f]{6})$/);
  if (!match) return null;
  const h = match[1];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function lerpHexColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  if (!a || !b) return from;
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = mix(a[0], b[0]);
  const g = mix(a[1], b[1]);
  const bl = mix(a[2], b[2]);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

/** Interpolate color at `position` (0–100) along expanded gradient stops. */
export function interpolateGradientColorAtPosition(
  stops: GradientColorStop[],
  position: number,
): string {
  const expanded = expandGradientStopsForCss(stops);
  if (expanded.length === 0) return '#ffffff';
  if (expanded.length === 1) return expanded[0].color;
  if (position <= expanded[0].position) return expanded[0].color;
  if (position >= expanded[expanded.length - 1].position) {
    return expanded[expanded.length - 1].color;
  }

  for (let i = 0; i < expanded.length - 1; i++) {
    const left = expanded[i];
    const right = expanded[i + 1];
    if (position >= left.position && position <= right.position) {
      const span = right.position - left.position;
      const t = span === 0 ? 0 : (position - left.position) / span;
      return lerpHexColor(left.color, right.color, t);
    }
  }
  return expanded[expanded.length - 1].color;
}

const MIN_STOP_GAP = 0.5;

export const DEFAULT_GRADIENT_MIDPOINT = 50;
export const GRADIENT_MIDPOINT_MIN = 13;
export const GRADIENT_MIDPOINT_MAX = 87;

export function clampMidpoint(value: number): number {
  return Math.min(
    GRADIENT_MIDPOINT_MAX,
    Math.max(GRADIENT_MIDPOINT_MIN, Math.round(value)),
  );
}

export function midpointHandlePosition(
  left: GradientColorStop,
  right: GradientColorStop,
): number {
  const mid = left.puntoMedio ?? DEFAULT_GRADIENT_MIDPOINT;
  return clampPositionFloat(
    left.position + (right.position - left.position) * (mid / 100),
  );
}

export function midpointFromHandlePosition(
  leftPos: number,
  rightPos: number,
  handlePos: number,
): number {
  const span = rightPos - leftPos;
  if (span <= 0) return DEFAULT_GRADIENT_MIDPOINT;
  return clampMidpoint(((handlePos - leftPos) / span) * 100);
}

/** Expande stops con puntos medios para CSS (transiciones suaves). */
export function expandGradientStopsForCss(
  stops: GradientColorStop[],
): Array<{ color: string; position: number }> {
  const sorted = sortGradientStops(stops.map(normalizeGradientStop));
  if (sorted.length === 0) return [];
  if (sorted.length === 1) {
    return [{ color: sorted[0].color, position: sorted[0].position }];
  }

  const css: Array<{ color: string; position: number }> = [];

  for (let i = 0; i < sorted.length; i++) {
    css.push({ color: sorted[i].color, position: sorted[i].position });
    if (i < sorted.length - 1) {
      const mid = sorted[i].puntoMedio ?? DEFAULT_GRADIENT_MIDPOINT;
      const p0 = sorted[i].position;
      const p1 = sorted[i + 1].position;
      const pMid = clampPositionFloat(p0 + (p1 - p0) * (mid / 100));
      const cMid = lerpHexColor(sorted[i].color, sorted[i + 1].color, 0.5);
      css.push({ color: cMid, position: pMid });
    }
  }

  return css.sort((a, b) => a.position - b.position);
}

/** Clamp drag position so stops do not cross neighbors (Illustrator-like). */
export function clampStopDragPosition(
  stops: GradientColorStop[],
  index: number,
  nextPosition: number,
): number {
  const indexed = stops.map((stop, i) => ({ stop, i }));
  indexed.sort((a, b) => a.stop.position - b.stop.position);
  const sortedIndex = indexed.findIndex((x) => x.i === index);
  if (sortedIndex < 0) return clampPositionFloat(nextPosition);

  const min =
    sortedIndex > 0
      ? indexed[sortedIndex - 1].stop.position + MIN_STOP_GAP
      : 0;
  const max =
    sortedIndex < indexed.length - 1
      ? indexed[sortedIndex + 1].stop.position - MIN_STOP_GAP
      : 100;

  return clampPositionFloat(Math.min(max, Math.max(min, nextPosition)));
}

export function positionFromPointer(clientX: number, rect: DOMRect): number {
  const ratio = (clientX - rect.left) / rect.width;
  return clampPositionFloat(ratio * 100);
}

function normalizeHex(color: string): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const h = trimmed.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return trimmed;
}

export function normalizeGradientStop(stop: GradientColorStop): GradientColorStop {
  const normalized: GradientColorStop = {
    color: normalizeHex(stop.color),
    position: clampPosition(stop.position),
  };
  if (stop.puntoMedio !== undefined) {
    normalized.puntoMedio = clampMidpoint(stop.puntoMedio);
  }
  return normalized;
}

/** Resolve 2+ stops from `stops` or legacy `inicio`/`fin`. */
export function getGradientStops(grad: BackgroundGradient): GradientColorStop[] {
  if (Array.isArray(grad.stops) && grad.stops.length >= 2) {
    return grad.stops.map(normalizeGradientStop).sort((a, b) => a.position - b.position);
  }
  return [
    { color: normalizeHex(grad.inicio ?? DEFAULT_GRADIENT_START), position: 0 },
    { color: normalizeHex(grad.fin ?? DEFAULT_GRADIENT_END), position: 100 },
  ];
}

export function buildLinearGradientCss(stops: GradientColorStop[], deg: number): string {
  const expanded = expandGradientStopsForCss(stops);
  const parts = expanded.map((s) => `${s.color} ${s.position}%`).join(', ');
  return `linear-gradient(${deg}deg, ${parts})`;
}

export function createGradientBackground(
  stops: GradientColorStop[],
  direccion = 135,
): BackgroundGradient {
  const normalized = stops.map(normalizeGradientStop).sort((a, b) => a.position - b.position);
  return {
    tipo: 'gradiente',
    stops: normalized,
    inicio: normalized[0]?.color,
    fin: normalized[normalized.length - 1]?.color,
    direccion,
  };
}

export function normalizeBackgroundGradient(grad: BackgroundGradient): BackgroundGradient {
  const stops = getGradientStops(grad);
  return createGradientBackground(stops, grad.direccion ?? 135);
}

export function normalizeBackground(fondo: unknown): Background | undefined {
  if (!fondo || typeof fondo !== 'object' || Array.isArray(fondo)) return undefined;
  const f = fondo as Record<string, unknown>;
  const tipo = f.tipo;
  if (tipo === 'color' && typeof f.valor === 'string') {
    return { tipo: 'color', valor: normalizeHex(f.valor) };
  }
  if (tipo === 'gradiente') {
    return normalizeBackgroundGradient(f as unknown as BackgroundGradient);
  }
  if (tipo === 'imagen' && typeof f.url === 'string' && f.url.length > 0) {
    const img: BackgroundImage = {
      tipo: 'imagen',
      url: f.url,
      ajuste:
        f.ajuste === 'cubrir' ||
        f.ajuste === 'contener' ||
        f.ajuste === 'llenar' ||
        f.ajuste === 'ninguno'
          ? f.ajuste
          : 'cubrir',
    };
    if (typeof f.posicion === 'string') img.posicion = f.posicion;
    if (typeof f.rotacion === 'number') {
      img.rotacion = ((f.rotacion % 360) + 360) % 360;
    }
    return img;
  }
  return undefined;
}

export function backgroundToCssStyle(fondo?: Background): CSSProperties {
  if (!fondo) return { backgroundColor: '#ffffff' };

  switch (fondo.tipo) {
    case 'color':
      return { backgroundColor: fondo.valor };

    case 'gradiente': {
      const deg = fondo.direccion ?? 135;
      const stops = getGradientStops(fondo);
      return { background: buildLinearGradientCss(stops, deg) };
    }

    case 'imagen': {
      if (typeof fondo.rotacion === 'number' && fondo.rotacion % 360 !== 0) {
        return { backgroundColor: '#ffffff' };
      }
      const sizeMap: Record<string, string> = {
        cubrir: 'cover',
        contener: 'contain',
        llenar: '100% 100%',
        ninguno: 'auto',
      };
      return {
        backgroundImage: `url(${JSON.stringify(fondo.url)})`,
        backgroundSize: sizeMap[fondo.ajuste ?? 'cubrir'] ?? 'cover',
        backgroundPosition: fondo.posicion ?? 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }
}

/** Sample string for luminance / variant heuristics (all gradient colors). */
export function backgroundColorSample(fondo?: Background): string | undefined {
  if (!fondo) return undefined;
  switch (fondo.tipo) {
    case 'color':
      return fondo.valor;
    case 'gradiente':
      return getGradientStops(fondo)
        .map((s) => s.color)
        .join(' ');
    case 'imagen':
      return fondo.url;
    default:
      return undefined;
  }
}

export function defaultSolidFromFondo(f?: Background): string {
  if (f?.tipo === 'color') return f.valor;
  return '#ffffff';
}

export function defaultGradientDraftFromFondo(f?: Background): {
  stops: GradientColorStop[];
  direccion: number;
} {
  if (f?.tipo === 'gradiente') {
    return {
      stops: getGradientStops(f).map((s) => ({ ...s })),
      direccion: f.direccion ?? 135,
    };
  }
  return {
    stops: GRADIENT_BACKGROUND_PRESETS[0].stops.map((s) => ({ ...s })),
    direccion: 135,
  };
}

export function defaultImageUrlFromFondo(f?: Background): string {
  if (f?.tipo === 'imagen') return f.url;
  return '';
}

export function defaultImageRotationFromFondo(f?: Background): number {
  if (f?.tipo === 'imagen' && typeof f.rotacion === 'number') {
    return ((f.rotacion % 360) + 360) % 360;
  }
  return 0;
}

export type BackgroundImageAjuste = NonNullable<BackgroundImage['ajuste']>;

export function defaultImageAjusteFromFondo(f?: Background): BackgroundImageAjuste {
  if (f?.tipo === 'imagen' && f.ajuste) {
    return f.ajuste;
  }
  return 'cubrir';
}

export function backgroundAjusteToObjectFit(
  ajuste?: string,
): 'cover' | 'contain' | 'fill' | 'none' {
  switch (ajuste) {
    case 'contener':
      return 'contain';
    case 'llenar':
      return 'fill';
    case 'ninguno':
      return 'none';
    case 'cubrir':
    default:
      return 'cover';
  }
}

export function backgroundRotatedLayerSize(rotacion = 0): {
  width: string;
  height: string;
} {
  const norm = ((rotacion % 360) + 360) % 360;
  if (norm === 90 || norm === 270) {
    return { width: '56.25%', height: '177.777778%' };
  }
  return { width: '100%', height: '100%' };
}

export function gradientDirectionLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized === 0 || normalized === 360) return 'Arriba';
  if (normalized === 90) return 'Derecha';
  if (normalized === 180) return 'Abajo';
  if (normalized === 270) return 'Izquierda';
  if (normalized === 135) return 'Diagonal';
  return `${normalized}°`;
}
