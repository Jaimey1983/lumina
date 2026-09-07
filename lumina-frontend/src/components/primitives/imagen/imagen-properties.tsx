'use client';

import { useRef, useState, useEffect } from 'react';
import type { ImageBlock, Block } from '@/types/slide.types';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider, SliderThumb } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function parseBorderPx(s?: string): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : Math.min(50, Math.max(0, n));
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export interface ImagePropertiesProps {
  block: ImageBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  onChange?: (updated: ImageBlock) => void;
}

export function ImageProperties({
  block,
  applyNow,
  scheduleApply,
  onChange,
}: ImagePropertiesProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const radius = parseBorderPx(block.bordeRedondeado);
  const [radiusLocal, setRadiusLocal] = useState(radius);

  useEffect(() => {
    setRadiusLocal(parseBorderPx(block.bordeRedondeado));
  }, [block.bordeRedondeado]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file?.type.startsWith('image/')) {
      toast.error('Selecciona una imagen');
      return;
    }
    try {
      const url = await readFileAsDataURL(file);
      if (applyNow) {
        await applyNow((b) => (b.tipo === 'imagen' ? { ...b, url } : b));
      } else if (onChange) {
        onChange({ ...block, url });
      }
    } catch {
      toast.error('No se pudo leer la imagen');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      <div className="space-y-2">
        <Label className="text-xs">Ajuste</Label>
        <Select
          value={block.ajuste ?? 'contener'}
          onValueChange={(v) => {
            const ajuste = v as ImageBlock['ajuste'];
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'imagen' ? { ...b, ajuste } : b,
              );
            } else if (onChange) {
              onChange({ ...block, ajuste });
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cubrir">Cubrir</SelectItem>
            <SelectItem value="contener">Contener</SelectItem>
            <SelectItem value="llenar">Llenar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <div className="space-y-0.5">
          <Label className="text-xs">Bloquear proporción</Label>
          <p className="text-[11px] text-muted-foreground">
            Mantiene relación ancho/alto al redimensionar esquinas
          </p>
        </div>
        <Switch
          checked={!!block.lockAspectRatio}
          onCheckedChange={(checked) => {
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'imagen' ? { ...b, lockAspectRatio: checked } : b,
              );
            } else if (onChange) {
              onChange({ ...block, lockAspectRatio: checked });
            }
          }}
          aria-label="Bloquear proporción de imagen"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs">Borde redondeado</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {radiusLocal}px
          </span>
        </div>
        <Slider
          value={[radiusLocal]}
          min={0}
          max={50}
          step={1}
          onValueChange={([v]) => {
            const n = Math.round(v!);
            setRadiusLocal(n);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'imagen' ? { ...b, bordeRedondeado: `${n}px` } : b,
              );
            } else if (onChange) {
              onChange({ ...block, bordeRedondeado: `${n}px` });
            }
          }}
        >
          <SliderThumb />
        </Slider>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => fileRef.current?.click()}
      >
        Reemplazar imagen
      </Button>
    </div>
  );
}
