'use client';

import type { TextBlock, Block, HeadingLevel } from '@/types/slide.types';
import { TypographyInspector } from '@/components/editor/typography-inspector';
import {
  TEXT_BLOCK_FONT_SIZE_MIN,
  TEXT_BLOCK_FONT_SIZE_MAX,
  typographyFromTextBlock,
  textBlockPatchFromTypography,
  isTypographySizeOnlyPatch,
  type TypographyValue,
} from '@/lib/typography';

export interface TextoPropertiesProps {
  block: TextBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: TextBlock) => void;
}

export function TextoProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
}: TextoPropertiesProps) {
  const handleHeadingLevelChange = (nivel?: HeadingLevel) => {
    if (applyNow) {
      void applyNow((b) => {
        if (b.tipo !== 'texto') return b;
        if (nivel === undefined) {
          const rest = { ...b };
          delete rest.nivel;
          return rest;
        }
        return { ...b, nivel };
      });
    } else if (onChange) {
      if (nivel === undefined) {
        const rest = { ...block };
        delete rest.nivel;
        onChange(rest);
      } else {
        onChange({ ...block, nivel });
      }
    }
  };

  const handleTypographyChange = (patch: Partial<TypographyValue>) => {
    const mapped = textBlockPatchFromTypography(patch);
    const apply = (b: Block): Block =>
      b.tipo === 'texto' ? { ...b, ...mapped } : b;

    if (isTypographySizeOnlyPatch(patch) && scheduleApply) {
      scheduleApply(apply);
      return;
    }
    clearDebounce?.();
    if (applyNow) {
      void applyNow(apply);
    } else if (onChange) {
      onChange({ ...block, ...mapped });
    }
  };

  return (
    <TypographyInspector
      value={typographyFromTextBlock(block)}
      sizeMin={TEXT_BLOCK_FONT_SIZE_MIN}
      sizeMax={TEXT_BLOCK_FONT_SIZE_MAX}
      defaultSize={24}
      defaultColor="#000000"
      headingLevel={block.nivel}
      enableList
      onHeadingLevelChange={handleHeadingLevelChange}
      onChange={handleTypographyChange}
    />
  );
}
