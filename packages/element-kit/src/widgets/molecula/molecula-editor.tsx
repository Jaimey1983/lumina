'use client';

import type { MoleculaWidget } from '@lumina/types/widget';

import { MoleculaViewer } from './molecula-viewer.js';

export function MoleculaEditor({
  block,
}: {
  block: MoleculaWidget;
  onChange?: (block: MoleculaWidget) => void;
}) {
  return (
    <MoleculaViewer
      widget={block}
      isThumbnail={false}
    />
  );
}
