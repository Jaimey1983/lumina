'use client';

import type { Block, TabsWidget } from '@/types/slide.types';
import type { WidgetLayoutId, WidgetSlideCount } from '@/types/widget.types';
import { resizeTabsFichas } from '@/lib/tabs-defaults';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { WidgetLayoutGallery } from '@/components/widgets/shared/widget-layout-gallery';
import { resolveSlideLayoutId } from '@/components/widgets/shared/widget-layouts';

import {
  DEFAULT_TABS_CONFIG,
  normalizeTabsWidget,
  type TabsSlideVisibilidad,
} from './tabs-config';
import { resolveTabSlideVisibilidad, tabSelectionSlideId } from './tabs-slide-utils';
import { mergedTabsConfig } from './tabs-shared';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export interface TabsWidgetComponentesProps {
  block: TabsWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TabsWidgetComponentes({ block: rawBlock, applyNow }: TabsWidgetComponentesProps) {
  const block = normalizeTabsWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_TABS_CONFIG,
    ...block.configuracion,
    defaultsSlide: {
      ...DEFAULT_TABS_CONFIG.defaultsSlide,
      ...block.configuracion.defaultsSlide,
    },
  };

  const update = (fn: (w: TabsWidget) => TabsWidget) => {
    void applyNow((b) => (b.tipo === 'tabs' ? fn(normalizeTabsWidget(b)) : b));
  };

  const setGlobalToggle = (
    key:
      | 'mostrarTituloWidget'
      | 'mostrarSubtitulo'
      | 'mostrarInstruccion'
      | 'mostrarBotonAnterior'
      | 'mostrarBotonSiguiente',
    value: boolean,
  ) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, [key]: value },
    }));
  };

  const setNumeroFichas = (count: WidgetSlideCount) => {
    update((w) => ({
      ...w,
      configuracion: {
        ...w.configuracion,
        numeroFichas: count,
        fichaActiva: Math.min(w.configuracion.fichaActiva ?? 0, count - 1),
      },
      fichas: resizeTabsFichas(w, count),
    }));
  };

  const setDefaultsSlide = (patch: Partial<TabsSlideVisibilidad>) => {
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
            Número de fichas: {configuracion.numeroFichas}
          </Label>
          <Slider
            min={2}
            max={6}
            step={1}
            value={[configuracion.numeroFichas]}
            onValueChange={([v]) => setNumeroFichas(v as WidgetSlideCount)}
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
        <SectionTitle>Visibilidad por defecto (fichas)</SectionTitle>
        <p className="text-[10px] text-muted-foreground">
          Afecta fichas nuevas o campos sin override individual.
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

export interface TabsSlidePropertiesProps {
  block: TabsWidget;
  slideId: string;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TabsSlideProperties({
  block: rawBlock,
  slideId,
  applyNow,
}: TabsSlidePropertiesProps) {
  const block = normalizeTabsWidget(rawBlock);
  const slide = block.fichas.find((f) => f.id === slideId);
  if (!slide) return null;

  const slideIndex = block.fichas.findIndex((f) => f.id === slideId) + 1;
  const configuracion = mergedTabsConfig(block);
  const vis = resolveTabSlideVisibilidad(configuracion, slide);

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
      if (b.tipo !== 'tabs') return b;
      const w = normalizeTabsWidget(b);
      return {
        ...w,
        fichas: w.fichas.map((f) => (f.id === slideId ? { ...f, ...patch } : f)),
      };
    });
  };

  const activeLayoutId = resolveSlideLayoutId(slide, configuracion.layoutId);

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Ficha {slideIndex} — {slide.etiqueta}</SectionTitle>
      <p className="text-[10px] text-muted-foreground">
        Solo afecta esta ficha. Las demás mantienen su configuración.
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Layout de esta ficha</Label>
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

export function getTabsPanelSlideId(
  inner: { kind: string; slideId?: string } | null | undefined,
): string | null {
  return tabSelectionSlideId(inner);
}
