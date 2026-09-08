'use client';

import type { RuletaWidget } from '@lumina/types/widget';

import { normalizeRuletaBlock } from './ruleta-defaults.js';
import { RuletaWheel } from './ruleta-wheel.js';

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
