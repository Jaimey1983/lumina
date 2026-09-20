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
      className="flex h-full min-h-0 w-full flex-col items-center justify-between gap-3 select-none p-2"
      onPointerDown={onEnsureBlockSelected}
    >
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
        <RuletaWheel items={widget.items} colores={widget.configuracion.colores} />
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="relative z-20 mx-auto shrink-0 px-8 py-2.5 text-sm font-bold text-white shadow-md opacity-90 pointer-events-none"
        style={{
          backgroundColor: 'var(--lw-color-primary, #2563EB)',
          borderRadius: 'var(--lw-radius-lg, 0.75rem)',
        }}
      >
        Girar
      </button>
    </div>
  );
}
