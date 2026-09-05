/**
 * API pública de Crucigrama para consumidores del workspace
 * (`@lumina/element-kit` en E2.4). Sin cambiar comportamiento.
 */
export type { CrucigramaActivity } from '@/types/slide.types';
export { createDefaultCrucigrama } from '@/lib/crucigrama-defaults';
export { CrucigramaEditor } from './crucigrama-editor';
export { CrucigramaViewer } from './crucigrama-viewer';
export { CrucigramaProperties } from './crucigrama-properties';
