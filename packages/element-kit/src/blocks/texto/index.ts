export type { TextBlock } from '@lumina/types/slide';
export {
  createDefaultTextBlock,
  createTextBlock,
  TEXT_INSERT_PRESETS,
  type TextInsertPreset,
  type CreateTextBlockOptions,
} from './texto-defaults.js';
export {
  RenderText,
  InlineTextEditor,
  textBlockHeadingFallbackStyle,
  type RenderTextProps,
} from './render-texto.js';
export { getRichDoc, isRichTextEnabled } from './rich-text.js';
export {
  TextoProperties,
  type TextoPropertiesProps,
} from './texto-properties.js';
