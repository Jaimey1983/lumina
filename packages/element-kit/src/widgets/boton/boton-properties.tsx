'use client';

import { PresetGallery, aplicarPreset } from '@lumina/editor-shared/preset-gallery';
import { presetsDelWidget } from '../widget-presets.js';
import type { Block } from '@lumina/types/slide';
import type { BotonForma, BotonTamano, BotonVariante, BotonWidget } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';
import { Button } from '@lumina/ui/button';
import { Checkbox } from '@lumina/ui/checkbox';
import { Input } from '@lumina/ui/input';
import { WidgetDraftTextField } from '@lumina/editor-shared/panel-only-field';
import { Label } from '@lumina/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@lumina/ui/toggle-group';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';
import {
  BOTON_DENSIDADES,
  BOTON_ESTILOS,
  BOTON_VARIANTES,
  botonFallbackSize,
  mergedBotonConfig,
  normalizeBotonWidget,
  type BotonAccionT8,
  type BotonDensidad,
  type BotonEstilo,
  type BotonIconoPosicion,
  type BotonWidgetT8,
} from './boton-config.js';
import { BOTON_ICONOS, type BotonIconoId } from './boton-iconos.js';

export interface BotonPropertiesProps {
  block: BotonWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

const ETIQUETA_ACCION_HEREDADA: Partial<Record<BotonAccionT8, string>> = {
  siguiente: 'ir al siguiente slide',
  anterior: 'volver al slide anterior',
  ir_a: 'ir a un slide',
};

export function BotonProperties({ block: rawBlock, applyNow }: BotonPropertiesProps) {
  const block = normalizeBotonWidget(rawBlock);
  const cfg = mergedBotonConfig(block);
  const accionHeredada =
    cfg.accion === 'siguiente' || cfg.accion === 'anterior' || cfg.accion === 'ir_a';

  const update = (fn: (w: BotonWidgetT8) => BotonWidgetT8) => {
    void applyNow((b) =>
      b.tipo === 'boton' ? (fn(normalizeBotonWidget(b) as BotonWidgetT8) as BotonWidget) : b,
    );
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
      <PresetGallery
        presets={presetsDelWidget('boton')}
        estado={block}
        storageKey="widget.boton.estilos"
        onSelect={(preset) =>
          void applyNow((b) =>
            b.tipo === 'boton' ? aplicarPreset(normalizeBotonWidget(b), preset) : b,
          )
        }
      />
      <div>
        <WidgetSectionTitle>Contenido</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs">Texto del botón</Label>
            <WidgetDraftTextField
              value={cfg.texto}
              onChange={(next) => update((w) => ({ ...w, texto: next }))}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Estilo</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Color</Label>
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

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Aspecto</Label>
            <ToggleGroup
              type="single"
              value={cfg.estilo}
              onValueChange={(val: BotonEstilo) => {
                if (val) update((w) => ({ ...w, estilo: val, outline: val === 'outline' }));
              }}
              className="flex w-full flex-wrap justify-start gap-1 rounded-md bg-slate-100/50 p-1"
            >
              {BOTON_ESTILOS.map(({ id, label }) => (
                <ToggleGroupItem key={id} value={id} className="h-8 flex-1 text-xs">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Densidad</Label>
            <ToggleGroup
              type="single"
              value={cfg.densidad}
              onValueChange={(val: BotonDensidad) => {
                if (val) update((w) => ({ ...w, densidad: val }));
              }}
              className="w-full justify-start rounded-md bg-slate-100/50 p-1"
            >
              {BOTON_DENSIDADES.map(({ id, label }) => (
                <ToggleGroupItem key={id} value={id} className="h-8 flex-1 text-xs">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Icono</Label>
            <select
              aria-label="Icono del botón"
              value={cfg.icono ?? ''}
              onChange={(e) =>
                update((w) => ({ ...w, icono: (e.target.value || undefined) as BotonIconoId | undefined }))
              }
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="">Sin icono</option>
              {Object.entries(BOTON_ICONOS).map(([id, { label }]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            {cfg.icono ? (
              <ToggleGroup
                type="single"
                value={cfg.iconoPosicion}
                onValueChange={(val: BotonIconoPosicion) => {
                  if (val) update((w) => ({ ...w, iconoPosicion: val }));
                }}
                className="w-full justify-start rounded-md bg-slate-100/50 p-1"
              >
                <ToggleGroupItem value="izquierda" className="h-8 flex-1 text-xs">
                  A la izquierda
                </ToggleGroupItem>
                <ToggleGroupItem value="derecha" className="h-8 flex-1 text-xs">
                  A la derecha
                </ToggleGroupItem>
              </ToggleGroup>
            ) : null}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="boton-cargando"
              checked={cfg.cargando}
              onCheckedChange={(checked) => update((w) => ({ ...w, cargando: !!checked }))}
            />
            <Label htmlFor="boton-cargando" className="text-xs font-normal">
              Mostrar «cargando»
            </Label>
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Acción</WidgetSectionTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Al hacer clic</Label>
            {/* K7b: el editor ya no ESCRIBE navegación en `accion` (siguiente / anterior /
                ir_a): eso es una regla del motor («Interacciones»). Se conserva `url`,
                que el catálogo cerrado de acciones del motor no tiene. La lectura de
                `accion` legada sigue viva (D6). */}
            <ToggleGroup
              type="single"
              value={accionHeredada ? '' : cfg.accion}
              onValueChange={(val: BotonAccionT8) => {
                if (val) update((w) => ({ ...w, accion: val }));
              }}
              className="flex w-full flex-wrap justify-start gap-1 rounded-md bg-slate-100/50 p-1"
            >
              <ToggleGroupItem value="url" className="h-8 flex-1 text-xs">
                Abrir URL
              </ToggleGroupItem>
              <ToggleGroupItem value="descargar" className="h-8 flex-1 text-xs">
                Descargar
              </ToggleGroupItem>
              <ToggleGroupItem value="ninguna" className="h-8 flex-1 text-xs">
                Ninguna
              </ToggleGroupItem>
            </ToggleGroup>
            {accionHeredada ? (
              <div className="space-y-2 rounded-md border border-border bg-muted/40 p-2">
                <p className="text-[11px] text-muted-foreground">
                  Acción heredada: <strong>{ETIQUETA_ACCION_HEREDADA[cfg.accion]}</strong>. Se
                  mantiene tal cual. Para cambiarla, quítala y configura una interacción más abajo.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => update((w) => ({ ...w, accion: 'ninguna' }))}
                >
                  Quitar acción heredada
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Para llevar al alumno a otro slide usa «Interacciones» más abajo.
              </p>
            )}
          </div>

          {cfg.accion === 'url' || cfg.accion === 'descargar' ? (
            <div className="space-y-2">
              <Label className="text-xs">{cfg.accion === 'descargar' ? 'URL del archivo' : 'URL'}</Label>
              <WidgetDraftTextField
                value={cfg.url}
                placeholder="https://…"
                onChange={(next) => update((w) => ({ ...w, url: next }))}
                className="h-8 text-xs"
              />
            </div>
          ) : null}

          {cfg.accion === 'descargar' ? (
            <div className="space-y-2">
              <Label className="text-xs">Nombre del archivo (opcional)</Label>
              <WidgetDraftTextField
                value={cfg.archivoNombre}
                placeholder="guia.pdf"
                onChange={(next) => update((w) => ({ ...w, archivoNombre: next }))}
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
