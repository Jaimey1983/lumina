/** API pública del widget Tooltip para `@lumina/element-kit` (E3.2). */
export type { TooltipWidget } from '@/types/widget.types';
export {
  createDefaultTooltipBlock,
  normalizeTooltipWidget,
} from './tooltip-defaults';
export { TooltipEditor } from './tooltip-editor';
export { TooltipViewer } from './tooltip-viewer';
export { TooltipProperties, type TooltipPropertiesProps } from './tooltip-properties';
