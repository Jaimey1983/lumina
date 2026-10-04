'use client';

import type { TablaPeriodicaWidget } from '@lumina/types/widget';

import { TablaPeriodicaViewer } from './tabla-periodica-viewer.js';

export function TablaPeriodicaEditor({
  block,
  onChange,
}: {
  block: TablaPeriodicaWidget;
  onChange: (next: TablaPeriodicaWidget) => void;
}) {
  return (
    <TablaPeriodicaViewer widget={block} onChange={onChange} isEditor emitir={undefined} />
  );
}
