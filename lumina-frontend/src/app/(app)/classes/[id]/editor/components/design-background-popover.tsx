'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageIcon, Paintbrush, Sparkles } from 'lucide-react';

import type { Background, GradientColorStop } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  GRADIENT_BACKGROUND_PRESETS,
  SOLID_BACKGROUND_PRESETS,
  backgroundToCssStyle,
  buildLinearGradientCss,
  createGradientBackground,
  defaultGradientDraftFromFondo,
  defaultImageUrlFromFondo,
  defaultSolidFromFondo,
  gradientDirectionLabel,
} from '@/lib/slide-background';
import { GradientStopBarEditor } from './gradient-stop-bar-editor';

export interface DesignBackgroundPopoverProps {
  fondo?: Background;
  disabled?: boolean;
  onApply: (fondo: Background) => void | Promise<void>;
}

function draftTabFromFondo(f?: Background): 'solid' | 'gradient' | 'image' {
  if (f?.tipo === 'gradiente') return 'gradient';
  if (f?.tipo === 'imagen') return 'image';
  return 'solid';
}

function ColorSwatch({
  color,
  selected,
  onClick,
  title,
}: {
  color: string;
  selected?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title ?? color}
      aria-label={title ?? color}
      onClick={onClick}
      className={cn(
        'size-7 shrink-0 rounded-md border border-border shadow-xs transition-transform hover:scale-105',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        selected && 'ring-2 ring-primary ring-offset-1',
      )}
      style={{ backgroundColor: color }}
    />
  );
}

export function DesignBackgroundPopover({
  fondo,
  disabled,
  onApply,
}: DesignBackgroundPopoverProps) {
  const [tab, setTab] = useState<'solid' | 'gradient' | 'image'>(() => draftTabFromFondo(fondo));
  const [solidColor, setSolidColor] = useState(() => defaultSolidFromFondo(fondo));
  const [gradStops, setGradStops] = useState<GradientColorStop[]>(
    () => defaultGradientDraftFromFondo(fondo).stops,
  );
  const [gradAngle, setGradAngle] = useState(
    () => defaultGradientDraftFromFondo(fondo).direccion,
  );
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);
  const [imgUrl, setImgUrl] = useState(() => defaultImageUrlFromFondo(fondo));

  useEffect(() => {
    setTab(draftTabFromFondo(fondo));
    setSolidColor(defaultSolidFromFondo(fondo));
    const grad = defaultGradientDraftFromFondo(fondo);
    setGradStops(grad.stops);
    setGradAngle(grad.direccion);
    setSelectedStopIndex(0);
    setImgUrl(defaultImageUrlFromFondo(fondo));
  }, [fondo]);

  const previewFondo = useMemo((): Background => {
    if (tab === 'solid') return { tipo: 'color', valor: solidColor };
    if (tab === 'gradient') return createGradientBackground(gradStops, gradAngle);
    return {
      tipo: 'imagen',
      url: imgUrl.trim() || 'about:blank',
      ajuste: 'cubrir',
    };
  }, [tab, solidColor, gradStops, gradAngle, imgUrl]);

  const previewStyle = useMemo(() => {
    if (tab === 'image' && !imgUrl.trim()) {
      return {
        backgroundColor: '#f1f5f9',
        backgroundImage:
          'linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0), linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0)',
        backgroundSize: '12px 12px',
        backgroundPosition: '0 0, 6px 6px',
      };
    }
    return backgroundToCssStyle(previewFondo);
  }, [tab, imgUrl, previewFondo]);

  const applySolid = useCallback(() => {
    void onApply({ tipo: 'color', valor: solidColor });
  }, [onApply, solidColor]);

  const applyGradient = useCallback(() => {
    void onApply(createGradientBackground(gradStops, gradAngle));
  }, [onApply, gradStops, gradAngle]);

  const applyImage = useCallback(() => {
    const url = imgUrl.trim();
    if (!url) return;
    void onApply({ tipo: 'imagen', url, ajuste: 'cubrir' });
  }, [onApply, imgUrl]);

  const handleStopsChange = useCallback((next: GradientColorStop[]) => {
    setGradStops(next);
    setSelectedStopIndex((prev) => Math.min(prev, Math.max(0, next.length - 1)));
  }, []);

  const applyPreset = useCallback((stops: GradientColorStop[], direccion: number) => {
    setGradStops(stops.map((s) => ({ ...s })));
    setGradAngle(direccion);
    setSelectedStopIndex(0);
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Vista previa
        </p>
        <div
          className="aspect-video w-full overflow-hidden rounded-lg border border-border shadow-sm"
          style={previewStyle}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList variant="default" size="sm" className="grid w-full grid-cols-3">
          <TabsTrigger value="solid" className="gap-1.5">
            <Paintbrush className="size-3.5" />
            Sólido
          </TabsTrigger>
          <TabsTrigger value="gradient" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Gradiente
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5">
            <ImageIcon className="size-3.5" />
            Imagen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solid" className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Presets</Label>
            <div className="flex flex-wrap gap-1.5">
              {SOLID_BACKGROUND_PRESETS.map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={solidColor.toLowerCase() === c.toLowerCase()}
                  onClick={() => setSolidColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border shadow-xs">
              <span
                className="absolute inset-0"
                style={{ backgroundColor: solidColor }}
                aria-hidden
              />
              <input
                type="color"
                value={solidColor.startsWith('#') ? solidColor : '#ffffff'}
                onChange={(e) => setSolidColor(e.target.value)}
                disabled={disabled}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                aria-label="Selector de color"
              />
            </label>
            <Input
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              disabled={disabled}
              className="h-9 font-mono text-xs uppercase"
              placeholder="#ffffff"
              spellCheck={false}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={disabled}
            onClick={applySolid}
          >
            Aplicar color
          </Button>
        </TabsContent>

        <TabsContent value="gradient" className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Presets</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {GRADIENT_BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => applyPreset(preset.stops, preset.direccion)}
                  className={cn(
                    'overflow-hidden rounded-md border border-border text-left transition hover:border-primary/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <div
                    className="h-8 w-full"
                    style={{
                      background: buildLinearGradientCss(preset.stops, preset.direccion),
                    }}
                  />
                  <span className="block px-1.5 py-1 text-[10px] font-medium text-foreground">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <GradientStopBarEditor
            stops={gradStops}
            disabled={disabled}
            selectedIndex={selectedStopIndex}
            onSelectedIndexChange={setSelectedStopIndex}
            onChange={handleStopsChange}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground">Dirección</Label>
              <span className="text-xs font-medium tabular-nums text-foreground">
                {gradientDirectionLabel(gradAngle)}
              </span>
            </div>
            <Slider
              value={[gradAngle]}
              min={0}
              max={359}
              step={1}
              disabled={disabled}
              onValueChange={([v]) => setGradAngle(v ?? gradAngle)}
            >
              <SliderThumb />
            </Slider>
            <div className="flex flex-wrap gap-1">
              {[0, 90, 135, 180, 270].map((deg) => (
                <Button
                  key={deg}
                  type="button"
                  variant={gradAngle === deg ? 'primary' : 'outline'}
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  disabled={disabled}
                  onClick={() => setGradAngle(deg)}
                >
                  {deg}°
                </Button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={disabled || gradStops.length < 2}
            onClick={applyGradient}
          >
            Aplicar gradiente
          </Button>
        </TabsContent>

        <TabsContent value="image" className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="design-bg-url" className="text-xs text-muted-foreground">
              URL de imagen
            </Label>
            <Input
              id="design-bg-url"
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
              disabled={disabled}
              placeholder="https://…"
              className="text-xs"
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              La imagen cubrirá el lienzo (1280×720). Usa URLs públicas HTTPS.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={disabled || !imgUrl.trim()}
            onClick={applyImage}
          >
            Aplicar imagen
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
