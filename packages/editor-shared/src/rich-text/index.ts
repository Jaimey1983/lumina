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
