'use client';

import type { Block, CarouselWidget } from '@/types/slide.types';
import type { WidgetLayoutId, WidgetSlideCount } from '@/types/widget.types';
import { resizeCarouselSlides } from '@/lib/carousel-defaults';
import { WidgetLayoutGallery } from '@/components/widgets/shared/widget-layout-gallery';
import { resolveSlideLayoutId } from '@/components/widgets/shared/widget-layouts';
import { resolveSlideVisibilidad } from '@/components/widgets/shared/widget-slide-utils';
import { tabSelectionSlideId } from '@/components/widgets/tabs/tabs-slide-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';

import {
  DEFAULT_CAROUSEL_CONFIG,
  mergedCarouselConfig,
  normalizeCarouselWidget,
  type CarouselSlideVisibilidad,
} from './carousel-config';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export interface CarouselWidgetComponentesProps {
  block: CarouselWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function CarouselWidgetComponentes({
  block: rawBlock,
  applyNow,
}: CarouselWidgetComponentesProps) {
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

  const setGlobalToggle = (
    key:
      | 'mostrarTituloWidget'
      | 'mostrarSubtitulo'
      | 'mostrarInstruccion'
      | 'mostrarBotonAnterior'
      | 'mostrarBotonSiguiente'
      | 'mostrarDots'
      | 'mostrarFlechasInternas'
      | 'mostrarTabsPagina',
    value: boolean,
  ) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, [key]: value },
    }));
  };

  const setNumeroSlides = (count: WidgetSlideCount) => {
    update((w) => ({
      ...w,
      configuracion: {
        ...w.configuracion,
        numeroSlides: count,
        slideActivo: Math.min(w.configuracion.slideActivo ?? 0, count - 1),
      },
      slides: resizeCarouselSlides(w, count),
    }));
  };

  const setDefaultsSlide = (patch: Partial<CarouselSlideVisibilidad>) => {
    update((w) => ({
      ...w,
      configuracion: {
        ...w.configuracion,
        defaultsSlide: { ...configuracion.defaultsSlide, ...patch },
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <SectionTitle>Configuración</SectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Número de páginas: {configuracion.numeroSlides}
          </Label>
          <Slider
            min={2}
            max={6}
            step={1}
            value={[configuracion.numeroSlides]}
            onValueChange={([v]) => setNumeroSlides(v as WidgetSlideCount)}
          >
            <SliderThumb />
          </Slider>
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Componentes</SectionTitle>
        {(
          [
            ['mostrarTituloWidget', 'Título'],
            ['mostrarSubtitulo', 'Cuerpo'],
            ['mostrarInstruccion', 'Instrucción'],
            ['mostrarDots', 'Indicadores (dots)'],
            ['mostrarFlechasInternas', 'Flechas internas'],
            ['mostrarTabsPagina', 'Etiquetas de página'],
            ['mostrarBotonAnterior', 'Botón anterior'],
            ['mostrarBotonSiguiente', 'Botón siguiente'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={configuracion[key]}
              onCheckedChange={(checked) => setGlobalToggle(key, checked === true)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <SectionTitle>Visibilidad por defecto (páginas)</SectionTitle>
        <p className="text-[10px] text-muted-foreground">
          Afecta páginas nuevas o campos sin override individual.
        </p>
        {(
          [
            ['mostrarImagen', 'Imagen'],
            ['mostrarEncabezado', 'Encabezado'],
            ['mostrarSubtitulo', 'Subtítulo'],
            ['mostrarCuerpo', 'Cuerpo'],
            ['mostrarTarjeta', 'Tarjeta'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={configuracion.defaultsSlide[key]}
              onCheckedChange={(checked) =>
                setDefaultsSlide({ [key]: checked === true })
              }
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

export interface CarouselSlidePropertiesProps {
  block: CarouselWidget;
  slideId: string;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function CarouselSlideProperties({
  block: rawBlock,
  slideId,
  applyNow,
}: CarouselSlidePropertiesProps) {
  const block = normalizeCarouselWidget(rawBlock);
  const slide = block.slides.find((s) => s.id === slideId);
  if (!slide) return null;

  const slideIndex = block.slides.findIndex((s) => s.id === slideId) + 1;
  const configuracion = mergedCarouselConfig(block);
  const vis = resolveSlideVisibilidad(configuracion.defaultsSlide, slide);

  const updateSlide = (
    patch: Partial<
      Pick<
        typeof slide,
        | 'mostrarImagen'
        | 'mostrarEncabezado'
        | 'mostrarSubtitulo'
        | 'mostrarCuerpo'
        | 'mostrarTarjeta'
        | 'colorFondoSlide'
        | 'layoutId'
      >
    >,
  ) => {
    void applyNow((b) => {
      if (b.tipo !== 'carousel') return b;
      const w = normalizeCarouselWidget(b);
      return {
        ...w,
        slides: w.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
      };
    });
  };

  const activeLayoutId = resolveSlideLayoutId(slide, configuracion.layoutId);

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Página {slideIndex} — {slide.etiqueta}</SectionTitle>
      <p className="text-[10px] text-muted-foreground">
        Solo afecta esta página. Las demás mantienen su configuración.
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Layout de esta página</Label>
        <WidgetLayoutGallery
          activeId={activeLayoutId}
          onSelect={(id: WidgetLayoutId) => updateSlide({ layoutId: id })}
        />
      </div>
      {(
        [
          ['mostrarImagen', 'Imagen'],
          ['mostrarEncabezado', 'Encabezado'],
          ['mostrarSubtitulo', 'Subtítulo'],
          ['mostrarCuerpo', 'Cuerpo'],
          ['mostrarTarjeta', 'Tarjeta'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={vis[key]}
            onCheckedChange={(checked) => updateSlide({ [key]: checked === true })}
          />
          {label}
        </label>
      ))}
      {vis.mostrarTarjeta ? (
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs">Color fondo tarjeta</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={slide.colorFondoSlide ?? '#ffffff'}
            onChange={(e) => updateSlide({ colorFondoSlide: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}

export function getCarouselPanelSlideId(
  inner: { kind: string; slideId?: string } | null | undefined,
): string | null {
  return tabSelectionSlideId(inner);
}
