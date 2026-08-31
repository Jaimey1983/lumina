'use client';

import type { RuletaWidget } from '@/types/widget.types';

import { normalizeRuletaBlock } from './ruleta-defaults';
import { RuletaWheel } from './ruleta-wheel';

interface RuletaEditorProps {
  block: RuletaWidget;
  onEnsureBlockSelected?: () => void;
}

export function RuletaEditor({ block, onEnsureBlockSelected }: RuletaEditorProps) {
  const widget = normalizeRuletaBlock(block);

  return (
    <div
      className="h-full w-full min-h-0 select-none p-2"
      onPointerDown={onEnsureBlockSelected}
    >
      <RuletaWheel items={widget.items} colores={widget.configuracion.colores} />
    </div>
  );
}
