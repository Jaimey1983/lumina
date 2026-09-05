import type { TimelineVariante } from '@/types/widget.types';

import styles from './timeline.module.css';

export const TIMELINE_SEGMENT_PALETTE = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#A855F7',
  '#EC4899',
  '#64748B',
] as const;

export const TIMELINE_SEGMENT_VARIANTES: TimelineVariante[] = [
  'segmentada',
  'corporate',
  'infografica',
];

export const TIMELINE_VARIANTES: {
  id: TimelineVariante;
  label: string;
  description: string;
}[] = [
  {
    id: 'tarjetas',
    label: 'Tarjetas',
    description: 'Recuadros alternados sobre la línea.',
  },
  {
    id: 'minimal',
    label: 'Minimalista',
    description: 'Texto libre sin cajas, estilo histórico.',
  },
  {
    id: 'iconos',
    label: 'Iconos',
    description: 'Nodos circulares con imagen o icono y halo.',
  },
  {
    id: 'segmentada',
    label: 'Segmentada',
    description: 'Barra segmentada: eje en bloques de color con año en cada tramo.',
  },
  {
    id: 'vertical',
    label: 'Vertical',
    description: 'Etiquetas verticales: año rotado y texto lateral.',
  },
  {
    id: 'corporate',
    label: 'Corporativa',
    description: 'Barra segmentada, icono Lucide y títulos de color.',
  },
  {
    id: 'proyecto',
    label: 'Proyecto',
    description: 'Números grandes, icono en círculo y foto opcional.',
  },
  {
    id: 'infografica',
    label: 'Infográfica',
    description: 'Barra multicolor, halo e iconos en cada hito.',
  },
];

export function timelineUsesSegmentBar(variante: TimelineVariante): boolean {
  return TIMELINE_SEGMENT_VARIANTES.includes(variante);
}

export function timelineUsesLucideDot(variante: TimelineVariante): boolean {
  return ['iconos', 'corporate', 'proyecto', 'infografica'].includes(variante);
}

export function timelineImageInDot(variante: TimelineVariante): boolean {
  return variante === 'iconos' || variante === 'infografica';
}

export function timelineVariantRootClass(variante: TimelineVariante): string {
  switch (variante) {
    case 'minimal':
      return styles.tlVariantMinimal;
    case 'iconos':
      return styles.tlVariantIconos;
    case 'segmentada':
      return styles.tlVariantSegmentada;
    case 'vertical':
      return styles.tlVariantVertical;
    case 'corporate':
      return styles.tlVariantCorporate;
    case 'proyecto':
      return styles.tlVariantProyecto;
    case 'infografica':
      return styles.tlVariantInfografica;
    default:
      return styles.tlVariantTarjetas;
  }
}

export function timelineNodeAccentColor(
  nodo: { colorAccent?: string },
  index: number,
  fallback: string,
): string {
  return nodo.colorAccent ?? TIMELINE_SEGMENT_PALETTE[index % TIMELINE_SEGMENT_PALETTE.length] ?? fallback;
}

export function timelineNodoTitulo(nodo: {
  tituloNodo?: string;
  etiqueta?: string;
}): string {
  return (nodo.tituloNodo?.trim() || nodo.etiqueta || '').trim();
}
