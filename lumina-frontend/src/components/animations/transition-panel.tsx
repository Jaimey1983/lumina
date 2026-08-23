'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { TransicionSlide } from '@/types/animation.types';
import { TRANSICION_PRESETS, createDefaultTransicion } from '@/lib/animation-defaults';

interface TransitionPanelProps {
  transicion: TransicionSlide | null;
  onUpdate: (t: TransicionSlide) => void;
}

export function TransitionPanel({ transicion, onUpdate }: TransitionPanelProps) {
  const t = transicion ?? createDefaultTransicion();

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Transición del slide
      </span>
      <div className="space-y-0.5">
        <Label className="text-[10px] text-muted-foreground">Tipo</Label>
        <Select
          value={t.tipo}
          onValueChange={(v) =>
            onUpdate({ ...t, tipo: v as TransicionSlide['tipo'] })
          }
        >
          <SelectTrigger size="sm" className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSICION_PRESETS.map((p) => (
              <SelectItem key={p.tipo} value={p.tipo} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {t.tipo !== 'none' && (
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">Duración (ms)</Label>
          <Input
            type="number"
            min={100}
            max={2000}
            step={50}
            value={t.duracion}
            onChange={(e) =>
              onUpdate({
                ...t,
                duracion: Math.max(100, Math.min(2000, Number(e.target.value) || 500)),
              })
            }
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}
