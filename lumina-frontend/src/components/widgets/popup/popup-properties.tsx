'use client';



import type { Block, PopupWidget } from '@/types/slide.types';

import type {

  PopupEfectoApertura,

  PopupForma,

  PopupInnerSelection,

  PopupTriggerEvento,

  PopupTriggerTamano,

  PopupTriggerVisual,

  WidgetLayoutId,

} from '@/types/widget.types';

import { Checkbox } from '@/components/ui/checkbox';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { resolveSlideLayoutId, WIDGET_LAYOUTS } from '@/components/widgets/shared/widget-layouts';

import { WidgetLayoutThumb } from '@/components/widgets/shared/widget-layout-thumb';

import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';

import {

  WidgetSlideImageInnerProperties,

  WidgetSlideTextInnerProperties,

} from '@/components/widgets/shared/widget-inner-properties';

import { cn } from '@/lib/utils';



import {
  mergedPopupConfig,
  normalizePopupWidget,
} from './popup-config';
import { syncPopupBlockSizeFromTriggerPx } from '@/lib/popup-defaults';
import { POPUP_TRIGGER_PX_MAX, POPUP_TRIGGER_PX_MIN } from '@/lib/popup-trigger-size';

import { POPUP_TRIGGER_ICONS, popupTriggerVisualLabel } from './popup-parts';



const POPUP_CONTENT_LAYOUTS = WIDGET_LAYOUTS.filter(

  (l) =>

    l.id === 'imagen-izq-texto-der' ||

    l.id === 'texto-izq-imagen-der' ||

    l.id === 'solo-texto',

);



export interface PopupWidgetComponentesProps {

  block: PopupWidget;

  applyNow: (fn: (b: Block) => Block) => Promise<void>;

}



export function PopupWidgetComponentes({ block: rawBlock, applyNow }: PopupWidgetComponentesProps) {

  const block = normalizePopupWidget(rawBlock);

  const configuracion = mergedPopupConfig(block);

  const visual = configuracion.triggerVisual;



  const update = (fn: (w: PopupWidget) => PopupWidget) => {

    void applyNow((b) => (b.tipo === 'popup' ? fn(normalizePopupWidget(b)) : b));

  };



  const patchConfig = (patch: Partial<typeof configuracion>) => {

    update((w) => ({

      ...w,

      configuracion: { ...w.configuracion, ...patch },

    }));

  };



  const visuals: PopupTriggerVisual[] = ['boton', 'icono', 'imagen', 'texto'];

  const formas: PopupForma[] = ['pill', 'redondo', 'cuadrado'];

  const tamanos: PopupTriggerTamano[] = ['pequeno', 'mediano', 'grande'];

  const eventos: PopupTriggerEvento[] = ['click', 'hover', 'auto'];

  const efectos: PopupEfectoApertura[] = ['fade', 'instant', 'slide-up'];



  return (

    <div className="flex flex-col gap-4">

      <div className="space-y-2">

        <WidgetSectionTitle>Disparador</WidgetSectionTitle>

        <p className="text-[10px] leading-snug text-muted-foreground">

          Tamaño base 48×48 px. Ajusta con el control o arrastrando las esquinas del bloque en el lienzo.

        </p>

        {(visual === 'icono' || visual === 'boton' || visual === 'imagen') ? (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Tamaño del disparador (
              {visual === 'icono'
                ? `${configuracion.triggerAnchoPx ?? 48} px`
                : `${configuracion.triggerAnchoPx ?? 48} × ${configuracion.triggerAltoPx ?? 48} px`}
              )
            </Label>
            <Input
              type="range"
              min={POPUP_TRIGGER_PX_MIN}
              max={POPUP_TRIGGER_PX_MAX}
              value={configuracion.triggerAnchoPx ?? 48}
              onChange={(e) => {
                const px = Number(e.target.value);
                update((w) =>
                  syncPopupBlockSizeFromTriggerPx({
                    ...w,
                    configuracion: {
                      ...w.configuracion,
                      triggerAnchoPx: px,
                      triggerAltoPx: visual === 'icono' ? px : (w.configuracion.triggerAltoPx ?? px),
                    },
                  }),
                );
              }}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">

          <Label className="text-xs">Tipo visual</Label>

          <ToggleGroup

            type="single"

            value={visual}

            onValueChange={(v) => v && patchConfig({ triggerVisual: v as PopupTriggerVisual })}

            className="flex flex-wrap justify-start gap-1"

          >

            {visuals.map((v) => (

              <ToggleGroupItem key={v} value={v} className="h-7 px-2 text-[10px]">

                {popupTriggerVisualLabel(v)}

              </ToggleGroupItem>

            ))}

          </ToggleGroup>

        </div>



        {visual === 'boton' && (

          <>

            <div className="space-y-1.5">

              <Label className="text-xs">Texto del botón</Label>

              <WidgetDraftTextField

                className="h-8 text-xs"

                value={configuracion.triggerTexto ?? ''}

                onChange={(next) => patchConfig({ triggerTexto: next })}

              />

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Color de fondo</Label>

              <Input

                type="color"

                className="h-9 w-full cursor-pointer p-1"

                value={configuracion.triggerColorFondo}

                onChange={(e) => patchConfig({ triggerColorFondo: e.target.value })}

              />

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Forma</Label>

              <ToggleGroup

                type="single"

                value={configuracion.triggerForma}

                onValueChange={(v) => v && patchConfig({ triggerForma: v as PopupForma })}

                className="flex flex-wrap justify-start gap-1"

              >

                {formas.map((f) => (

                  <ToggleGroupItem key={f} value={f} className="h-7 px-2 text-[10px] capitalize">

                    {f}

                  </ToggleGroupItem>

                ))}

              </ToggleGroup>

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Color de texto</Label>

              <Input

                type="color"

                className="h-9 w-full cursor-pointer p-1"

                value={configuracion.triggerColorTexto}

                onChange={(e) => patchConfig({ triggerColorTexto: e.target.value })}

              />

            </div>

          </>

        )}



        {visual === 'icono' && (

          <>

            <div className="space-y-1.5">

              <Label className="text-xs">Ícono</Label>

              <div className="grid grid-cols-5 gap-1.5">

                {POPUP_TRIGGER_ICONS.map(({ id, Icon, label }) => {

                  const selected = (configuracion.triggerIcono ?? 'info') === id;

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

                      onClick={() => patchConfig({ triggerIcono: id })}

                    >

                      <Icon className="size-4" aria-hidden />

                    </button>

                  );

                })}

              </div>

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Color de ícono</Label>

              <Input

                type="color"

                className="h-9 w-full cursor-pointer p-1"

                value={configuracion.triggerColorTexto}

                onChange={(e) => patchConfig({ triggerColorTexto: e.target.value })}

              />

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Color de fondo</Label>

              <Input

                type="color"

                className="h-9 w-full cursor-pointer p-1"

                value={configuracion.triggerColorFondo}

                onChange={(e) => patchConfig({ triggerColorFondo: e.target.value })}

              />

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Proporción del ícono</Label>

              <p className="text-[10px] leading-snug text-muted-foreground">

                Tamaño del glifo dentro del círculo (el área total se ajusta con el slider o las esquinas del bloque).

              </p>

              <ToggleGroup

                type="single"

                value={configuracion.triggerTamano ?? 'mediano'}

                onValueChange={(v) => v && patchConfig({ triggerTamano: v as PopupTriggerTamano })}

                className="flex flex-wrap justify-start gap-1"

              >

                {tamanos.map((t) => (

                  <ToggleGroupItem key={t} value={t} className="h-7 px-2 text-[10px] capitalize">

                    {t === 'pequeno' ? 'Pequeño' : t === 'grande' ? 'Grande' : 'Mediano'}

                  </ToggleGroupItem>

                ))}

              </ToggleGroup>

            </div>

          </>

        )}



        {visual === 'imagen' && (

          <>

            <div className="space-y-1.5">

              <Label className="text-xs">URL imagen del trigger</Label>

              <WidgetDraftTextField

                className="h-8 text-xs"

                value={configuracion.triggerImagen ?? ''}

                placeholder="https://…"

                onChange={(next) => patchConfig({ triggerImagen: next || undefined })}

              />

            </div>

            <div className="grid grid-cols-2 gap-2">

              <div className="space-y-1.5">

                <Label className="text-xs">Ancho (px)</Label>

                <Input

                  type="number"

                  min={16}

                  max={400}

                  className="h-8 text-xs"

                  value={configuracion.triggerImagenAncho ?? 48}

                  onChange={(e) =>

                    patchConfig({ triggerImagenAncho: Math.max(16, Number(e.target.value) || 48) })

                  }

                />

              </div>

              <div className="space-y-1.5">

                <Label className="text-xs">Alto (px)</Label>

                <Input

                  type="number"

                  min={16}

                  max={400}

                  className="h-8 text-xs"

                  value={configuracion.triggerImagenAlto ?? 48}

                  onChange={(e) =>

                    patchConfig({ triggerImagenAlto: Math.max(16, Number(e.target.value) || 48) })

                  }

                />

              </div>

            </div>

          </>

        )}



        {visual === 'texto' && (

          <>

            <div className="space-y-1.5">

              <Label className="text-xs">Texto del enlace</Label>

              <WidgetDraftTextField

                className="h-8 text-xs"

                value={configuracion.triggerTexto ?? ''}

                onChange={(next) => patchConfig({ triggerTexto: next })}

              />

            </div>

            <div className="space-y-1.5">

              <Label className="text-xs">Color de texto</Label>

              <Input

                type="color"

                className="h-9 w-full cursor-pointer p-1"

                value={configuracion.triggerColorTexto}

                onChange={(e) => patchConfig({ triggerColorTexto: e.target.value })}

              />

            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs">

              <Checkbox

                checked={configuracion.triggerSubrayado !== false}

                onCheckedChange={(checked) => patchConfig({ triggerSubrayado: checked === true })}

              />

              Subrayado

            </label>

          </>

        )}



        <div className="space-y-1.5">

          <Label className="text-xs">Evento de apertura</Label>

          <ToggleGroup

            type="single"

            value={configuracion.triggerEvento}

            onValueChange={(v) => v && patchConfig({ triggerEvento: v as PopupTriggerEvento })}

            className="flex flex-wrap justify-start gap-1"

          >

            {eventos.map((ev) => (

              <ToggleGroupItem key={ev} value={ev} className="h-7 px-2 text-[10px] capitalize">

                {ev}

              </ToggleGroupItem>

            ))}

          </ToggleGroup>

        </div>

      </div>



      <div className="space-y-2">

        <WidgetSectionTitle>Apariencia del modal</WidgetSectionTitle>

        <div className="space-y-1.5">

          <Label className="text-xs">Efecto de apertura</Label>

          <ToggleGroup

            type="single"

            value={configuracion.efectoApertura}

            onValueChange={(v) => v && patchConfig({ efectoApertura: v as PopupEfectoApertura })}

            className="flex flex-wrap justify-start gap-1"

          >

            {efectos.map((ef) => (

              <ToggleGroupItem key={ef} value={ef} className="h-7 px-2 text-[10px]">

                {ef}

              </ToggleGroupItem>

            ))}

          </ToggleGroup>

        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs">

          <Checkbox

            checked={configuracion.mostrarBotonCerrar}

            onCheckedChange={(checked) => patchConfig({ mostrarBotonCerrar: checked === true })}

          />

          Botón cerrar

        </label>

        <div className="space-y-1.5">

          <Label className="text-xs">Ancho ventana ({configuracion.modalAnchoPct ?? 55}%)</Label>

          <Input

            type="range"

            min={25}

            max={96}

            value={configuracion.modalAnchoPct ?? 55}

            onChange={(e) => patchConfig({ modalAnchoPct: Number(e.target.value) })}

          />

        </div>

        <div className="space-y-1.5">

          <Label className="text-xs">Alto ventana ({configuracion.modalAltoPct ?? 62}%)</Label>

          <Input

            type="range"

            min={20}

            max={92}

            value={configuracion.modalAltoPct ?? 62}

            onChange={(e) => patchConfig({ modalAltoPct: Number(e.target.value) })}

          />

        </div>

        <p className="text-[10px] text-muted-foreground">

          Abre el lápiz sobre el bloque o usa el botón del toolbar flotante para editar el contenido. Arrastra las esquinas del modal para cambiar el tamaño de la ventana.

        </p>

        <div className="space-y-1.5">

          <Label className="text-xs">Color fondo modal</Label>

          <Input

            type="color"

            className="h-9 w-full cursor-pointer p-1"

            value={configuracion.colorFondoModal}

            onChange={(e) => patchConfig({ colorFondoModal: e.target.value })}

          />

        </div>

        <div className="space-y-1.5">

          <Label className="text-xs">Color backdrop</Label>

          <Input

            type="color"

            className="h-9 w-full cursor-pointer p-1"

            value={configuracion.colorBackdrop}

            onChange={(e) => patchConfig({ colorBackdrop: e.target.value })}

          />

        </div>

        <div className="space-y-1.5">

          <Label className="text-xs">Opacidad backdrop ({configuracion.opacidadBackdrop}%)</Label>

          <Input

            type="range"

            min={0}

            max={100}

            value={configuracion.opacidadBackdrop}

            onChange={(e) => patchConfig({ opacidadBackdrop: Number(e.target.value) })}

          />

        </div>

      </div>

    </div>

  );

}



export interface PopupOverlayPropertiesProps {

  block: PopupWidget;

  applyNow: (fn: (b: Block) => Block) => Promise<void>;

}



export function PopupOverlayProperties({ block: rawBlock, applyNow }: PopupOverlayPropertiesProps) {

  const block = normalizePopupWidget(rawBlock);

  const configuracion = mergedPopupConfig(block);

  const overlay = block.overlay;

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

      if (b.tipo !== 'popup') return b;

      const w = normalizePopupWidget(b);

      return { ...w, overlay: { ...w.overlay, ...patch } };

    });

  };



  const overlayLayoutId = resolveSlideLayoutId(overlay, configuracion.layoutId);



  const handleLayoutSelect = (id: WidgetLayoutId) => {

    updateOverlay({

      layoutId: id,

      ...(id === 'solo-texto' ? { mostrarImagen: false } : {}),

    });

  };



  return (

    <div className="flex flex-col gap-3">

      <WidgetSectionTitle>Contenido del popup</WidgetSectionTitle>

      <p className="text-[10px] text-muted-foreground">

        Selecciona texto o imagen en el lienzo para editar estilos detallados.

      </p>



      <div className="space-y-2">

        <Label className="text-xs">Layout del contenido</Label>

        <div className="grid grid-cols-1 gap-2">

          {POPUP_CONTENT_LAYOUTS.map((layout) => {

            const selected = overlayLayoutId === layout.id;

            return (

              <button

                key={layout.id}

                type="button"

                title={layout.description}

                className={cn(

                  'flex items-center gap-2 overflow-hidden rounded-lg border text-left transition-colors',

                  'hover:border-primary/50 hover:bg-accent/40',

                  selected

                    ? 'border-primary ring-2 ring-primary/30 bg-accent/30'

                    : 'border-border bg-card',

                )}

                onClick={() => handleLayoutSelect(layout.id)}

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



      {(

        [

          ['mostrarEtiqueta', 'Etiqueta'],

          ['mostrarImagen', 'Imagen'],

          ['mostrarEncabezado', 'Título'],

          ['mostrarSubtitulo', 'Subtítulo'],

          ['mostrarCuerpo', 'Cuerpo'],

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



      {overlayLayoutId !== 'solo-texto' && (

        <div className="space-y-1.5">

          <Label className="text-xs">URL imagen del contenido</Label>

          <WidgetDraftTextField

            className="h-8 text-xs"

            value={overlay.imagen ?? ''}

            placeholder="https://…"

            onChange={(next) => updateOverlay({ imagen: next || undefined })}

          />

        </div>

      )}

    </div>

  );

}



export interface PopupInnerPropertiesProps {

  block: PopupWidget;

  selection: PopupInnerSelection;

  applyNow: (fn: (b: Block) => Block) => Promise<void>;

}



export function PopupTextInnerProperties({

  block: rawBlock,

  selection,

  applyNow,

}: PopupInnerPropertiesProps) {

  const block = normalizePopupWidget(rawBlock);



  const update = (fn: (w: PopupWidget) => PopupWidget) => {

    void applyNow((b) => (b.tipo === 'popup' ? fn(normalizePopupWidget(b)) : b));

  };



  if (selection.kind !== 'overlay-text') return null;



  const mappedSelection = {

    kind: 'slide-text' as const,

    slideId: block.overlay.id,

    field: selection.field,

  };



  return (

    <WidgetSlideTextInnerProperties

      selection={mappedSelection}

      context={{

        slides: [block.overlay],

        estilosHeader: block.estilosHeader,

        patchHeaderStyle: () => {},

        patchSlide: (_slideId, patch) => {

          update((w) => ({ ...w, overlay: { ...w.overlay, ...patch } }));

        },

      }}

    />

  );

}



export function PopupImageInnerProperties({

  block: rawBlock,

  selection,

  applyNow,

}: PopupInnerPropertiesProps) {

  const block = normalizePopupWidget(rawBlock);



  const update = (fn: (w: PopupWidget) => PopupWidget) => {

    void applyNow((b) => (b.tipo === 'popup' ? fn(normalizePopupWidget(b)) : b));

  };



  if (selection.kind !== 'overlay-image') return null;



  return (

    <WidgetSlideImageInnerProperties

      selection={{ kind: 'slide-image', slideId: block.overlay.id }}

      context={{

        slides: [block.overlay],

        estilosHeader: block.estilosHeader,

        patchHeaderStyle: () => {},

        patchSlide: (_slideId, patch) => {

          update((w) => ({ ...w, overlay: { ...w.overlay, ...patch } }));

        },

      }}

    />

  );

}



export function isPopupOverlaySelection(inner: PopupInnerSelection | null | undefined): boolean {

  return (

    inner?.kind === 'overlay' ||

    inner?.kind === 'overlay-text' ||

    inner?.kind === 'overlay-image'

  );

}


