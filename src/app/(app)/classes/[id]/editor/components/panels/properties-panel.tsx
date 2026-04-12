'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  Block,
  FormaBlock,
  ImageBlock,
  TextAlign,
  TextBlock,
  VideoBlock,
} from '@/types/slide.types';
import { getBlockAtPath, updateBlockAtPath } from '@/lib/class-slide-normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  'Inter',
  'Georgia',
  'Courier New',
  'Arial',
  'Playfair Display',
] as const;

const DEBOUNCE_MS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePx(s?: string): number {
  if (!s) return 24;
  const m = String(s).match(/(\d+)/);
  return m ? Math.min(120, Math.max(12, parseInt(m[1]!, 10))) : 24;
}

function parseBorderPx(s?: string): number {
  const m = s?.match(/(\d+)/);
  return m ? Math.min(50, Math.max(0, parseInt(m[1]!, 10))) : 0;
}

function toHexColor(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return fallback;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read'));
    reader.readAsDataURL(file);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PropertiesPanelProps {
  bloques: Block[];
  selectedBlockId: string | null;
  onApplyBloques: (next: Block[]) => Promise<boolean>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertiesPanel({
  bloques,
  selectedBlockId,
  onApplyBloques,
}: PropertiesPanelProps) {
  const bloquesRef = useRef(bloques);
  bloquesRef.current = bloques;

  const pathRef = useRef(selectedBlockId);
  pathRef.current = selectedBlockId;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  useEffect(() => {
    clearDebounce();
  }, [selectedBlockId, clearDebounce]);

  const applyNow = useCallback(
    async (fn: (b: Block) => Block) => {
      const path = pathRef.current;
      if (!path) return;
      clearDebounce();
      const cur = bloquesRef.current;
      const next = updateBlockAtPath(cur, path, fn);
      const ok = await onApplyBloques(next);
      if (!ok) toast.error('No se pudo guardar');
    },
    [onApplyBloques, clearDebounce],
  );

  const scheduleApply = useCallback(
    (fn: (b: Block) => Block) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const path = pathRef.current;
        if (!path) return;
        const cur = bloquesRef.current;
        const next = updateBlockAtPath(cur, path, fn);
        void (async () => {
          const ok = await onApplyBloques(next);
          if (!ok) toast.error('No se pudo guardar');
        })();
      }, DEBOUNCE_MS);
    },
    [onApplyBloques],
  );

  const block =
    selectedBlockId && bloques.length > 0
      ? getBlockAtPath(bloques, selectedBlockId)
      : null;

  if (!selectedBlockId || !block) {
    return (
      <aside
        className={cn(
          'flex h-full w-64 shrink-0 flex-col border-l border-border bg-background',
          'motion-safe:transition-opacity motion-safe:duration-200',
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">Selecciona un elemento</p>
        </div>
      </aside>
    );
  }

  if (block.tipo === 'actividad') {
    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">
            Las actividades se configuran en el panel lateral derecho.
          </p>
        </div>
      </aside>
    );
  }

  if (
    block.tipo !== 'texto' &&
    block.tipo !== 'imagen' &&
    block.tipo !== 'forma' &&
    block.tipo !== 'video'
  ) {
    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">
            Este tipo de bloque no tiene propiedades aquí.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Propiedades
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {block.tipo === 'texto' && (
          <TextBlockFields
            block={block}
            applyNow={applyNow}
            scheduleApply={scheduleApply}
            clearDebounce={clearDebounce}
          />
        )}
        {block.tipo === 'imagen' && (
          <ImageBlockFields
            block={block}
            applyNow={applyNow}
            scheduleApply={scheduleApply}
          />
        )}
        {block.tipo === 'forma' && (
          <FormaBlockFields
            block={block}
            applyNow={applyNow}
            scheduleApply={scheduleApply}
          />
        )}
        {block.tipo === 'video' && (
          <VideoBlockFields
            block={block}
            applyNow={applyNow}
            scheduleApply={scheduleApply}
            clearDebounce={clearDebounce}
          />
        )}
      </div>
    </aside>
  );
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function TextBlockFields({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
}: {
  block: TextBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
  clearDebounce: () => void;
}) {
  const [sizeDraft, setSizeDraft] = useState(() => parsePx(block.tamanoFuente));

  useEffect(() => {
    setSizeDraft(parsePx(block.tamanoFuente));
  }, [block.tamanoFuente]);

  const setAlign = (alineacion: TextAlign) => {
    void applyNow((b) =>
      b.tipo === 'texto' ? { ...b, alineacion } : b,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs">Fuente</Label>
        <Select
          value={block.fuente ?? 'Inter'}
          onValueChange={(fuente) => {
            void applyNow((b) => (b.tipo === 'texto' ? { ...b, fuente } : b));
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-text-size">
          Tamaño (px)
        </Label>
        <Input
          id="prop-text-size"
          type="number"
          min={12}
          max={120}
          value={sizeDraft}
          onChange={(e) => {
            const v = Math.min(120, Math.max(12, Number(e.target.value) || 12));
            setSizeDraft(v);
            scheduleApply((b) =>
              b.tipo === 'texto' ? { ...b, tamanoFuente: `${v}px` } : b,
            );
          }}
          onBlur={() => {
            clearDebounce();
            void applyNow((b) =>
              b.tipo === 'texto'
                ? { ...b, tamanoFuente: `${sizeDraft}px` }
                : b,
            );
          }}
          className="h-8"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-text-color">
          Color
        </Label>
        <Input
          id="prop-text-color"
          type="color"
          value={toHexColor(block.color, '#000000')}
          onChange={(e) => {
            void applyNow((b) =>
              b.tipo === 'texto' ? { ...b, color: e.target.value } : b,
            );
          }}
          className="h-8 w-full cursor-pointer p-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Toggle
          size="sm"
          variant="outline"
          pressed={!!block.negrita}
          onPressedChange={(p) => {
            void applyNow((b) =>
              b.tipo === 'texto' ? { ...b, negrita: p } : b,
            );
          }}
          aria-label="Negrita"
        >
          <Bold className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          variant="outline"
          pressed={!!block.cursiva}
          onPressedChange={(p) => {
            void applyNow((b) =>
              b.tipo === 'texto' ? { ...b, cursiva: p } : b,
            );
          }}
          aria-label="Cursiva"
        >
          <Italic className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          variant="outline"
          pressed={!!block.subrayado}
          onPressedChange={(p) => {
            void applyNow((b) =>
              b.tipo === 'texto' ? { ...b, subrayado: p } : b,
            );
          }}
          aria-label="Subrayado"
        >
          <Underline className="size-3.5" />
        </Toggle>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Alineación</Label>
        <div className="flex gap-1">
          {(
            [
              ['izquierda', AlignLeft],
              ['centro', AlignCenter],
              ['derecha', AlignRight],
              ['justificado', AlignJustify],
            ] as const
          ).map(([key, Icon]) => (
            <Button
              key={key}
              type="button"
              size="icon"
              variant={block.alineacion === key ? 'secondary' : 'outline'}
              className="size-8"
              title={key}
              onClick={() => setAlign(key)}
            >
              <Icon className="size-3.5" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageBlockFields({
  block,
  applyNow,
  scheduleApply,
}: {
  block: ImageBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
}) {
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
      await applyNow((b) => (b.tipo === 'imagen' ? { ...b, url } : b));
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
            void applyNow((b) =>
              b.tipo === 'imagen' ? { ...b, ajuste } : b,
            );
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
          <p className="text-[11px] text-muted-foreground">Mantiene relación ancho/alto al redimensionar esquinas</p>
        </div>
        <Switch
          checked={!!block.lockAspectRatio}
          onCheckedChange={(checked) => {
            void applyNow((b) =>
              b.tipo === 'imagen' ? { ...b, lockAspectRatio: checked } : b,
            );
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
            scheduleApply((b) =>
              b.tipo === 'imagen'
                ? { ...b, bordeRedondeado: `${n}px` }
                : b,
            );
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

function FormaBlockFields({
  block,
  applyNow,
  scheduleApply,
}: {
  block: FormaBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
}) {
  const [opLocal, setOpLocal] = useState(() => block.opacidad ?? 100);

  useEffect(() => {
    setOpLocal(block.opacidad ?? 100);
  }, [block.opacidad]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-forma-color">
          Color de relleno
        </Label>
        <Input
          id="prop-forma-color"
          type="color"
          value={toHexColor(block.color, '#6366f1')}
          onChange={(e) => {
            void applyNow((b) =>
              b.tipo === 'forma' ? { ...b, color: e.target.value } : b,
            );
          }}
          className="h-8 w-full cursor-pointer p-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Tipo de forma</Label>
        <Select
          value={block.forma}
          onValueChange={(v) => {
            const forma = v as FormaBlock['forma'];
            void applyNow((b) =>
              b.tipo === 'forma' ? { ...b, forma } : b,
            );
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rectangulo">Rectángulo</SelectItem>
            <SelectItem value="circulo">Círculo</SelectItem>
            <SelectItem value="triangulo">Triángulo</SelectItem>
            <SelectItem value="linea">Línea</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs">Opacidad</Label>
          <span className="text-xs tabular-nums text-muted-foreground">{opLocal}%</span>
        </div>
        <Slider
          value={[opLocal]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => {
            const n = Math.round(v!);
            setOpLocal(n);
            scheduleApply((b) =>
              b.tipo === 'forma' ? { ...b, opacidad: n } : b,
            );
          }}
        >
          <SliderThumb />
        </Slider>
      </div>
    </div>
  );
}

function VideoBlockFields({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
}: {
  block: VideoBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
  clearDebounce: () => void;
}) {
  const [urlDraft, setUrlDraft] = useState(block.url);

  useEffect(() => {
    setUrlDraft(block.url);
  }, [block.url]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-video-url">
          URL
        </Label>
        <Input
          id="prop-video-url"
          type="url"
          value={urlDraft}
          onChange={(e) => {
            const v = e.target.value;
            setUrlDraft(v);
            scheduleApply((b) =>
              b.tipo === 'video' ? { ...b, url: v } : b,
            );
          }}
          onBlur={() => {
            clearDebounce();
            void applyNow((b) =>
              b.tipo === 'video' ? { ...b, url: urlDraft } : b,
            );
          }}
          className="h-8 text-xs"
          placeholder="https://…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Autoplay</Label>
          <Toggle
            size="sm"
            variant="outline"
            pressed={!!block.autoplay}
            onPressedChange={(p) => {
              void applyNow((b) =>
                b.tipo === 'video' ? { ...b, autoplay: p } : b,
              );
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Controles</Label>
          <Toggle
            size="sm"
            variant="outline"
            pressed={block.controles !== false}
            onPressedChange={(p) => {
              void applyNow((b) =>
                b.tipo === 'video' ? { ...b, controles: p } : b,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
