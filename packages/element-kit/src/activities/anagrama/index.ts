/**
 * API pública de Anagrama para consumidores del workspace
 * (`@lumina/element-kit` en E2.3). Sin cambiar comportamiento.
 */
export type { AnagramaActivity } from '@lumina/types/slide';
export { createDefaultAnagrama } from './anagrama-defaults.js';
export { AnagramaEditor } from './anagrama-editor.js';
export { AnagramaViewer } from './anagrama-viewer.js';
export { AnagramaProperties } from './anagrama-properties.js';
export {
  ANAGRAMA_MAX_PALABRAS,
  ANAGRAMA_MIN_PALABRAS,
  mezclarLetras,
} from './anagrama-config.js';
