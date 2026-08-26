'use client';

import type { Block } from '@/types/slide.types';
import type { ProgresoModo, ProgresoWidget } from '@/types/widget.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';
import { mergedProgresoConfig, normalizeProgresoWidget } from './progreso-config';

export interface ProgresoPropertiesProps {
  block: ProgresoWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border-0 p-0"
        />
        <WidgetDraftTextField
          value={value}
          onChange={onChange}
          className="h-8 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function ProgresoProperties({ block: rawBlock, applyNow }: ProgresoPropertiesProps) {
  const block = normalizeProgresoWidget(rawBlock);
  const cfg = mergedProgresoConfig(block);

  const update = (fn: (w: ProgresoWidget) => ProgresoWidget) => {
    void applyNow((b) => (b.tipo === 'progreso' ? fn(normalizeProgresoWidget(b)) : b));
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Valor</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <ToggleGroup
            type="single"
            value={cfg.modo}
            onValueChange={(val: ProgresoModo) => {
              if (val) update((w) => ({ ...w, modo: val }));
            }}
            className="w-full justify-start rounded-md bg-slate-100/50 p-1"
          >
            <ToggleGroupItem value="slides" className="h-8 flex-1 text-xs">
              Diapositiva
            </ToggleGroupItem>
            <ToggleGroupItem value="manual" className="h-8 flex-1 text-xs">
              Manual
            </ToggleGroupItem>
          </ToggleGroup>

          {cfg.modo === 'manual' ? (
            <div className="space-y-2">
              <Label className="text-xs">Porcentaje ({cfg.porcentaje}%)</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={cfg.porcentaje}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update((w) => ({ ...w, porcentaje: Number.isFinite(n) ? n : 0 }));
                }}
                className="h-8"
              />
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              El avance se calcula con la diapositiva actual sobre el total de la clase.
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Etiqueta</Label>
            <WidgetDraftTextField
              value={cfg.etiqueta}
              onChange={(next) => update((w) => ({ ...w, etiqueta: next }))}
              placeholder="Progreso"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Estilo Bootstrap</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="progreso-pct"
              checked={cfg.mostrarPorcentaje}
              onCheckedChange={(v) => update((w) => ({ ...w, mostrarPorcentaje: v === true }))}
            />
            <Label htmlFor="progreso-pct" className="text-xs">
              Mostrar porcentaje
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="progreso-striped"
              checked={cfg.striped}
              onCheckedChange={(v) => update((w) => ({ ...w, striped: v === true }))}
            />
            <Label htmlFor="progreso-striped" className="text-xs">
              Rayas
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="progreso-anim"
              checked={cfg.animated}
              onCheckedChange={(v) => update((w) => ({ ...w, animated: v === true, striped: v === true ? true : w.striped }))}
            />
            <Label htmlFor="progreso-anim" className="text-xs">
              Animar rayas
            </Label>
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Colores</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <ColorField
            label="Color de la barra"
            value={cfg.colorBarra}
            onChange={(colorBarra) => update((w) => ({ ...w, colorBarra }))}
          />
          <ColorField
            label="Color de fondo"
            value={cfg.colorFondo}
            onChange={(colorFondo) => update((w) => ({ ...w, colorFondo }))}
          />
          <ColorField
            label="Color del texto"
            value={cfg.colorTexto}
            onChange={(colorTexto) => update((w) => ({ ...w, colorTexto }))}
          />
        </div>
      </div>
    </div>
  );
}
