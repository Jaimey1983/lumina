'use client';

import { PresetGallery, aplicarPreset } from '@lumina/editor-shared/preset-gallery';
import { presetsDelWidget } from '../widget-presets.js';
import type { Block } from '@lumina/types/slide';
import type { ContadorFormato, ContadorModo, ContadorWidget } from '@lumina/types/widget';
import {
  CONTADOR_ALERTAS,
  CONTADOR_MAX_HITOS,
  CONTADOR_VARIANTES,
  type ContadorHito,
  type ContadorHitosAlerta,
  type ContadorVariante,
  type ContadorWidgetT10,
} from './contador-defaults.js';
import { Button } from '@lumina/ui/button';
import { Checkbox } from '@lumina/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@lumina/ui/toggle-group';
import { WidgetDraftTextField } from '@lumina/editor-shared/panel-only-field';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';
import { mergedContadorConfig, normalizeContadorWidget } from './contador-config.js';

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
        <WidgetDraftTextField
          value={value}
          onChange={onChange}
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
  // T10: las opciones nuevas se escriben con un parche tipado (el tipo de `@lumina/types` aún no las trae).
  const updateT10 = (parche: Partial<ContadorWidgetT10>) =>
    update((w) => ({ ...w, ...parche }) as ContadorWidget);
  const hitos = cfg.hitos;
  const setHito = (i: number, parche: Partial<ContadorHito>) =>
    updateT10({ hitos: hitos.map((h, k) => (k === i ? { ...h, ...parche } : h)) });

  return (
    <div className="space-y-6">
      <PresetGallery
        presets={presetsDelWidget('contador')}
        estado={block}
        storageKey="widget.contador.estilos"
        onSelect={(preset) =>
          void applyNow((b) =>
            b.tipo === 'contador' ? aplicarPreset(normalizeContadorWidget(b), preset) : b,
          )
        }
      />
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
            <WidgetDraftTextField
              value={cfg.etiqueta}
              onChange={(next) => update((w) => ({ ...w, etiqueta: next }))}
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
              {/* K7b: el editor ya no ESCRIBE `alTerminar`; lo reemplaza una interacción
                  («Interacciones»). La lectura de un valor legado sigue viva (D6). */}
              {cfg.alTerminar === 'siguiente' ? (
                <div className="space-y-2 rounded-md border border-border bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Acción heredada: <strong>ir al siguiente slide</strong>. Se mantiene tal cual.
                    Para cambiarla, quítala y configura una interacción más abajo.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => update((w) => ({ ...w, alTerminar: 'ninguna' }))}
                  >
                    Quitar acción heredada
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Para que al terminar pase de slide usa «Interacciones» más abajo.
                </p>
              )}
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

      {cfg.modo !== 'numero' ? (
        <div>
          <WidgetSectionTitle>Presentación</WidgetSectionTitle>
          <div className="space-y-4 pt-2">
            <ToggleGroup
              type="single"
              value={cfg.variante}
              onValueChange={(val: ContadorVariante) => {
                if (val) updateT10({ variante: val });
              }}
              className="w-full justify-start rounded-md bg-slate-100/50 p-1"
            >
              {CONTADOR_VARIANTES.map((v) => (
                <ToggleGroupItem key={v.id} value={v.id} className="h-8 flex-1 text-[11px]">
                  {v.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {cfg.modo === 'temporizador' ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contador-semaforo"
                  checked={cfg.semaforo}
                  onCheckedChange={(v) => updateT10({ semaforo: v === true })}
                />
                <Label htmlFor="contador-semaforo" className="text-xs">
                  Semáforo (verde → amarillo → rojo)
                </Label>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {cfg.modo !== 'numero' ? (
        <div>
          <WidgetSectionTitle>Hitos y avisos</WidgetSectionTitle>
          <div className="space-y-3 pt-2">
            <p className="text-[11px] text-muted-foreground">
              {cfg.modo === 'temporizador'
                ? 'Avisan cuando quedan esos segundos.'
                : 'Avisan cuando han pasado esos segundos.'}
            </p>
            {hitos.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={359999}
                  aria-label={`Segundos del hito ${i + 1}`}
                  value={h.segundos}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (Number.isFinite(n) && n > 0) setHito(i, { segundos: n });
                  }}
                  className="h-8 w-20 text-xs"
                />
                <WidgetDraftTextField
                  value={h.etiqueta}
                  onChange={(etiqueta) => setHito(i, { etiqueta })}
                  placeholder="Etiqueta"
                  className="h-8 flex-1 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={`Quitar hito ${i + 1}`}
                  onClick={() => updateT10({ hitos: hitos.filter((_, k) => k !== i) })}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            {hitos.length < CONTADOR_MAX_HITOS ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  updateT10({
                    hitos: [
                      ...hitos,
                      { segundos: Math.max(1, Math.round(cfg.segundos / 2)), etiqueta: '' },
                    ],
                  })
                }
              >
                <Plus className="mr-1 size-3.5" /> Agregar hito
              </Button>
            ) : null}
            <div className="space-y-2">
              <Label className="text-xs">Aviso</Label>
              <ToggleGroup
                type="single"
                value={cfg.hitosAlerta}
                onValueChange={(val: ContadorHitosAlerta) => {
                  if (val) updateT10({ hitosAlerta: val });
                }}
                className="w-full justify-start rounded-md bg-slate-100/50 p-1"
              >
                {CONTADOR_ALERTAS.map((a) => (
                  <ToggleGroupItem key={a.id} value={a.id} className="h-8 flex-1 text-[11px]">
                    {a.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-[11px] text-muted-foreground">
                «Sonora» también suena al terminar el tiempo. El navegador puede silenciar el
                sonido hasta que el alumno toque la página.
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
