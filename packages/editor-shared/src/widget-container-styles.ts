import type { CSSProperties } from 'react';

/** Fondo del contenedor del widget con opacidad. */
export function widgetContainerBackgroundStyle(
  colorFondoContenedor: string,
  opacidadFondoContenedor: number,
): CSSProperties {
  const alpha = opacidadFondoContenedor / 100;
  const hex = colorFondoContenedor;
  if (alpha >= 1) return { backgroundColor: hex };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
}

export function widgetHeaderPadding(paddingContenedor: number): CSSProperties {
  return {
    paddingLeft: paddingContenedor,
    paddingRight: paddingContenedor,
    paddingTop: paddingContenedor,
  };
}

export function widgetBodyPadding(paddingContenedor: number): CSSProperties {
  return {
    paddingLeft: paddingContenedor,
    paddingRight: paddingContenedor,
    paddingBottom: paddingContenedor,
  };
}

export interface WidgetThemeVarsOptions {
  accent?: string;
  accentMuted?: string;
  border?: string;
  nav?: string;
  bg?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
  fontFamily?: string;
}

/**
 * Genera la escala completa de tokens de diseño semánticos (--lw-*) para widgets,
 * manteniendo además las variables históricas (--widget-*) para compatibilidad total.
 */
export function createWidgetThemeVars(vars?: WidgetThemeVarsOptions): CSSProperties {
  const accent = vars?.accent ?? '#2563eb';
  const accentMuted = vars?.accentMuted ?? '#93c5fd';
  const border = vars?.border ?? '#e2e8f0';
  const nav = vars?.nav ?? '#0f172a';
  const bg = vars?.bg ?? '#ffffff';
  const surface = vars?.surface ?? '#f8fafc';
  const text = vars?.text ?? '#0f172a';
  const textMuted = vars?.textMuted ?? '#64748b';
  const fontFamily = vars?.fontFamily ?? 'inherit';

  return {
    // Compatibilidad previa
    '--widget-accent': accent,
    '--widget-accent-muted': accentMuted,
    '--widget-border': border,
    '--widget-nav': nav,

    // Escala semántica Lumina Widget (--lw-*)
    '--lw-color-primary': accent,
    '--lw-color-primary-muted': accentMuted,
    '--lw-color-accent': accent,
    '--lw-color-accent-muted': accentMuted,
    '--lw-color-border': border,
    '--lw-color-nav': nav,
    '--lw-color-bg': bg,
    '--lw-color-surface': surface,
    '--lw-color-text': text,
    '--lw-color-text-muted': textMuted,

    // Colores semánticos de estado (T1). Los defaults son los que los widgets
    // usaban fijos en su CSS, para que adoptar el token no cambie el aspecto.
    '--lw-color-secondary': '#6c757d',
    '--lw-color-success': '#198754',
    '--lw-color-danger': '#dc3545',
    '--lw-color-warning': '#ffc107',
    '--lw-color-info': '#0dcaf0',
    '--lw-color-light': '#f8f9fa',
    '--lw-color-dark': '#212529',
    // Texto sobre un fondo sólido oscuro / claro.
    '--lw-color-on-solid': '#ffffff',
    '--lw-color-on-bright': '#000000',
    '--lw-color-primary-soft': '#eff6ff',

    // Escala neutra (slate): solo los pasos que usan los widgets. El 200 es
    // `--lw-color-border`, el 500 `--lw-color-text-muted`, el 900 `--lw-color-text`.
    '--lw-neutral-100': '#f1f5f9',
    '--lw-neutral-300': '#cbd5e1',
    '--lw-neutral-400': '#94a3b8',
    '--lw-neutral-600': '#475569',
    '--lw-neutral-700': '#334155',

    // Escala de espaciado
    '--lw-space-1': '0.25rem',
    '--lw-space-2': '0.5rem',
    '--lw-space-3': '0.75rem',
    '--lw-space-4': '1rem',
    '--lw-space-6': '1.5rem',
    '--lw-space-8': '2rem',

    // Escala de radios
    '--lw-radius-sm': '0.25rem',
    '--lw-radius-md': '0.5rem',
    '--lw-radius-lg': '0.75rem',
    '--lw-radius-full': '9999px',

    // Escala de elevaciones (box-shadow). `--lw-shadow-*` se conserva por
    // compatibilidad; `--lw-elevation-N` es el nombre de la escala 0–4.
    '--lw-shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '--lw-shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '--lw-shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '--lw-shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '--lw-elevation-0': 'none',
    '--lw-elevation-1': 'var(--lw-shadow-sm)',
    '--lw-elevation-2': 'var(--lw-shadow-md)',
    '--lw-elevation-3': 'var(--lw-shadow-lg)',
    '--lw-elevation-4': 'var(--lw-shadow-xl)',

    // Tipografía
    '--lw-font-family': fontFamily,

    // Movimiento. `--lw-motion-*` son SOLO duraciones: los CSS los usan como
    // `transition: color var(--lw-motion-fast, 0.15s) ease-in-out`, y una curva
    // dentro del valor invalidaba toda la declaración. La curva va aparte.
    '--lw-motion-fast': '150ms',
    '--lw-motion-base': '250ms',
    '--lw-motion-slow': '400ms',
    '--lw-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
  } as CSSProperties;
}

export interface ResolvedWidgetColors {
  primary: string;
  primaryMuted: string;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  nav: string;
}

export interface ResolvedWidgetTheme {
  style: CSSProperties;
  colors: ResolvedWidgetColors;
}

/**
 * Resuelve los tokens semánticos y colores a partir de un SlideTheme (o fallback)
 * y posibles overrides explícitos del widget.
 */
export function resolveWidgetThemeTokens(
  theme?: import('@lumina/types/slide').SlideTheme | null,
  overrides?: WidgetThemeVarsOptions,
): ResolvedWidgetTheme {
  const primary = overrides?.accent ?? theme?.colores?.acento ?? '#2563eb';
  const text = overrides?.text ?? theme?.colores?.texto ?? '#0f172a';
  const textMuted = overrides?.textMuted ?? theme?.colores?.textoSecundario ?? '#64748b';
  const bg = overrides?.bg ?? theme?.colores?.fondo ?? '#ffffff';
  const border = overrides?.border ?? '#e2e8f0';
  const primaryMuted = overrides?.accentMuted ?? '#93c5fd';
  const nav = overrides?.nav ?? text;
  const surface = overrides?.surface ?? (bg === '#ffffff' ? '#f8fafc' : bg);
  const fontFamily = overrides?.fontFamily ?? theme?.fuente ?? 'inherit';

  const style = createWidgetThemeVars({
    accent: primary,
    accentMuted: primaryMuted,
    border,
    nav,
    bg,
    surface,
    text,
    textMuted,
    fontFamily,
  });

  const colors: ResolvedWidgetColors = {
    primary,
    primaryMuted,
    bg,
    surface,
    text,
    textMuted,
    border,
    nav,
  };

  return { style, colors };
}

/** Variables CSS comunes de acento/borde/nav para chrome del widget (retrocompatible). */
export function widgetChromeVarsStyle(vars: {
  accent?: string;
  accentMuted?: string;
  border?: string;
  nav?: string;
}): CSSProperties {
  return createWidgetThemeVars({
    accent: vars.accent,
    accentMuted: vars.accentMuted,
    border: vars.border,
    nav: vars.nav,
  });
}


