'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Animacion, AnimacionTrigger, AnimacionMomento, AnimacionEasing } from '@/types/animation.types';
import { ANIMACION_PRESETS } from '@/lib/animation-defaults';

const LABEL_TIPO: Record<string, string> = {
  'fade-in': 'Fundido entrada',
  'fade-out': 'Fundido salida',
  'slide-left': 'Deslizar izq.',
  'slide-right': 'Deslizar der.',
  'slide-up': 'Deslizar arriba',
  'slide-down': 'Deslizar abajo',
  'zoom-in': 'Zoom entrada',
  'zoom-out': 'Zoom salida',
  bounce: 'Rebote',
  spin: 'Girar',
  shake: 'Sacudir',
  pulse: 'Pulsar',
  'flip-x': 'Voltear X',
  'flip-y': 'Voltear Y',
  'wipe-left': 'Cortina izq.',
  'wipe-right': 'Cortina der.',
  'wipe-up': 'Cortina arriba',
  'wipe-down': 'Cortina abajo',
};

interface AnimationItemProps {
  animacion: Animacion;
  onChange: (patch: Partial<Animacion>) => void;
  onDelete: () => void;
}

export function AnimationItem({ animacion, onChange, onDelete }: AnimationItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: animacion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-border bg-muted/30 p-2 flex flex-col gap-2"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
        >
          <GripVertical className="size-3.5" />
        </button>
        <Select
          value={animacion.tipo}
          onValueChange={(v) => onChange({ tipo: v as Animacion['tipo'] })}
        >
          <SelectTrigger size="sm" className="flex-1 h-7 text-xs">
            <SelectValue>{LABEL_TIPO[animacion.tipo] ?? animacion.tipo}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ANIMACION_PRESETS.map((grupo) => (
              <div key={grupo.categoria}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {grupo.categoria}
                </div>
                {grupo.tipos.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {LABEL_TIPO[t] ?? t}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Eliminar animación"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">Momento</Label>
          <Select
            value={animacion.momento}
            onValueChange={(v) => onChange({ momento: v as AnimacionMomento })}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada" className="text-xs">Entrada</SelectItem>
              <SelectItem value="salida" className="text-xs">Salida</SelectItem>
              <SelectItem value="enfasis" className="text-xs">Énfasis</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">Trigger</Label>
          <Select
            value={animacion.trigger}
            onValueChange={(v) => onChange({ trigger: v as AnimacionTrigger })}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
              <SelectItem value="click" className="text-xs">Clic</SelectItem>
              <SelectItem value="hover" className="text-xs">Hover</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">Duración (ms)</Label>
          <Input
            type="number"
            min={50}
            max={5000}
            step={50}
            value={animacion.duracion}
            onChange={(e) =>
              onChange({ duracion: Math.max(50, Math.min(5000, Number(e.target.value) || 400)) })
            }
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">Retraso (ms)</Label>
          <Input
            type="number"
            min={0}
            max={10000}
            step={50}
            value={animacion.delay}
            onChange={(e) =>
              onChange({ delay: Math.max(0, Math.min(10000, Number(e.target.value) || 0)) })
            }
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="space-y-0.5">
        <Label className="text-[10px] text-muted-foreground">Easing</Label>
        <Select
          value={animacion.easing}
          onValueChange={(v) => onChange({ easing: v as AnimacionEasing })}
        >
          <SelectTrigger size="sm" className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ease" className="text-xs">Ease</SelectItem>
            <SelectItem value="ease-in" className="text-xs">Ease In</SelectItem>
            <SelectItem value="ease-out" className="text-xs">Ease Out</SelectItem>
            <SelectItem value="ease-in-out" className="text-xs">Ease In-Out</SelectItem>
            <SelectItem value="linear" className="text-xs">Linear</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
