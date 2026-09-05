/**
 * API pública de Topo para consumidores del workspace
 * (`@lumina/element-kit` en E2.4). Sin cambiar comportamiento.
 */
export type { TopoActivity } from '@/types/slide.types';
export { createDefaultTopo } from '@/lib/topo-defaults';
export { TopoEditor } from './topo-editor';
export { TopoViewer } from './topo-viewer';
export { TopoProperties } from './topo-properties';
