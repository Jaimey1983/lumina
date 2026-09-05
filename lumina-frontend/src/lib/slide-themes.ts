import type { SlideTheme } from '@/types/slide.types';

export { backgroundToCssStyle } from '@/lib/slide-background';

/** Id reservado para quitar el tema visual del slide. */
export const NO_SLIDE_THEME_ID = 'sin_tema';

export const NO_SLIDE_THEME: SlideTheme = {
  id: NO_SLIDE_THEME_ID,
  nombre: 'Sin tema',
  esPersonalizado: false,
  fondo: { tipo: 'color', valor: '#FFFFFF' },
  fuente: 'Inter',
  colores: {
    texto: '#111827',
    textoSecundario: '#6B7280',
    acento: '#9CA3AF',
    fondo: '#FFFFFF',
  },
};

export const PREDEFINED_SLIDE_THEMES: SlideTheme[] = [
  {
    id: 'lumina',
    nombre: 'Lumina',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#FFFFFF' },
    fuente: 'Inter',
    colores: {
      texto: '#111827',
      textoSecundario: '#6B7280',
      acento: '#2563EB',
      fondo: '#FFFFFF',
    },
  },
  {
    id: 'oscuro',
    nombre: 'Oscuro',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#111827' },
    fuente: 'Inter',
    colores: {
      texto: '#FFFFFF',
      textoSecundario: '#9CA3AF',
      acento: '#60A5FA',
      fondo: '#111827',
    },
  },
  {
    id: 'pizarron',
    nombre: 'Pizarrón',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#1E3A2F' },
    fuente: 'Georgia',
    colores: {
      texto: '#F0FDF4',
      textoSecundario: '#86EFAC',
      acento: '#4ADE80',
      fondo: '#1E3A2F',
    },
  },
  {
    id: 'minimalista',
    nombre: 'Minimalista',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#FAFAFA' },
    fuente: 'Plus Jakarta Sans',
    colores: {
      texto: '#111827',
      textoSecundario: '#6B7280',
      acento: '#000000',
      fondo: '#FAFAFA',
    },
  },
  {
    id: 'escolar',
    nombre: 'Escolar',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#FEF9C3' },
    fuente: 'Nunito',
    colores: {
      texto: '#713F12',
      textoSecundario: '#A16207',
      acento: '#F59E0B',
      fondo: '#FEF9C3',
    },
  },
  {
    id: 'oceano',
    nombre: 'Océano',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#0F172A' },
    fuente: 'Poppins',
    colores: {
      texto: '#E0F2FE',
      textoSecundario: '#7DD3FC',
      acento: '#38BDF8',
      fondo: '#0F172A',
    },
  },
];

const PREDEFINED_BY_ID = new Map(PREDEFINED_SLIDE_THEMES.map((t) => [t.id, t]));

export function getPredefinedSlideTheme(id: string): SlideTheme | undefined {
  return PREDEFINED_BY_ID.get(id);
}

export function findSlideThemeById(
  id: string | undefined,
  customThemes: SlideTheme[],
): SlideTheme | undefined {
  if (!id) return undefined;
  return getPredefinedSlideTheme(id) ?? customThemes.find((t) => t.id === id);
}

/** Parche de `content` al aplicar un tema (solo fondo + temaId; no toca bloques). */
export function buildSlideContentWithTheme(
  baseContent: Record<string, unknown>,
  theme: SlideTheme,
): Record<string, unknown> {
  if (theme.id === NO_SLIDE_THEME_ID) {
    return buildSlideContentClearTheme(baseContent);
  }
  return {
    ...baseContent,
    fondo: theme.fondo,
    temaId: theme.id,
  };
}

/** Quita el tema y restaura fondo blanco por defecto. */
export function buildSlideContentClearTheme(
  baseContent: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...baseContent,
    fondo: { tipo: 'color', valor: '#FFFFFF' },
  };
  delete next.temaId;
  return next;
}

export function getSlideTemaIdFromContent(content: unknown): string | undefined {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return undefined;
  const id = (content as Record<string, unknown>).temaId;
  if (typeof id !== 'string' || id.length === 0 || id === NO_SLIDE_THEME_ID) return undefined;
  return id;
}

export function isNoSlideThemeActive(content: unknown): boolean {
  return getSlideTemaIdFromContent(content) === undefined;
}

export function createEmptyCustomTheme(): SlideTheme {
  return {
    id: `custom_${Date.now()}`,
    nombre: 'Mi tema',
    esPersonalizado: true,
    fondo: { tipo: 'color', valor: '#FFFFFF' },
    fuente: 'Inter',
    colores: {
      texto: '#111827',
      textoSecundario: '#6B7280',
      acento: '#2563EB',
      fondo: '#FFFFFF',
    },
  };
}
