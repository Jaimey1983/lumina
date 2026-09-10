import type { CSSProperties } from 'react';
import type { SlideTheme, ThemeTextRole, ThemeTextStyle } from '@lumina/types/slide';
import { fontFamilyWithFallback } from './font-catalog.js';

/** Preset base de cada rol tipográfico (cuando el tema no define nada). */
export const THEME_ROLE_DEFAULTS: Record<ThemeTextRole, ThemeTextStyle> = {
  titulo: { tamanoFuente: 40, negrita: true, interlineado: 1.1, espaciadoLetras: -0.5 },
  cuerpo: { tamanoFuente: 20, negrita: false, interlineado: 1.5 },
  pie: { tamanoFuente: 14, negrita: false, interlineado: 1.4 },
};

/**
 * Estilo efectivo de un rol tipográfico: preset del rol + fuente/colores del
 * tema + overrides de `theme.tipografia[rol]`. El bloque de texto lo usa como
 * capa base (sus ajustes explícitos ganan por encima).
 */
export function resolveThemeTextStyle(
  theme: SlideTheme | null | undefined,
  rol: ThemeTextRole,
): CSSProperties {
  const base = THEME_ROLE_DEFAULTS[rol];
  const override = theme?.tipografia?.[rol] ?? {};
  const merged: ThemeTextStyle = { ...base, ...override };

  const fuente = merged.fuente ?? theme?.fuente;
  const color =
    merged.color ??
    (rol === 'pie' ? theme?.colores.textoSecundario : theme?.colores.texto);

  const out: CSSProperties = {};
  if (fuente) out.fontFamily = fontFamilyWithFallback(fuente);
  if (merged.tamanoFuente !== undefined) out.fontSize = `${merged.tamanoFuente}px`;
  if (merged.negrita !== undefined) out.fontWeight = merged.negrita ? 700 : 400;
  if (color) out.color = color;
  if (merged.interlineado !== undefined) out.lineHeight = merged.interlineado;
  if (merged.espaciadoLetras !== undefined) {
    out.letterSpacing = `${merged.espaciadoLetras}px`;
  }
  if (merged.transform && merged.transform !== 'none') {
    out.textTransform = merged.transform;
  }
  return out;
}
