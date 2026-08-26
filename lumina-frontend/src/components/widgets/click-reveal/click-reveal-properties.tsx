'use client';

import type { Block, ClickRevealWidget } from '@/types/slide.types';
import type { ClickRevealInnerSelection, WidgetLayoutId, WidgetSlideCount } from '@/types/widget.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';
import { WidgetLayoutGallery } from '@/components/widgets/shared/widget-layout-gallery';
import { resolveSlideLayoutId } from '@/components/widgets/shared/widget-layouts';

import {
  clickRevealPanelOverlayId,
  clickRevealPanelTriggerId,
  mergedClickRevealConfig,
  normalizeClickRevealWidget,
  resizeClickRevealElements,
} from './click-reveal-config';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';

export interface ClickRevealWidgetComponentesProps {
  block: ClickRevealWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function ClickRevealWidgetComponentes({
  block: rawBlock,
  applyNow,
}: ClickRevealWidgetComponentesProps) {
  const block = normalizeClickRevealWidget(rawBlock);
  const configuracion = mergedClickRevealConfig(block);

  const update = (fn: (w: ClickRevealWidget) => ClickRevealWidget) => {
    void applyNow((b) => (b.tipo === 'click-reveal' ? fn(normalizeClickRevealWidget(b)) : b));
  };

  const setGlobalToggle = (
    key:
      | 'mostrarTituloWidget'
      | 'mostrarSubtitulo'
      | 'mostrarInstruccion'
      | 'mostrarBotonAnterior'
      | 'mostrarBotonSiguiente'
      | 'mostrarBotonCerrar',
    value: boolean,
  ) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, [key]: value },
    }));
  };

  const setNumeroElementos = (count: WidgetSlideCount) => {
    update((w) => {
      const resized = resizeClickRevealElements(w, count);
      return {
        ...w,
        configuracion: {
          ...w.configuracion,
          numeroElementos: count,
          overlayActivo: Math.min(w.configuracion.overlayActivo ?? 0, count - 1),
        },
        triggers: resized.triggers,
        overlays: resized.overlays,
      };
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <WidgetSectionTitle>Configuración</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">Número de elementos: {configuracion.numeroElementos}</Label>
          <Slider
            min={2}
            max={6}
            step={1}
            value={[configuracion.numeroElementos]}
            onValueChange={([v]) => setNumeroElementos(v as WidgetSlideCount)}
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
            ['mostrarBotonAnterior', 'Flecha anterior'],
            ['mostrarBotonSiguiente', 'Flecha siguiente'],
            ['mostrarBotonCerrar', 'Botón cerrar modal'],
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
    </div>
  );
}

export interface ClickRevealOverlayPropertiesProps {
  block: ClickRevealWidget;
  overlayId: string;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function ClickRevealOverlayProperties({
  block: rawBlock,
  overlayId,
  applyNow,
}: ClickRevealOverlayPropertiesProps) {
  const block = normalizeClickRevealWidget(rawBlock);
  const configuracion = mergedClickRevealConfig(block);
  const overlay = block.overlays.find((o) => o.id === overlayId);
  if (!overlay) return null;

  const defaults = configuracion.defaultsOverlay;
  const vis = {
    mostrarEtiqueta: overlay.mostrarEtiqueta ?? defaults.mostrarEtiqueta,
    mostrarImagen: overlay.mostrarImagen ?? defaults.mostrarImagen,
    mostrarEncabezado: overlay.mostrarEncabezado ?? defaults.mostrarEncabezado,
    mostrarSubtitulo: overlay.mostrarSubtitulo ?? defaults.mostrarSubtitulo,
    mostrarCuerpo: overlay.mostrarCuerpo ?? defaults.mostrarCuerpo,
  };

  const updateOverlay = (patch: Partial<typeof overlay>) => {
    void applyNow((b) => {
      if (b.tipo !== 'click-reveal') return b;
      const w = normalizeClickRevealWidget(b);
      return {
        ...w,
        overlays: w.overlays.map((o) => (o.id === overlayId ? { ...o, ...patch } : o)),
      };
    });
  };

  const updateConfig = (patch: Partial<typeof configuracion>) => {
    void applyNow((b) => {
      if (b.tipo !== 'click-reveal') return b;
      const w = normalizeClickRevealWidget(b);
      return { ...w, configuracion: { ...w.configuracion, ...patch } };
    });
  };

  const overlayIndex = block.overlays.findIndex((o) => o.id === overlayId);
  const overlayLayoutId = resolveSlideLayoutId(overlay, configuracion.layoutId);

  return (
    <div className="flex flex-col gap-3">
      <WidgetSectionTitle>Solapar {overlayIndex + 1}</WidgetSectionTitle>
      <p className="text-[10px] text-muted-foreground">
        Contenido de la ventana emergente al hacer clic en la tarjeta {overlayIndex + 1}.
      </p>

      <div className="space-y-2">
        <Label className="text-xs">Layout del modal (Solapar {overlayIndex + 1})</Label>
        <WidgetLayoutGallery
          activeId={overlayLayoutId}
          onSelect={(id: WidgetLayoutId) => updateOverlay({ layoutId: id })}
        />
      </div>

      {(
        [
          ['mostrarEtiqueta', 'Etiqueta superpuesta'],
          ['mostrarImagen', 'Imagen superpuesta'],
          ['mostrarEncabezado', 'Título de la superposición'],
          ['mostrarSubtitulo', 'Subtítulo'],
          ['mostrarCuerpo', 'Cuerpo superpuesto'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={vis[key]}
            onCheckedChange={(checked) => updateOverlay({ [key]: checked === true })}
          />
          {label}
        </label>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs">URL imagen del modal</Label>
        <WidgetDraftTextField
          className="h-8 text-xs"
          value={overlay.imagen ?? ''}
          placeholder="https://…"
          onChange={(next) => updateOverlay({ imagen: next || undefined })}
        />
      </div>

      <div className="space-y-1.5 pt-1">
        <Label className="text-xs">Color fondo modal</Label>
        <Input
          type="color"
          className="h-8 w-full cursor-pointer p-1"
          value={configuracion.colorFondoModal}
          onChange={(e) => updateConfig({ colorFondoModal: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Padding modal</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {configuracion.paddingModal}px
          </span>
        </div>
        <Slider
          value={[configuracion.paddingModal]}
          min={8}
          max={48}
          step={2}
          onValueChange={([v]) => updateConfig({ paddingModal: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Radio esquinas</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {configuracion.radioModal}px
          </span>
        </div>
        <Slider
          value={[configuracion.radioModal]}
          min={0}
          max={24}
          step={2}
          onValueChange={([v]) => updateConfig({ radioModal: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
    </div>
  );
}

export interface ClickRevealTriggerPropertiesProps {
  block: ClickRevealWidget;
  triggerId: string;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function ClickRevealTriggerProperties({
  block: rawBlock,
  triggerId,
  applyNow,
}: ClickRevealTriggerPropertiesProps) {
  const block = normalizeClickRevealWidget(rawBlock);
  const configuracion = mergedClickRevealConfig(block);
  const trigger = block.triggers.find((t) => t.id === triggerId);
  if (!trigger) return null;

  const defaults = configuracion.defaultsTrigger;
  const vis = {
    mostrarImagen: trigger.mostrarImagen ?? defaults.mostrarImagen,
    mostrarEtiqueta: trigger.mostrarEtiqueta ?? defaults.mostrarEtiqueta,
    mostrarTitulo: trigger.mostrarTitulo ?? defaults.mostrarTitulo,
  };

  const updateTrigger = (patch: Partial<typeof trigger>) => {
    void applyNow((b) => {
      if (b.tipo !== 'click-reveal') return b;
      const w = normalizeClickRevealWidget(b);
      return {
        ...w,
        triggers: w.triggers.map((t) => (t.id === triggerId ? { ...t, ...patch } : t)),
      };
    });
  };

  const triggerIndex = block.triggers.findIndex((t) => t.id === triggerId);

  return (
    <div className="flex flex-col gap-3">
      <WidgetSectionTitle>Tarjeta {triggerIndex + 1}</WidgetSectionTitle>
      <p className="text-[10px] text-muted-foreground">
        Elemento clickeable que abre la ventana Solapar {triggerIndex + 1}.
      </p>

      {(
        [
          ['mostrarImagen', 'Imagen / icono'],
          ['mostrarEtiqueta', 'Etiqueta numérica'],
          ['mostrarTitulo', 'Título en tarjeta'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={vis[key]}
            onCheckedChange={(checked) => updateTrigger({ [key]: checked === true })}
          />
          {label}
        </label>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs">Texto en tarjeta</Label>
        <WidgetDraftTextField
          className="h-8 text-xs"
          value={trigger.titulo ?? ''}
          placeholder="Texto opcional"
          onChange={(next) => updateTrigger({ titulo: next })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">URL imagen / icono</Label>
        <WidgetDraftTextField
          className="h-8 text-xs"
          value={trigger.imagen ?? ''}
          placeholder="https://…"
          onChange={(next) => updateTrigger({ imagen: next || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Color de fondo</Label>
        <Input
          type="color"
          className="h-8 w-full cursor-pointer p-1"
          value={trigger.colorFondo ?? '#2563EB'}
          onChange={(e) => updateTrigger({ colorFondo: e.target.value })}
        />
      </div>
    </div>
  );
}

export function getClickRevealPanelOverlayId(
  inner: ClickRevealInnerSelection | null | undefined,
): string | null {
  return clickRevealPanelOverlayId(inner);
}

export function getClickRevealPanelTriggerId(
  inner: ClickRevealInnerSelection | null | undefined,
): string | null {
  return clickRevealPanelTriggerId(inner);
}

/** @deprecated use getClickRevealPanelOverlayId */
export function getClickRevealPanelLayerId(
  inner: ClickRevealInnerSelection | null | undefined,
): string | null {
  return getClickRevealPanelOverlayId(inner);
}

/** @deprecated */
export const ClickRevealLayerProperties = ClickRevealOverlayProperties;
