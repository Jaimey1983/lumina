'use client';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from 'lucide-react';

import type { Block, CarouselWidget } from '@/types/slide.types';
import type { WidgetLayoutId } from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { TabsLayoutGallery } from '@/components/widgets/tabs/tabs-layout-gallery';

import {
  DEFAULT_CAROUSEL_CONFIG,
  normalizeCarouselWidget,
  type CarouselAlineacion,
  type CarouselTransicion,
} from './carousel-config';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export interface CarouselAppearancePropertiesProps {
  block: CarouselWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function CarouselAppearanceProperties({
  block: rawBlock,
  applyNow,
}: CarouselAppearancePropertiesProps) {
  const block = normalizeCarouselWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_CAROUSEL_CONFIG,
    ...block.configuracion,
    defaultsSlide: {
      ...DEFAULT_CAROUSEL_CONFIG.defaultsSlide,
      ...block.configuracion.defaultsSlide,
    },
  };

  const update = (fn: (w: CarouselWidget) => CarouselWidget) => {
    void applyNow((b) => (b.tipo === 'carousel' ? fn(normalizeCarouselWidget(b)) : b));
  };

  const patchConfig = (patch: Partial<typeof configuracion>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  const setGlobalLayout = (layoutId: WidgetLayoutId) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, layoutId },
      slides: w.slides.map((s) => ({ ...s, layoutId })),
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <SectionTitle>Layout del widget</SectionTitle>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Aplica el layout a todas las páginas. Puedes personalizar cada página en la sección Página.
        </p>
        <TabsLayoutGallery
          activeId={configuracion.layoutId}
          onSelect={(id: WidgetLayoutId) => setGlobalLayout(id)}
        />
      </div>

      <div className="space-y-3">
        <SectionTitle>Transición</SectionTitle>
        <div className="flex gap-1">
          {(['slide', 'fade'] as const).map((mode) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={configuracion.transicion === mode ? 'secondary' : 'outline'}
              className="flex-1 text-xs capitalize"
              onClick={() => patchConfig({ transicion: mode as CarouselTransicion })}
            >
              {mode === 'slide' ? 'Deslizar' : 'Fundido'}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Contenedor</SectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">Color de fondo</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={configuracion.colorFondoContenedor}
            onChange={(e) => patchConfig({ colorFondoContenedor: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Opacidad fondo</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {configuracion.opacidadFondoContenedor}%
            </span>
          </div>
          <Slider
            value={[configuracion.opacidadFondoContenedor]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => patchConfig({ opacidadFondoContenedor: v })}
          >
            <SliderThumb />
          </Slider>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Padding</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {configuracion.paddingContenedor}px
            </span>
          </div>
          <Slider
            value={[configuracion.paddingContenedor]}
            min={0}
            max={48}
            step={2}
            onValueChange={([v]) => patchConfig({ paddingContenedor: v })}
          >
            <SliderThumb />
          </Slider>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Instrucción</SectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">Alineación</Label>
          <div className="flex gap-0.5">
            {(
              [
                ['izquierda', AlignLeft],
                ['centro', AlignCenter],
                ['derecha', AlignRight],
              ] as const
            ).map(([align, Icon]) => (
              <Toggle
                key={align}
                size="sm"
                pressed={configuracion.alineacionInstruccion === align}
                aria-label={align}
                onPressedChange={() =>
                  patchConfig({ alineacionInstruccion: align as CarouselAlineacion })
                }
              >
                <Icon className="size-3.5" />
              </Toggle>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Colores</SectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">Indicador activo</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={configuracion.colorIndicadorActivo}
            onChange={(e) => patchConfig({ colorIndicadorActivo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Indicador inactivo</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={configuracion.colorIndicadorInactivo}
            onChange={(e) => patchConfig({ colorIndicadorInactivo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Borde contenido</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={configuracion.colorBordeContenido}
            onChange={(e) => patchConfig({ colorBordeContenido: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Botones navegación</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={configuracion.colorNavBoton}
            onChange={(e) => patchConfig({ colorNavBoton: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
