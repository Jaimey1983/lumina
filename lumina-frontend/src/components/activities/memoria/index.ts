/**
 * API pública de Memoria para consumidores del workspace
 * (`@lumina/element-kit` en E2.4). Sin cambiar comportamiento.
 */
export type { MemoriaActivity } from '@/types/slide.types';
export { createDefaultMemoria } from '@/lib/memoria-defaults';
export { MemoriaEditor } from './memoria-editor';
export { MemoriaViewer } from './memoria-viewer';
export { MemoriaProperties } from './memoria-properties';
