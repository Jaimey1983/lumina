'use client';

import React from 'react';
import type { GraficoDatosBlock } from '@lumina/types/slide';
import { GraficoViewer } from './grafico-viewer.js';
import { cn } from '@lumina/ui/lib/utils';

interface GraficoEditorProps {
  block: GraficoDatosBlock;
  isSelected?: boolean;
  onEnsureBlockSelected?: () => void;
  className?: string;
}

export function GraficoEditor({
  block,
  onEnsureBlockSelected,
  className,
}: GraficoEditorProps) {
  return (
    <div
      onClick={onEnsureBlockSelected}
      className={cn(
        'relative flex h-full w-full select-none flex-col pointer-events-auto',
        className,
      )}
    >
      <GraficoViewer block={block} />
    </div>
  );
}
