'use client';

import { cn } from '@/lib/utils';
import type { AnimacionTipo } from '@/types/animation.types';
import { ANIMACION_PRESETS } from '@/lib/animation-defaults';

const LABEL_TIPO: Record<string, string> = {
  'fade-in': 'Fundido ↓',
  'fade-out': 'Fundido ↑',
  'slide-left': '← Desliz.',
  'slide-right': 'Desliz. →',
  'slide-up': 'Desliz. ↑',
  'slide-down': 'Desliz. ↓',
  'zoom-in': 'Zoom ↓',
  'zoom-out': 'Zoom ↑',
  bounce: 'Rebote',
  spin: 'Girar',
  shake: 'Sacudir',
  pulse: 'Pulsar',
  'flip-x': 'Voltear X',
  'flip-y': 'Voltear Y',
  'wipe-left': 'Cort. ←',
  'wipe-right': 'Cort. →',
  'wipe-up': 'Cort. ↑',
  'wipe-down': 'Cort. ↓',
};

interface AnimationPickerProps {
  onSelect: (tipo: AnimacionTipo) => void;
  onClose: () => void;
}

export function AnimationPicker({ onSelect, onClose }: AnimationPickerProps) {
  return (
    <div className="rounded-md border border-border bg-background p-2 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Seleccionar animación</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      {ANIMACION_PRESETS.map((grupo) => (
        <div key={grupo.categoria} className="mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {grupo.categoria}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {grupo.tipos.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => onSelect(tipo)}
                className={cn(
                  'rounded px-1.5 py-1 text-[10px] text-center leading-tight',
                  'border border-border hover:border-primary hover:bg-primary/5',
                  'transition-colors duration-100',
                )}
              >
                {LABEL_TIPO[tipo] ?? tipo}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
