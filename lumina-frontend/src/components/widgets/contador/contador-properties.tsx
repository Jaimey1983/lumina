'use client';

import type { Block } from '@/types/slide.types';
import type { ContadorAlTerminar, ContadorFormato, ContadorModo, ContadorWidget } from '@/types/widget.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';
import { mergedContadorConfig, normalizeContadorWidget } from './contador-config';

export interface ContadorPropertiesProps {
  block: ContadorWidget;
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
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function ContadorProperties({ block: rawBlock, applyNow }: ContadorPropertiesProps) {
  const block = normalizeContadorWidget(rawBlock);
  const cfg = mergedContadorConfig(block);

  const update = (fn: (w: ContadorWidget) => ContadorWidget) => {
    void applyNow((b) => (b.tipo === 'contador' ? fn(normalizeContadorWidget(b)) : b));
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Modo</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <ToggleGroup
            type="single"
            value={cfg.modo}
            onValueChange={(val: ContadorModo) => {
              if (val) update((w) => ({ ...w, modo: val }));
            }}
            className="w-full justify-start rounded-md bg-slate-100/50 p-1"
          >
            <ToggleGroupItem value="temporizador" className="h-8 flex-1 text-[11px]">
              Temporizador
            </ToggleGroupItem>
            <ToggleGroupItem value="cronometro" className="h-8 flex-1 text-[11px]">
              Cronómetro
            </ToggleGroupItem>
            <ToggleGroupItem value="numero" className="h-8 flex-1 text-[11px]">
              Número
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-2">
            <Label className="text-xs">Etiqueta</Label>
            <Input
              value={cfg.etiqueta}
              onChange={(e) => update((w) => ({ ...w, etiqueta: e.target.value }))}
              placeholder="Tiempo"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {cfg.modo === 'temporizador' ? (
        <div>
          <WidgetSectionTitle>Temporizador</WidgetSectionTitle>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Duración (segundos)</Label>
              <Input
                type="number"
                min={1}
                max={359999}
                value={cfg.segundos}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update((w) => ({ ...w, segundos: Number.isFinite(n) ? n : 60 }));
                }}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Al terminar</Label>
              <ToggleGroup
                type="single"
                value={cfg.alTerminar}
                onValueChange={(val: ContadorAlTerminar) => {
                  if (val) update((w) => ({ ...w, alTerminar: val }));
                }}
                className="w-full justify-start rounded-md bg-slate-100/50 p-1"
              >
                <ToggleGroupItem value="ninguna" className="h-8 flex-1 text-xs">
                  Nada
                </ToggleGroupItem>
                <ToggleGroupItem value="siguiente" className="h-8 flex-1 text-xs">
                  Siguiente slide
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      ) : null}

      {cfg.modo === 'numero' ? (
        <div>
          <WidgetSectionTitle>Número</WidgetSectionTitle>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Valor inicial</Label>
              <Input
                type="number"
                value={cfg.valorInicial}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update((w) => ({ ...w, valorInicial: Number.isFinite(n) ? n : 0 }));
                }}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Paso (+ / −)</Label>
              <Input
                type="number"
                min={1}
                value={cfg.valorPaso}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update((w) => ({ ...w, valorPaso: Number.isFinite(n) ? n : 1 }));
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <WidgetSectionTitle>Formato</WidgetSectionTitle>
          <div className="pt-2">
            <ToggleGroup
              type="single"
              value={cfg.formato}
              onValueChange={(val: ContadorFormato) => {
                if (val) update((w) => ({ ...w, formato: val }));
              }}
              className="w-full justify-start rounded-md bg-slate-100/50 p-1"
            >
              <ToggleGroupItem value="mm:ss" className="h-8 flex-1 text-xs">
                mm:ss
              </ToggleGroupItem>
              <ToggleGroupItem value="hh:mm:ss" className="h-8 flex-1 text-xs">
                hh:mm:ss
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}

      <div>
        <WidgetSectionTitle>Comportamiento</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          {cfg.modo !== 'numero' ? (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contador-auto"
                checked={cfg.autoIniciar}
                onCheckedChange={(v) => update((w) => ({ ...w, autoIniciar: v === true }))}
              />
              <Label htmlFor="contador-auto" className="text-xs">
                Iniciar automáticamente
              </Label>
            </div>
          ) : null}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="contador-controles"
              checked={cfg.mostrarControles}
              onCheckedChange={(v) => update((w) => ({ ...w, mostrarControles: v === true }))}
            />
            <Label htmlFor="contador-controles" className="text-xs">
              Mostrar controles
            </Label>
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Apariencia</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <ColorField
            label="Color de fondo"
            value={cfg.colorFondo}
            onChange={(colorFondo) => update((w) => ({ ...w, colorFondo }))}
          />
          <ColorField
            label="Color de texto"
            value={cfg.colorTexto}
            onChange={(colorTexto) => update((w) => ({ ...w, colorTexto }))}
          />
          <ColorField
            label="Color de acento"
            value={cfg.colorAcento}
            onChange={(colorAcento) => update((w) => ({ ...w, colorAcento }))}
          />
        </div>
      </div>
    </div>
  );
}
