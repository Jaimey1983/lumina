'use client';

import { useState, useEffect } from 'react';
import type { DividerBlock, Block } from '@/types/slide.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider, SliderThumb } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function toHexColor(color?: string, fallback = '#64748b'): string {
  if (!color) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return fallback;
}

export interface SeparadorPropertiesProps {
  block: DividerBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  onChange?: (updated: DividerBlock) => void;
}

export function SeparadorProperties({
  block,
  applyNow,
  scheduleApply,
  onChange,
}: SeparadorPropertiesProps) {
  const [grosorLocal, setGrosorLocal] = useState(() => block.grosor ?? 2);

  useEffect(() => {
    setGrosorLocal(block.grosor ?? 2);
  }, [block.grosor]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-separador-color">
          Color
        </Label>
        <Input
          id="prop-separador-color"
          type="color"
          value={toHexColor(block.color, '#64748b')}
          onChange={(e) => {
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'separador' ? { ...b, color: e.target.value } : b,
              );
            } else if (onChange) {
              onChange({ ...block, color: e.target.value });
            }
          }}
          className="h-8 w-full cursor-pointer p-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Estilo</Label>
        <Select
          value={block.estilo ?? 'solido'}
          onValueChange={(v) => {
            const estilo = v as NonNullable<DividerBlock['estilo']>;
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'separador' ? { ...b, estilo } : b,
              );
            } else if (onChange) {
              onChange({ ...block, estilo });
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solido">Sólido</SelectItem>
            <SelectItem value="punteado">Punteado</SelectItem>
            <SelectItem value="guionado">Guionado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs">Grosor</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {grosorLocal}px
          </span>
        </div>
        <Slider
          value={[grosorLocal]}
          min={1}
          max={16}
          step={1}
          onValueChange={([v]) => {
            const n = Math.round(v!);
            setGrosorLocal(n);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'separador' ? { ...b, grosor: n } : b,
              );
            } else if (onChange) {
              onChange({ ...block, grosor: n });
            }
          }}
        >
          <SliderThumb />
        </Slider>
      </div>
    </div>
  );
}
