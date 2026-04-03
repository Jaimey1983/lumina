/** Tipos de slide alineados con el API de clases. */
export const SLIDE_TYPES = ['COVER', 'CONTENT', 'ACTIVITY', 'VIDEO', 'IMAGE'] as const;

export const SLIDE_LABELS: Record<string, string> = {
  COVER: 'Portada',
  CONTENT: 'Contenido',
  ACTIVITY: 'Actividad',
  VIDEO: 'Video',
  IMAGE: 'Imagen',
};
