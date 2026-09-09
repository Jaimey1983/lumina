export type {
  RichDoc,
  RichNode,
  RichNodeType,
  RichRun,
  RichMark,
  RichMarkType,
} from '@lumina/types/rich-text';
export { isRichDoc } from '@lumina/types/rich-text';

export { richMarkToStyle, richMarksToStyle, hexToRgba } from './marks.js';
export { isSafeHref, sanitizeRichMark, sanitizeRichDoc } from './sanitize.js';
export { plainToRich, richToPlain } from './plain.js';
export { richToHtml, escapeHtml, type RichToHtmlOptions } from './html.js';
export { looksLikeRichHtml, sanitizeWidgetHtml } from './widget-html.js';
export {
  RichTextAiProvider,
  useRichTextAi,
  type RichTextAiBridge,
  type RichTextAiAction,
} from './ai-context.js';
export { wordDiff, type DiffOp } from './word-diff.js';
export { richToPmDoc, pmDocToRich, type PmJSON } from './pm-serializers.js';
export {
  registerActiveRichEditor,
  getActiveRichEditor,
  subscribeActiveRichEditor,
  type ActiveRichEditor,
} from './active-editor.js';
export {
  applyTypographyToSelection,
  applyHeadingLevelToSelection,
  splitTypographyPatch,
  RANGE_TYPOGRAPHY_KEYS,
} from './apply-typography.js';

// El componente y el esquema (importan TipTap) NO se re-exportan aquí para no
// arrastrar `@tiptap/*` a consumidores puros como `class-slide-normalize`.
// Importar desde `@lumina/editor-shared/rich-text/rich-text-editor`.
