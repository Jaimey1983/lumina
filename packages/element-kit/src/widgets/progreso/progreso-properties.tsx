'use client';

import { PresetGallery, aplicarPreset } from '@lumina/editor-shared/preset-gallery';
import { presetsDelWidget } from '../widget-presets.js';
import type { Block } from '@lumina/types/slide';
import type { ProgresoModo, ProgresoWidget } from '@lumina/types/widget';
import { Checkbox } from '@lumina/ui/checkbox';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@lumina/ui/toggle-group';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';
import { WidgetDraftTextField } from '@lumina/editor-shared/panel-only-field';
import {
  PROGRESO_MAX_HITOS,
  PROGRESO_MAX_PASOS,
  PROGRESO_VARIANTES,
  mergedProgresoConfig,
  normalizeProgresoWidget,
  type ProgresoVariante,
  type ProgresoWidgetT9,
} from './progreso-config.js';

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

  const update = (fn: (w: ProgresoWidgetT9) => ProgresoWidgetT9) => {
    void applyNow((b) =>
      b.tipo === 'progreso'
        ? (fn(normalizeProgresoWidget(b) as ProgresoWidgetT9) as ProgresoWidget)
        : b,
    );
  };

  return (
    <div className="space-y-6">
      <PresetGallery
        presets={presetsDelWidget('progreso')}
        estado={block}
        storageKey="widget.progreso.estilos"
        onSelect={(preset) =>
          void applyNow((b) =>
            b.tipo === 'progreso' ? aplicarPreset(normalizeProgresoWidget(b), preset) : b,
          )
        }
      />
      <div>
        <WidgetSectionTitle>Variante</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <ToggleGroup
            type="single"
            value={cfg.variante}
            onValueChange={(val: ProgresoVariante) => {
              if (val) update((w) => ({ ...w, variante: val }));
            }}
            className="flex w-full flex-wrap justify-start gap-1 rounded-md bg-slate-100/50 p-1"
          >
            {PROGRESO_VARIANTES.map(({ id, label }) => (
              <ToggleGroupItem key={id} value={id} className="h-8 flex-1 text-xs">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {cfg.variante === 'pasos' && cfg.modo === 'manual' ? (
            <div className="space-y-2">
              <Label className="text-xs">Pasos ({cfg.numeroPasos})</Label>
              <Input
                type="range"
                min={2}
                max={PROGRESO_MAX_PASOS}
                value={cfg.numeroPasos}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update((w) => ({ ...w, numeroPasos: Number.isFinite(n) ? n : 5 }));
                }}
                className="h-8"
              />
            </div>
          ) : null}
        </div>
      </div>

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

          {cfg.modo === 'manual' ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="progreso-objetivo"
                  checked={cfg.modoObjetivo}
                  onCheckedChange={(v) => update((w) => ({ ...w, modoObjetivo: v === true }))}
                />
                <Label htmlFor="progreso-objetivo" className="text-xs">
                  Modo objetivo (actual / meta)
                </Label>
              </div>
              {cfg.modoObjetivo ? (
                <div className="grid grid-cols-3 gap-2">
                  <label className="space-y-1 text-[11px]">
                    Actual
                    <Input
                      type="number"
                      min={0}
                      value={cfg.valorActual}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        update((w) => ({ ...w, valorActual: Number.isFinite(n) && n >= 0 ? n : 0 }));
                      }}
                      className="h-8 text-xs"
                    />
                  </label>
                  <label className="space-y-1 text-[11px]">
                    Meta
                    <Input
                      type="number"
                      min={1}
                      value={cfg.meta}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        update((w) => ({ ...w, meta: Number.isFinite(n) && n > 0 ? n : 100 }));
                      }}
                      className="h-8 text-xs"
                    />
                  </label>
                  <label className="space-y-1 text-[11px]">
                    Unidad
                    <Input
                      type="text"
                      maxLength={12}
                      value={cfg.unidad}
                      placeholder="pts"
                      onChange={(e) => update((w) => ({ ...w, unidad: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

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

      {cfg.variante === 'lineal' || cfg.variante === 'pasos' ? (
        <div>
          <WidgetSectionTitle>
            {cfg.variante === 'pasos' ? 'Etiquetas de los pasos' : 'Hitos'}
          </WidgetSectionTitle>
          <div className="space-y-2 pt-2">
            {cfg.hitos.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {cfg.variante === 'lineal' ? (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    aria-label={`Posición del hito ${i + 1} (%)`}
                    value={h.valor}
                    onChange={(e) => {
                      const n = Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0)));
                      update((w) => ({
                        ...w,
                        hitos: (w.hitos ?? []).map((x, k) => (k === i ? { ...x, valor: n } : x)),
                      }));
                    }}
                    className="h-8 w-14 text-xs"
                  />
                ) : (
                  <span className="w-5 text-center text-[11px] text-muted-foreground">{i + 1}</span>
                )}
                <Input
                  type="text"
                  maxLength={24}
                  aria-label={`Etiqueta del hito ${i + 1}`}
                  value={h.etiqueta}
                  onChange={(e) =>
                    update((w) => ({
                      ...w,
                      hitos: (w.hitos ?? []).map((x, k) => (k === i ? { ...x, etiqueta: e.target.value } : x)),
                    }))
                  }
                  className="h-8 flex-1 text-xs"
                />
                <button
                  type="button"
                  aria-label={`Quitar hito ${i + 1}`}
                  onClick={() => update((w) => ({ ...w, hitos: (w.hitos ?? []).filter((_, k) => k !== i) }))}
                  className="text-xs text-muted-foreground hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={cfg.hitos.length >= PROGRESO_MAX_HITOS}
              onClick={() =>
                update((w) => {
                  const actuales = w.hitos ?? [];
                  const valor = cfg.variante === 'pasos' ? actuales.length : Math.min(100, (actuales.length + 1) * 25);
                  return { ...w, hitos: [...actuales, { valor, etiqueta: '' }] };
                })
              }
              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"
            >
              + Añadir {cfg.variante === 'pasos' ? 'etiqueta' : 'hito'}
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <WidgetSectionTitle>Estilo</WidgetSectionTitle>
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
          {cfg.variante === 'lineal' ? (
            <>
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
            </>
          ) : null}
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
