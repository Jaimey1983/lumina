/** Estilos compartidos para badges de estado de clase (lista y detalle). */
export const STATUS_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  PUBLISHED: { bg: '#dbeafe', color: '#2563EB' },
  DRAFT: { bg: '#f3f4f6', color: '#9ca3af' },
  LIVE: { bg: '#ede9fe', color: '#7c3aed' },
  ARCHIVED: { bg: '#fef3c7', color: '#d97706' },
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  LIVE: 'En vivo',
  ARCHIVED: 'Archivada',
};
