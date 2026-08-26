'use client';

import type { Block } from '@/types/slide.types';
import type {
  HotspotConfiguracion,
  HotspotEfectoApertura,
  HotspotPosicionBurbuja,
  HotspotTriggerEvento,
  HotspotWidget,
  WidgetSlideContent,
} from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';
import { WIDGET_LAYOUTS } from '@/components/widgets/shared/widget-layouts';
import { WidgetLayoutThumb } from '@/components/widgets/shared/widget-layout-thumb';
import { mergedHotspotConfig, normalizeHotspotWidget } from './hotspot-config';

const HOTSPOT_CONTENT_LAYOUTS = WIDGET_LAYOUTS.filter(
  (l) =>
    l.id === 'imagen-izq-texto-der' ||
    l.id === 'texto-izq-imagen-der' ||
    l.id === 'solo-texto',
);

export interface HotspotWidgetComponentesProps {
  block: HotspotWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function HotspotWidgetComponentes({ block: rawBlock, applyNow }: HotspotWidgetComponentesProps) {
  const block = normalizeHotspotWidget(rawBlock);
  const configuracion = mergedHotspotConfig(block);

  const update = (fn: (w: HotspotWidget) => HotspotWidget) => {
    void applyNow((b) => (b.tipo === 'hotspot' ? fn(normalizeHotspotWidget(b)) : b));
  };

  const updateConfig = (patch: Partial<HotspotConfiguracion>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Marcador</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs">Color del Pulso</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={configuracion.colorPulso}
                onChange={(e) => updateConfig({ colorPulso: e.target.value })}
                className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
              />
              <WidgetDraftTextField
                value={configuracion.colorPulso}
                onChange={(next) => updateConfig({ colorPulso: next })}
                className="font-mono text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tamaño del Marcador</Label>
            <ToggleGroup
              type="single"
              value={configuracion.tamanoPunto}
              onValueChange={(val: 'pequeno' | 'mediano' | 'grande') => {
                if (val) updateConfig({ tamanoPunto: val });
              }}
              className="justify-start w-full bg-slate-100/50 p-1 rounded-md"
            >
              <ToggleGroupItem value="pequeno" className="flex-1 text-xs h-8">
                Pequeño
              </ToggleGroupItem>
              <ToggleGroupItem value="mediano" className="flex-1 text-xs h-8">
                Mediano
              </ToggleGroupItem>
              <ToggleGroupItem value="grande" className="flex-1 text-xs h-8">
                Grande
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Evento de Apertura</Label>
            <ToggleGroup
              type="single"
              value={configuracion.triggerEvento}
              onValueChange={(val: HotspotTriggerEvento) => {
                if (val) updateConfig({ triggerEvento: val });
              }}
              className="justify-start w-full bg-slate-100/50 p-1 rounded-md"
            >
              <ToggleGroupItem value="click" className="flex-1 text-xs h-8">
                Al Clic
              </ToggleGroupItem>
              <ToggleGroupItem value="hover" className="flex-1 text-xs h-8">
                Al Hover
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <WidgetSectionTitle>Burbuja de Contenido</WidgetSectionTitle>

        <div className="space-y-2 pt-2">
          <Label className="text-xs text-muted-foreground">Posición de la Burbuja</Label>
          <div className="grid grid-cols-3 gap-2 bg-slate-100/50 p-1 rounded-md">
            {['auto', 'arriba', 'abajo', 'izquierda', 'derecha'].map((pos) => (
              <button
                key={pos}
                type="button"
                className={`text-xs h-8 rounded flex items-center justify-center transition-colors ${
                  configuracion.posicionBurbuja === pos
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                } ${pos === 'auto' ? 'col-span-3' : 'col-span-1 border border-transparent'}`}
                onClick={() => updateConfig({ posicionBurbuja: pos as HotspotPosicionBurbuja })}
              >
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Efecto de Apertura</Label>
          <ToggleGroup
            type="single"
            value={configuracion.efectoApertura}
            onValueChange={(val: HotspotEfectoApertura) => {
              if (val) updateConfig({ efectoApertura: val });
            }}
            className="justify-start w-full bg-slate-100/50 p-1 rounded-md"
          >
            <ToggleGroupItem value="fade" className="flex-1 text-xs h-8">
              Fade
            </ToggleGroupItem>
            <ToggleGroupItem value="slide-up" className="flex-1 text-xs h-8">
              Deslizar
            </ToggleGroupItem>
            <ToggleGroupItem value="instant" className="flex-1 text-xs h-8">
              Sin efecto
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Color de Fondo</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={configuracion.colorFondoBurbuja}
              onChange={(e) => updateConfig({ colorFondoBurbuja: e.target.value })}
              className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
            />
            <WidgetDraftTextField
              value={configuracion.colorFondoBurbuja}
              onChange={(next) => updateConfig({ colorFondoBurbuja: next })}
              className="font-mono text-xs h-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Ancho (px)</Label>
          <Input
            type="number"
            min={100}
            max={600}
            value={configuracion.anchoBurbuja}
            onChange={(e) => updateConfig({ anchoBurbuja: parseInt(e.target.value) || 280 })}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="hs-close"
            checked={configuracion.mostrarBotonCerrar}
            onCheckedChange={(checked) => updateConfig({ mostrarBotonCerrar: !!checked })}
          />
          <Label htmlFor="hs-close" className="text-xs font-normal">
            Mostrar botón de cerrar (x)
          </Label>
        </div>
      </div>
    </div>
  );
}

export function HotspotProperties({
  block,
  applyNow,
}: {
  block: HotspotWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}) {
  return <HotspotWidgetComponentes block={block} applyNow={applyNow} />;
}

export function HotspotOverlayProperties({
  block: rawBlock,
  applyNow,
}: {
  block: HotspotWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}) {
  const w = normalizeHotspotWidget(rawBlock);
  const overlay = w.overlay;

  const updateOverlay = (patch: Partial<WidgetSlideContent>) => {
    void applyNow((b) => {
      if (b.tipo !== 'hotspot') return b;
      const nb = normalizeHotspotWidget(b);
      return {
        ...nb,
        overlay: { ...nb.overlay, ...patch },
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-medium text-xs">HB</span>
        </div>
        <div>
          <h4 className="text-sm font-medium text-blue-900">Burbuja</h4>
          <p className="text-xs text-blue-700/80">Editando diseño del contenido</p>
        </div>
      </div>

      <div className="space-y-4">
        <WidgetSectionTitle>Diseño del Contenido</WidgetSectionTitle>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {HOTSPOT_CONTENT_LAYOUTS.map((layout) => {
            const selected = overlay.layoutId === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                className={cn(
                  'flex items-center gap-2 overflow-hidden rounded-lg border text-left transition-colors',
                  'hover:border-primary/50 hover:bg-accent/40',
                  selected
                    ? 'border-primary ring-2 ring-primary/30 bg-accent/30'
                    : 'border-border bg-card',
                )}
                onClick={() => updateOverlay({ layoutId: layout.id })}
              >
                <div className="w-20 shrink-0">
                  <WidgetLayoutThumb layoutId={layout.id} />
                </div>
                <span className="py-2 pr-2 text-[11px] font-medium leading-tight text-foreground">
                  {layout.id === 'solo-texto' ? 'Sin imagen' : layout.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <WidgetSectionTitle>Visibilidad de Elementos</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hso-img"
              checked={overlay.mostrarImagen !== false}
              onCheckedChange={(checked) => updateOverlay({ mostrarImagen: !!checked })}
            />
            <Label htmlFor="hso-img" className="text-xs font-normal">
              Mostrar Imagen
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hso-encabezado"
              checked={overlay.mostrarEncabezado !== false}
              onCheckedChange={(checked) => updateOverlay({ mostrarEncabezado: !!checked })}
            />
            <Label htmlFor="hso-encabezado" className="text-xs font-normal">
              Mostrar Título
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hso-cuerpo"
              checked={overlay.mostrarCuerpo !== false}
              onCheckedChange={(checked) => updateOverlay({ mostrarCuerpo: !!checked })}
            />
            <Label htmlFor="hso-cuerpo" className="text-xs font-normal">
              Mostrar Cuerpo
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
