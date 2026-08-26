import type { ClipGroupBlock } from '@/types/slide.types';

import { RenderClipGroup } from '@/app/(app)/classes/[id]/editor/components/render-clip-group';
import { CLIP_VISUAL_BG, CLIP_VISUAL_SIZE } from './clip-group-fixture';

export function ClipVisualHost({ block }: { block: ClipGroupBlock }) {
  return (
    <div
      data-testid="clip-visual-host"
      style={{
        width: CLIP_VISUAL_SIZE.width,
        height: CLIP_VISUAL_SIZE.height,
        background: CLIP_VISUAL_BG,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <RenderClipGroup block={block} editorMode={false} />
      </div>
    </div>
  );
}
