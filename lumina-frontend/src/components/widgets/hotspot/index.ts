/** API pública del widget Hotspot para `@lumina/element-kit` (E3.2). */
export type { HotspotWidget } from '@/types/widget.types';
export {
  DEFAULT_HOTSPOT_CONFIG,
  createDefaultHotspotBlock,
  createDefaultHotspotOverlay,
  normalizeHotspotWidget,
} from './hotspot-config';
export { HotspotEditor } from './hotspot-editor';
export { HotspotViewer } from './hotspot-viewer';
export { HotspotProperties } from './hotspot-properties';
