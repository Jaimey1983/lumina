// ─── Theming claro/oscuro de @lumina/charts ────────────────────────────────
// Equivalente, para ApexCharts, de lo que `packages/ui/src/chart.tsx`
// resolvía para Recharts (retirado en H5). Lee los tokens CSS reales de la
// app (`--foreground`, `--muted-foreground`, `--border`, `--card`) en vez de
// mantener una paleta de tema paralela y desincronizable.

export interface LuminaChartTheme {
  foreColor: string;
  mutedColor: string;
  borderColor: string;
  surfaceColor: string;
  /** `true` si se resolvió de tokens reales del DOM; `false` en el fallback SSR/sin-navegador. */
  resolvedFromDom: boolean;
}

// Fallback — mismos valores que el modo claro por defecto de `globals.css`,
// para que SSR y el primer paint no muestren un tema "roto" antes de hidratar.
const FALLBACK_THEME: LuminaChartTheme = {
  foreColor: '#0a0a0a',
  mutedColor: '#71717a',
  borderColor: '#e4e4e7',
  surfaceColor: '#ffffff',
  resolvedFromDom: false,
};

function readCssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

/**
 * Resuelve los tokens de tema para el gráfico activo. SSR-safe: sin `document`
 * (build de servidor, entorno de test node) devuelve el fallback claro y
 * `resolvedFromDom: false` — el consumidor (`<LuminaChart>`) solo debe llamar
 * a esto en cliente, después de montar.
 */
export function resolveChartTheme(): LuminaChartTheme {
  if (typeof document === 'undefined') {
    return FALLBACK_THEME;
  }

  const styles = getComputedStyle(document.documentElement);

  return {
    foreColor: readCssVar(styles, '--foreground', FALLBACK_THEME.foreColor),
    mutedColor: readCssVar(styles, '--muted-foreground', FALLBACK_THEME.mutedColor),
    borderColor: readCssVar(styles, '--border', FALLBACK_THEME.borderColor),
    surfaceColor: readCssVar(styles, '--card', FALLBACK_THEME.surfaceColor),
    resolvedFromDom: true,
  };
}
