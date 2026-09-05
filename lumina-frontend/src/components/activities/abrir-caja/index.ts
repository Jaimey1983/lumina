/**
 * API pública de AbrirCaja para consumidores del workspace
 * (`@lumina/element-kit` en E2.4). Sin cambiar comportamiento.
 */
export type { AbrirCajaActivity } from '@/types/slide.types';
export { createDefaultAbrirCaja } from '@/lib/abrir-caja-defaults';
export { AbrirCajaEditor } from './abrir-caja-editor';
export { AbrirCajaViewer } from './abrir-caja-viewer';
export { AbrirCajaProperties } from './abrir-caja-properties';
