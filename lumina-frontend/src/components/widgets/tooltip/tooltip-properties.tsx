'use client';

import type { Block } from '@/types/slide.types';
import type { TooltipPosicion, TooltipTriggerTipo, TooltipWidget } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';
import { mergedTooltipConfig, normalizeTooltipWidget, tooltipFallbackSize } from './tooltip-config';
import { TOOLTIP_TRIGGER_ICONS } from './tooltip-parts';

export interface TooltipPropertiesProps {
  block: TooltipWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TooltipProperties({ block: rawBlock, applyNow }: TooltipPropertiesProps) {
  const block = normalizeTooltipWidget(rawBlock);
  const configuracion = mergedTooltipConfig(block);

  const update = (fn: (w: TooltipWidget) => TooltipWidget) => {
    void applyNow((b) => (b.tipo === 'tooltip' ? fn(normalizeTooltipWidget(b)) : b));
  };

  const updateTriggerTipo = (val: TooltipTriggerTipo) => {
    update((w) => {
      const size = tooltipFallbackSize(val);
      const shouldResize = w.triggerTipo !== val;
      return {
        ...w,
        triggerTipo: val,
        ...(shouldResize ? { ancho: size.ancho, alto: size.alto } : {}),
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Disparador</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de disparador</Label>
            <ToggleGroup
              type="single"
              value={configuracion.triggerTipo}
              onValueChange={(val: TooltipTriggerTipo) => {
                if (val) updateTriggerTipo(val);
              }}
              className="w-full justify-start rounded-md bg-slate-100/50 p-1"
            >
              <ToggleGroupItem value="icono" className="h-8 flex-1 text-xs">
                Ícono
              </ToggleGroupItem>
              <ToggleGroupItem value="texto_subrayado" className="h-8 flex-1 text-xs">
                Texto
              </ToggleGroupItem>
              <ToggleGroupItem value="punto" className="h-8 flex-1 text-xs">
                Punto
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {configuracion.triggerTipo === 'icono' ? (
            <div className="space-y-2">
              <Label className="text-xs">Ícono</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {TOOLTIP_TRIGGER_ICONS.map(({ id, Icon, label }) => {
                  const selected = configuracion.icono === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md border transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                      )}
                      onClick={() => update((w) => ({ ...w, icono: id }))}
                    >
                      <Icon className="size-4" aria-hidden />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {configuracion.triggerTipo === 'texto_subrayado' ? (
            <div className="space-y-2">
              <Label className="text-xs">Texto subrayado</Label>
              <WidgetDraftTextField
                value={configuracion.textoTrigger}
                onChange={(next) => update((w) => ({ ...w, textoTrigger: next }))}
                className="h-8 text-xs"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <WidgetSectionTitle>Tooltip</WidgetSectionTitle>
        <div className="space-y-2 pt-2">
          <Label className="text-xs">Texto del tooltip</Label>
          <WidgetDraftTextField
            value={configuracion.textoTooltip}
            onChange={(next) => update((w) => ({ ...w, textoTooltip: next }))}
            multiline
            className="min-h-20 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Posición</Label>
          <div className="grid grid-cols-3 gap-2 rounded-md bg-slate-100/50 p-1">
            {(['auto', 'arriba', 'abajo', 'izquierda', 'derecha'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`flex h-8 items-center justify-center rounded text-xs transition-colors ${
                  configuracion.posicion === pos
                    ? 'bg-white font-medium shadow-sm'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                } ${pos === 'auto' ? 'col-span-3' : 'col-span-1'}`}
                onClick={() => update((w) => ({ ...w, posicion: pos as TooltipPosicion }))}
              >
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Color de fondo</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={configuracion.colorFondo}
              onChange={(e) => update((w) => ({ ...w, colorFondo: e.target.value }))}
              className="h-8 w-8 cursor-pointer rounded border-0 p-0"
            />
            <WidgetDraftTextField
              value={configuracion.colorFondo}
              onChange={(next) => update((w) => ({ ...w, colorFondo: next }))}
              className="h-8 font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Color de texto</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={configuracion.colorTexto}
              onChange={(e) => update((w) => ({ ...w, colorTexto: e.target.value }))}
              className="h-8 w-8 cursor-pointer rounded border-0 p-0"
            />
            <WidgetDraftTextField
              value={configuracion.colorTexto}
              onChange={(next) => update((w) => ({ ...w, colorTexto: next }))}
              className="h-8 font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
