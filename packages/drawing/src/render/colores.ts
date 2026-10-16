// ─── Colores de la escena para el render (W3) ─────────────────────────────────
// La escena guarda colores como hex o `var(--token)`. En pantalla (modo `css`) los
// tokens se dejan tal cual para que sigan al tema de la app; en un archivo suelto
// (SVG/PNG) no existen las variables CSS, así que se resuelven a hex por tema.

import type { Color } from '../tipos.js';

export type ModoColor = 'css' | 'claro' | 'oscuro';

const TOKENS: Record<'claro' | 'oscuro', Record<string, string>> = {
  claro: {
    background: '#FFFFFF',
    foreground: '#0F172A',
    card: '#FFFFFF',
    'card-foreground': '#0F172A',
    muted: '#F1F5F9',
    'muted-foreground': '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    'primary-foreground': '#FFFFFF',
    secondary: '#F1F5F9',
    accent: '#F1F5F9',
    destructive: '#DC2626',
    'chart-1': '#2563EB',
    'chart-2': '#10B981',
    'chart-3': '#F59E0B',
    'chart-4': '#8B5CF6',
    'chart-5': '#F43F5E',
  },
  oscuro: {
    background: '#0F172A',
    foreground: '#F1F5F9',
    card: '#1E293B',
    'card-foreground': '#F1F5F9',
    muted: '#1E293B',
    'muted-foreground': '#94A3B8',
    border: '#334155',
    primary: '#60A5FA',
    'primary-foreground': '#0F172A',
    secondary: '#334155',
    accent: '#334155',
    destructive: '#F87171',
    'chart-1': '#60A5FA',
    'chart-2': '#34D399',
    'chart-3': '#FBBF24',
    'chart-4': '#A78BFA',
    'chart-5': '#FB7185',
  },
};

const GRIS_DESCONOCIDO = '#64748B';

export interface Pintura {
  /** Valor para `fill` / `stroke` / `stop-color` (hex de 6 dígitos o `var(--token)`). */
  color: string;
  /** 0–1; sale del canal alfa de un hex de 8 dígitos. */
  opacidad: number;
}

/** Hex de 3, 6 u 8 dígitos → `#rrggbb` + opacidad. */
function descomponerHex(hex: string): Pintura {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const color = `#${h.slice(0, 6).toUpperCase()}`;
  const opacidad = h.length === 8 ? Math.round((parseInt(h.slice(6, 8), 16) / 255) * 100) / 100 : 1;
  return { color, opacidad };
}

export function resolverColor(color: Color, modo: ModoColor): Pintura {
  if (color.startsWith('#')) return descomponerHex(color);
  if (modo === 'css') return { color, opacidad: 1 };
  const nombre = /^var\(--([a-z0-9-]+)\)$/i.exec(color)?.[1]?.toLowerCase() ?? '';
  const hex = TOKENS[modo][nombre] ?? GRIS_DESCONOCIDO;
  return { color: hex, opacidad: 1 };
}
