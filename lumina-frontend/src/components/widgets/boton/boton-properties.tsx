'use client';

import type { Block } from '@/types/slide.types';
import type { BotonAccion, BotonForma, BotonTamano, BotonVariante, BotonWidget } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';
import { BOTON_VARIANTES, botonFallbackSize, mergedBotonConfig, normalizeBotonWidget } from './boton-config';

export interface BotonPropertiesProps {
  block: BotonWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function BotonProperties({ block: rawBlock, applyNow }: BotonPropertiesProps) {
  const block = normalizeBotonWidget(rawBlock);
  const cfg = mergedBotonConfig(block);

  const update = (fn: (w: BotonWidget) => BotonWidget) => {
    void applyNow((b) => (b.tipo === 'boton' ? fn(normalizeBotonWidget(b)) : b));
  };

  const updateTamano = (tamano: BotonTamano) => {
    update((w) => {
      const size = botonFallbackSize(tamano);
      return {
        ...w,
        tamano,
        ...(w.tamano !== tamano ? { ancho: size.ancho, alto: size.alto } : {}),
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Contenido</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs">Texto del botón</Label>
            <Input
              value={cfg.texto}
              onChange={(e) => update((w) => ({ ...w, texto: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Estilo Bootstrap</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Variante</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {BOTON_VARIANTES.map(({ id, label, swatch }) => {
                const selected = cfg.variante === id;
                return (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    className={cn(
                      'flex h-8 items-center justify-center gap-1.5 rounded-md border px-1 text-[11px] font-medium transition-colors',
                      selected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40',
                    )}
                    onClick={() => update((w) => ({ ...w, variante: id as BotonVariante }))}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="boton-outline"
              checked={cfg.outline}
              onCheckedChange={(checked) => update((w) => ({ ...w, outline: !!checked }))}
            />
            <Label htmlFor="boton-outline" className="text-xs font-normal">
              Outline (borde, fondo transparente)
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tamaño</Label>
            <ToggleGroup
              type="single"
              value={cfg.tamano}
              onValueChange={(val: BotonTamano) => {
                if (val) updateTamano(val);
              }}
              className="w-full justify-start rounded-md bg-slate-100/50 p-1"
            >
              <ToggleGroupItem value="sm" className="h-8 flex-1 text-xs">
                Small
              </ToggleGroupItem>
              <ToggleGroupItem value="md" className="h-8 flex-1 text-xs">
                Default
              </ToggleGroupItem>
              <ToggleGroupItem value="lg" className="h-8 flex-1 text-xs">
                Large
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Forma</Label>
            <ToggleGroup
              type="single"
              value={cfg.forma}
              onValueChange={(val: BotonForma) => {
                if (val) update((w) => ({ ...w, forma: val }));
              }}
              className="w-full justify-start rounded-md bg-slate-100/50 p-1"
            >
              <ToggleGroupItem value="redondeado" className="h-8 flex-1 text-xs">
                Redondeado
              </ToggleGroupItem>
              <ToggleGroupItem value="pill" className="h-8 flex-1 text-xs">
                Pill
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Acción</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Al hacer clic</Label>
            <ToggleGroup
              type="single"
              value={cfg.accion}
              onValueChange={(val: BotonAccion) => {
                if (val) update((w) => ({ ...w, accion: val }));
              }}
              className="flex w-full flex-wrap justify-start gap-1 rounded-md bg-slate-100/50 p-1"
            >
              <ToggleGroupItem value="siguiente" className="h-8 flex-1 text-xs">
                Siguiente
              </ToggleGroupItem>
              <ToggleGroupItem value="anterior" className="h-8 flex-1 text-xs">
                Anterior
              </ToggleGroupItem>
              <ToggleGroupItem value="ir_a" className="h-8 flex-1 text-xs">
                Ir a slide
              </ToggleGroupItem>
              <ToggleGroupItem value="url" className="h-8 flex-1 text-xs">
                URL
              </ToggleGroupItem>
              <ToggleGroupItem value="ninguna" className="h-8 flex-1 text-xs">
                Ninguna
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {cfg.accion === 'url' ? (
            <div className="space-y-2">
              <Label className="text-xs">URL</Label>
              <Input
                value={cfg.url}
                placeholder="https://…"
                onChange={(e) => update((w) => ({ ...w, url: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          ) : null}

          {cfg.accion === 'ir_a' ? (
            <div className="space-y-2">
              <Label className="text-xs">Número de diapositiva</Label>
              <Input
                type="number"
                min={1}
                value={cfg.slideIndex + 1}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update((w) => ({ ...w, slideIndex: Number.isFinite(n) ? Math.max(0, n - 1) : 0 }));
                }}
                className="h-8 text-xs"
              />
            </div>
          ) : null}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="boton-disabled"
              checked={cfg.deshabilitado}
              onCheckedChange={(checked) => update((w) => ({ ...w, deshabilitado: !!checked }))}
            />
            <Label htmlFor="boton-disabled" className="text-xs font-normal">
              Deshabilitado
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
