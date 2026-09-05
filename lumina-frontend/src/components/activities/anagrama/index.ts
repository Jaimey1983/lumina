/**
 * API pública de Anagrama para consumidores del workspace
 * (`@lumina/element-kit` en E2.3). Sin cambiar comportamiento.
 */
export type { AnagramaActivity } from '@/types/slide.types';
export { createDefaultAnagrama } from '@/lib/anagrama-defaults';
export { AnagramaEditor } from './anagrama-editor';
export { AnagramaViewer } from './anagrama-viewer';
export { AnagramaProperties } from './anagrama-properties';
export {
  ANAGRAMA_MAX_PALABRAS,
  ANAGRAMA_MIN_PALABRAS,
  mezclarLetras,
} from './anagrama-config';
