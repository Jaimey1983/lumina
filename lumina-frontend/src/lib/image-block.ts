import { BLOCK_FALLBACKS, type ImageBlock } from '@/types/slide.types';

/**
 * Bloque de imagen listo para el canvas (contrato 3.2).
 * Posición y tamaño siempre en % numéricos (`BLOCK_FALLBACKS.image`).
 */
export function makeImageBlockFromUrl(url: string, alt = 'Imagen'): ImageBlock {
  const fb = BLOCK_FALLBACKS.image;
  return {
    tipo: 'imagen',
    id: crypto.randomUUID(),
    url,
    alt,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
    ajuste: 'llenar',
  };
}
