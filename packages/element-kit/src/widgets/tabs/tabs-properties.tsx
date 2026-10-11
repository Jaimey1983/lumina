'use client';

import type { Block, TabsWidget } from '@lumina/types/slide';
import type { WidgetLayoutId, WidgetSlideCount } from '@lumina/types/widget';
import { resizeTabsFichas } from './tabs-defaults.js';
import { PresetGallery, aplicarPreset } from '@lumina/editor-shared/preset-gallery';
import { presetsDelWidget } from '../widget-presets.js';
import { cn } from '@lumina/ui/lib/utils';
import { Button } from '@lumina/ui/button';
import { Checkbox } from '@lumina/ui/checkbox';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Slider, SliderThumb } from '@lumina/ui/slider';
import { WidgetLayoutGallery } from '@lumina/editor-shared/widget-layout-gallery';
import { resolveSlideLayoutId } from '@lumina/editor-shared/widget-layouts';

import {
  DEFAULT_TABS_CONFIG,
  normalizeTabsWidget,
  type TabsSlideVisibilidad,
} from './tabs-config.js';
import { resolveTabSlideVisibilidad, tabSelectionSlideId } from './tabs-slide-utils.js';
import { mergedTabsConfig } from './tabs-shared.js';
import { TABS_ICONOS } from './tabs-icons.js';
import {
  TABS_INSIGNIA_MAX,
  TABS_TRANSICIONES,
  TABS_VARIANTES,
  leerFichaT12,
  leerOpcionesT12,
  type TabsConfigT12,
  type TabsFichaT12,
  type TabsOpcionesT12,
} from './tabs-t12.js';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';

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

  const opciones = leerOpcionesT12(block.configuracion);
  // T12: opciones nuevas dentro de `configuracion` (el tipo de `@lumina/types` aún no las trae).
  const updateT12 = (parche: TabsOpcionesT12) =>
    update((w) => ({ ...w, configuracion: { ...w.configuracion, ...parche } as TabsConfigT12 }));

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <WidgetSectionTitle>Estilo</WidgetSectionTitle>
        <PresetGallery
          presets={presetsDelWidget('tabs')}
          estado={block}
          storageKey="widget.tabs.estilos"
          onSelect={(preset) =>
            update((w) => aplicarPreset(normalizeTabsWidget(w), preset))
          }
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Variante de pestañas</Label>
          <div className="grid grid-cols-2 gap-1">
            {TABS_VARIANTES.map((v) => (
              <Button
                key={v.id}
                type="button"
                size="sm"
                variant={opciones.variante === v.id ? 'primary' : 'outline'}
                className="h-8 text-xs"
                onClick={() => updateT12({ variante: v.id })}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Transición del panel</Label>
          <div className="flex gap-1">
            {TABS_TRANSICIONES.map((t) => (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={opciones.transicion === t.id ? 'primary' : 'outline'}
                className="h-8 flex-1 text-xs"
                onClick={() => updateT12({ transicion: t.id })}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Configuración</WidgetSectionTitle>
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
        <WidgetSectionTitle>Componentes</WidgetSectionTitle>
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
        <WidgetSectionTitle>Visibilidad por defecto (fichas)</WidgetSectionTitle>
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
  const { icono, insignia } = leerFichaT12(slide);
  // T12: icono e insignia por ficha (el tipo de `@lumina/types` aún no los trae).
  const updateFichaT12 = (parche: TabsFichaT12) => {
    void applyNow((b) => {
      if (b.tipo !== 'tabs') return b;
      const w = normalizeTabsWidget(b);
      return {
        ...w,
        fichas: w.fichas.map((f) => (f.id === slideId ? { ...f, ...parche } : f)),
      };
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <WidgetSectionTitle>Ficha {slideIndex} — {slide.etiqueta}</WidgetSectionTitle>
      <p className="text-[10px] text-muted-foreground">
        Solo afecta esta ficha. Las demás mantienen su configuración.
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Icono de la pestaña</Label>
        <div className="grid grid-cols-6 gap-1">
          <Button
            type="button"
            size="sm"
            variant={icono === null ? 'primary' : 'outline'}
            className="h-8 px-0 text-[10px]"
            aria-label="Sin icono"
            onClick={() => updateFichaT12({ icono: undefined })}
          >
            Ninguno
          </Button>
          {Object.entries(TABS_ICONOS).map(([id, { label, Icono }]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={icono === id ? 'primary' : 'outline'}
              className={cn('h-8 px-0')}
              aria-label={label}
              title={label}
              onClick={() => updateFichaT12({ icono: id })}
            >
              <Icono className="size-4" />
            </Button>
          ))}
        </div>
        <Label className="text-xs">Insignia (opcional)</Label>
        <Input
          type="text"
          maxLength={TABS_INSIGNIA_MAX}
          placeholder="Nuevo, 3…"
          className="h-8 text-xs"
          value={insignia}
          onChange={(e) => updateFichaT12({ insignia: e.target.value })}
        />
      </div>
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
