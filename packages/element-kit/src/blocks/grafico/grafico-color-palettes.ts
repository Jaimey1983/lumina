// ─── Paletas de colores pedagógicas para gráficos Lumina ───────────────────────
// Paletas seleccionadas para legibilidad, contraste y armonía visual.

export interface ColorPalette {
  id: string;
  nombre: string;
  colores: string[];
}

export const GRAFICO_PALETAS: Record<string, ColorPalette> = {
  lumina: {
    id: 'lumina',
    nombre: 'Lumina (Predeterminada)',
    colores: [
      '#3B82F6', // Azul primario
      '#10B981', // Esmeralda
      '#F59E0B', // Ámbar
      '#EC4899', // Rosa
      '#8B5CF6', // Violeta
      '#06B6D4', // Cian
      '#F97316', // Naranja
      '#14B8A6', // Turquesa
    ],
  },
  vivida: {
    id: 'vivida',
    nombre: 'Vívida',
    colores: [
      '#2563EB',
      '#DC2626',
      '#16A34A',
      '#D97706',
      '#7C3AED',
      '#0891B2',
      '#DB2777',
      '#4F46E5',
    ],
  },
  pastel: {
    id: 'pastel',
    nombre: 'Pastel Suave',
    colores: [
      '#93C5FD',
      '#86EFAC',
      '#FDE047',
      '#F9A8D4',
      '#C4B5FD',
      '#67E8F9',
      '#FDBA74',
      '#A7F3D0',
    ],
  },
  oceano: {
    id: 'oceano',
    nombre: 'Océano',
    colores: [
      '#0284C7',
      '#0EA5E9',
      '#38BDF8',
      '#0D9488',
      '#14B8A6',
      '#2DD4BF',
      '#6366F1',
      '#818CF8',
    ],
  },
  atardecer: {
    id: 'atardecer',
    nombre: 'Atardecer Cálido',
    colores: [
      '#E11D48',
      '#F43F5E',
      '#FB7185',
      '#EA580C',
      '#F97316',
      '#FB923C',
      '#D97706',
      '#FBBF24',
    ],
  },
  naturaleza: {
    id: 'naturaleza',
    nombre: 'Naturaleza',
    colores: [
      '#15803D',
      '#16A34A',
      '#22C55E',
      '#84CC16',
      '#A3E635',
      '#0D9488',
      '#059669',
      '#10B981',
    ],
  },
  monocromo: {
    id: 'monocromo',
    nombre: 'Monocromo Azul',
    colores: [
      '#1E3A8A',
      '#1D4ED8',
      '#2563EB',
      '#3B82F6',
      '#60A5FA',
      '#93C5FD',
      '#BFDBFE',
      '#DBEAFE',
    ],
  },
};

export const DEFAULT_GRAFICO_PALETA_ID = 'lumina';

/**
 * Obtiene el color correspondiente para un índice dado respetando la paleta elegida o un color personalizado.
 */
export function getSeriesColor(
  serieIndex: number,
  paletaId?: string,
  customColor?: string,
): string {
  if (customColor && customColor.trim().length > 0) {
    return customColor;
  }
  const paleta = GRAFICO_PALETAS[paletaId ?? DEFAULT_GRAFICO_PALETA_ID] ?? GRAFICO_PALETAS.lumina;
  return paleta.colores[serieIndex % paleta.colores.length];
}
