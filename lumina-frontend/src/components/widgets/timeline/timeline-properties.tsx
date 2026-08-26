'use client';

import type { Block } from '@/types/slide.types';
import type { TimelineWidget } from '@/types/widget.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';

import type { TimelineDisposicionNodos, TimelineVariante } from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { normalizeTimelineWidget, resizeTimelineNodos, type TimelineInnerSelection } from './timeline-config';
import { TIMELINE_LUCIDE_OPTIONS, TimelineLucideIcon } from './timeline-icon-catalog';
import { TIMELINE_VARIANTES, timelineUsesLucideDot } from './timeline-variant-meta';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';

function PanelSectionDivider() {
  return <div className="border-t border-border" role="separator" aria-hidden />;
}

/** Botón de opción (variante / disposición) con estado activo visible. */
function timelineOptionButtonClass(selected: boolean, extra?: string) {
  return cn(
    extra,
    selected &&
      'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground',
  );
}

export interface TimelineWidgetComponentesProps {
  block: TimelineWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TimelineWidgetComponentes({
  block: rawBlock,
  applyNow,
}: TimelineWidgetComponentesProps) {
  const block = normalizeTimelineWidget(rawBlock);
  const configuracion = block.configuracion;

  const update = (fn: (w: TimelineWidget) => TimelineWidget) => {
    void applyNow((b) => (b.tipo === 'timeline' ? fn(normalizeTimelineWidget(b as TimelineWidget)) : b));
  };

  const setGlobalToggle = (
    key:
      | 'mostrarTituloWidget'
      | 'mostrarSubtitulo'
      | 'mostrarInstruccion'
      | 'mostrarConectorVertical',
    value: boolean,
  ) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, [key]: value },
    }));
  };

  const setNumeroNodos = (count: number) => {
    update((w) => {
      const resized = resizeTimelineNodos(w.nodos, count, w);
      return {
        ...w,
        configuracion: { ...w.configuracion, numeroNodos: count },
        nodos: resized,
      };
    });
  };

  const updateConfig = (patch: Partial<typeof configuracion>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <WidgetSectionTitle>Estilo de línea de tiempo</WidgetSectionTitle>
        <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
          {TIMELINE_VARIANTES.map((v) => (
            <Button
              key={v.id}
              type="button"
              size="sm"
              variant="outline"
              className={timelineOptionButtonClass(
                configuracion.variante === v.id,
                'h-auto min-h-9 w-full whitespace-normal px-2 py-2 text-left',
              )}
              title={v.description}
              onClick={() => {
                const variante = v.id as TimelineVariante;
                update((w) => ({
                  ...w,
                  configuracion: { ...w.configuracion, variante },
                  nodos: w.nodos.map((n) => ({
                    ...n,
                    mostrarIconoLucide: timelineUsesLucideDot(variante) ? true : n.mostrarIconoLucide,
                    mostrarNumeroPaso: variante === 'proyecto' ? true : n.mostrarNumeroPaso,
                    mostrarTituloNodo:
                      variante === 'vertical' ||
                      variante === 'corporate' ||
                      variante === 'proyecto' ||
                      variante === 'infografica' ||
                      variante === 'segmentada'
                        ? true
                        : n.mostrarTituloNodo,
                    mostrarEtiqueta: variante === 'segmentada' ? false : n.mostrarEtiqueta,
                  })),
                }));
              }}
            >
              <span className="block w-full text-[11px] font-medium leading-snug break-words">
                {v.label}
              </span>
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {TIMELINE_VARIANTES.find((v) => v.id === configuracion.variante)?.description}
        </p>
      </div>

      <PanelSectionDivider />

      <div className="space-y-2 pt-4">
        <WidgetSectionTitle>Disposición</WidgetSectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['alternado', 'Alternado'],
              ['arriba', 'Todo arriba'],
              ['abajo', 'Todo abajo'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="outline"
              className={timelineOptionButtonClass(
                configuracion.disposicionNodos === id,
                'h-7 text-xs',
              )}
              onClick={() => updateConfig({ disposicionNodos: id as TimelineDisposicionNodos })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <PanelSectionDivider />

      <div className="space-y-2 pt-4">
        <WidgetSectionTitle>Configuración</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs">Número de nodos: {configuracion.numeroNodos}</Label>
          <Slider
            min={2}
            max={8}
            step={1}
            value={[configuracion.numeroNodos]}
            onValueChange={([v]) => setNumeroNodos(v)}
          >
            <SliderThumb />
          </Slider>
        </div>
      </div>

      <PanelSectionDivider />

      <div className="space-y-2 pt-4">
        <WidgetSectionTitle>Componentes</WidgetSectionTitle>
        {(
          [
            ['mostrarTituloWidget', 'Título'],
            ['mostrarSubtitulo', 'Descripción'],
            ['mostrarInstruccion', 'Instrucción'],
            ['mostrarConectorVertical', 'Conector vertical'],
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

      <PanelSectionDivider />

      <div className="space-y-2 pt-4">
        <WidgetSectionTitle>Dimensiones rápidas</WidgetSectionTitle>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Grosor de línea</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{configuracion.grosorLinea}px</span>
          </div>
          <Slider min={1} max={10} step={1} value={[configuracion.grosorLinea]} onValueChange={([v]) => updateConfig({ grosorLinea: v })}>
            <SliderThumb />
          </Slider>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Radio del nodo</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{configuracion.radioNodo}px</span>
          </div>
          <Slider min={4} max={24} step={1} value={[configuracion.radioNodo]} onValueChange={([v]) => updateConfig({ radioNodo: v })}>
            <SliderThumb />
          </Slider>
        </div>
      </div>
    </div>
  );
}

export interface TimelineNodoPropertiesProps {
  block: TimelineWidget;
  nodoIndex: number;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TimelineNodoProperties({
  block: rawBlock,
  nodoIndex,
  applyNow,
}: TimelineNodoPropertiesProps) {
  const block = normalizeTimelineWidget(rawBlock);
  const nodo = block.nodos[nodoIndex];
  const variante = block.configuracion.variante;
  if (!nodo) return null;

  const updateNodo = (patch: Partial<typeof nodo>) => {
    void applyNow((b) => {
      if (b.tipo !== 'timeline') return b;
      const w = normalizeTimelineWidget(b as TimelineWidget);
      return {
        ...w,
        nodos: w.nodos.map((n, i) => (i === nodoIndex ? { ...n, ...patch } : n)),
      };
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <WidgetSectionTitle>Nodo {nodoIndex + 1}</WidgetSectionTitle>
      <p className="text-[10px] text-muted-foreground">
        Configura el contenido y visibilidad de este nodo.
      </p>

      {variante !== 'proyecto' && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={nodo.mostrarEtiqueta}
            onCheckedChange={(checked) => updateNodo({ mostrarEtiqueta: checked === true })}
          />
          {variante === 'vertical' ? 'Año (vertical)' : 'Etiqueta / año'}
        </label>
      )}
      {variante === 'proyecto' && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={nodo.mostrarNumeroPaso ?? false}
            onCheckedChange={(checked) => updateNodo({ mostrarNumeroPaso: checked === true })}
          />
          Número de paso
        </label>
      )}
      {(variante === 'vertical' ||
        variante === 'corporate' ||
        variante === 'proyecto' ||
        variante === 'infografica') && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={nodo.mostrarTituloNodo ?? false}
            onCheckedChange={(checked) => updateNodo({ mostrarTituloNodo: checked === true })}
          />
          Título del evento
        </label>
      )}
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={nodo.mostrarCuerpo}
          onCheckedChange={(checked) => updateNodo({ mostrarCuerpo: checked === true })}
        />
        Descripción
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={nodo.mostrarImagen}
          onCheckedChange={(checked) => updateNodo({ mostrarImagen: checked === true })}
        />
        {variante === 'proyecto'
          ? 'Foto circular'
          : variante === 'iconos' || variante === 'infografica'
            ? 'Imagen en nodo'
            : 'Imagen'}
      </label>
      {timelineUsesLucideDot(variante) && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={nodo.mostrarIconoLucide ?? false}
            onCheckedChange={(checked) => updateNodo({ mostrarIconoLucide: checked === true })}
          />
          Icono Lucide
        </label>
      )}

      {variante === 'proyecto' ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Número de paso</Label>
          <WidgetDraftTextField
            className="h-8 text-xs"
            value={nodo.numeroPaso ?? ''}
            placeholder="01"
            onChange={(next) => updateNodo({ numeroPaso: next })}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">{variante === 'vertical' ? 'Año' : 'Etiqueta'}</Label>
          <WidgetDraftTextField
            className="h-8 text-xs"
            value={nodo.etiqueta}
            placeholder="Ej: 2024"
            onChange={(next) => updateNodo({ etiqueta: next })}
          />
        </div>
      )}

      {(variante === 'vertical' ||
        variante === 'corporate' ||
        variante === 'proyecto' ||
        variante === 'infografica') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Título del evento</Label>
          <WidgetDraftTextField
            className="h-8 text-xs"
            value={nodo.tituloNodo ?? ''}
            placeholder="Ej: Lanzamiento"
            onChange={(next) => updateNodo({ tituloNodo: next })}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Descripción</Label>
        <WidgetDraftTextField
          className="h-8 text-xs"
          value={nodo.cuerpo}
          onChange={(next) => updateNodo({ cuerpo: next })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">URL imagen</Label>
        <WidgetDraftTextField
          className="h-8 text-xs"
          value={nodo.imagen ?? ''}
          placeholder="https://…"
          onChange={(next) => updateNodo({ imagen: next || undefined })}
        />
      </div>

      {timelineUsesLucideDot(variante) && (nodo.mostrarIconoLucide ?? false) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Icono</Label>
          <div className="grid grid-cols-4 gap-1">
            {TIMELINE_LUCIDE_OPTIONS.filter((o) => o.id !== 'none').map((opt) => (
              <Button
                key={opt.id}
                type="button"
                size="sm"
                variant="outline"
                className={timelineOptionButtonClass(nodo.iconoLucide === opt.id, 'h-8 px-0')}
                title={opt.label}
                onClick={() => updateNodo({ iconoLucide: opt.id })}
              >
                <TimelineLucideIcon name={opt.id} size={16} />
              </Button>
            ))}
          </div>
        </div>
      )}

      {variante !== 'tarjetas' && variante !== 'minimal' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Color de acento</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            value={nodo.colorAccent ?? '#3B82F6'}
            onChange={(e) => updateNodo({ colorAccent: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

export function getTimelinePanelNodoIndex(
  inner: TimelineInnerSelection | null | undefined,
): number | null {
  if (!inner) return null;
  if (inner.kind === 'nodo') return inner.index;
  if (inner.kind === 'texto' || inner.kind === 'imagen') return inner.nodoIndex;
  return null;
}
