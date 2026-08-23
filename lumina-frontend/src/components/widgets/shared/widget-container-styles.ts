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

/** Variables CSS comunes de acento/borde/nav para chrome del widget. */
export function widgetChromeVarsStyle(vars: {
  accent?: string;
  accentMuted?: string;
  border?: string;
  nav?: string;
}): CSSProperties {
  return {
    '--widget-accent': vars.accent ?? '#2563eb',
    '--widget-accent-muted': vars.accentMuted ?? '#2563eb',
    '--widget-border': vars.border ?? '#93c5fd',
    '--widget-nav': vars.nav ?? '#0f172a',
  } as CSSProperties;
}
