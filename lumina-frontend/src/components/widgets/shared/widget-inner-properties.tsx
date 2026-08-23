'use client';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
} from 'lucide-react';

import type {
  WidgetCampoEstilo,
  WidgetEstilosHeader,
  WidgetHeaderTextField,
  WidgetSlideContent,
  WidgetSlideInnerSelection,
} from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { FONT_CATALOG, resolveFontFamily } from '@/lib/font-catalog';
import {
  applyInlineStyleToWidgetSelection,
  getActiveWidgetTextEditor,
  sanitizeWidgetHtml,
} from '@/components/widgets/shared/widget-rich-text';
import { WidgetSectionTitle as SectionTitle } from '@/components/widgets/shared/widget-properties-panel';

function AlignToggle({
  value,
  onChange,
}: {
  value: WidgetCampoEstilo['align'];
  onChange: (align: WidgetCampoEstilo['align']) => void;
}) {
  const current = value ?? 'left';
  return (
    <div className="flex gap-0.5">
      {(
        [
          ['left', AlignLeft],
          ['center', AlignCenter],
          ['right', AlignRight],
        ] as const
      ).map(([align, Icon]) => (
        <Toggle
          key={align}
          size="sm"
          pressed={current === align}
          aria-label={align}
          onPressedChange={() => onChange(align)}
        >
          <Icon className="size-3.5" />
        </Toggle>
      ))}
    </div>
  );
}

function patchStyleWithSelection(
  selection: { slideId: string; field: string },
  context: WidgetSlideInnerContext,
  patch: Partial<WidgetCampoEstilo>,
): boolean {
  let appliedInline = false;

  if (patch.color && applyInlineStyleToWidgetSelection({ color: patch.color })) {
    appliedInline = true;
  } else if (
    patch.fontSize &&
    applyInlineStyleToWidgetSelection({ fontSize: `${patch.fontSize}px` })
  ) {
    appliedInline = true;
  } else if (patch.fontWeight !== undefined) {
    const fw = patch.fontWeight === 'bold' || patch.fontWeight === 700 ? '700' : '400';
    if (applyInlineStyleToWidgetSelection({ fontWeight: fw })) appliedInline = true;
  } else if (patch.fontStyle && applyInlineStyleToWidgetSelection({ fontStyle: patch.fontStyle })) {
    appliedInline = true;
  }

  if (!appliedInline) return false;

  const active = getActiveWidgetTextEditor();
  if (!active) return true;

  const html = sanitizeWidgetHtml(active.getHtml());
  context.patchSlide(selection.slideId, { [selection.field]: html });
  return true;
}

function TextStyleFields({
  style,
  onPatch,
  sizeMax = 48,
  defaultSize = 16,
}: {
  style: WidgetCampoEstilo;
  onPatch: (patch: Partial<WidgetCampoEstilo>) => void;
  sizeMax?: number;
  defaultSize?: number;
}) {
  const fontValue = resolveFontFamily(style.fontFamily);

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Fuente</Label>
        <Select
          value={fontValue}
          onValueChange={(v) => onPatch({ fontFamily: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_CATALOG.map((f) => (
              <SelectItem key={f.familia} value={f.familia} className="text-xs">
                <span style={{ fontFamily: f.familia }}>{f.nombre}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tamaño (px)</Label>
        <Input
          type="number"
          min={10}
          max={sizeMax}
          className="h-8 text-xs"
          value={style.fontSize ?? defaultSize}
          onChange={(e) =>
            onPatch({
              fontSize: Math.min(
                sizeMax,
                Math.max(10, Number(e.target.value) || defaultSize),
              ),
            })
          }
        />
      </div>
      <div className="flex gap-1">
        <Toggle
          size="sm"
          pressed={style.fontWeight === 'bold' || style.fontWeight === 700}
          aria-label="Negrita"
          onPressedChange={(on) =>
            onPatch({ fontWeight: on ? 'bold' : 'normal' })
          }
        >
          <Bold className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={style.fontStyle === 'italic'}
          aria-label="Cursiva"
          onPressedChange={(on) =>
            onPatch({ fontStyle: on ? 'italic' : 'normal' })
          }
        >
          <Italic className="size-3.5" />
        </Toggle>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Interlineado</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {(style.lineHeight ?? 1.35).toFixed(2)}
          </span>
        </div>
        <Slider
          value={[Math.round((style.lineHeight ?? 1.35) * 100)]}
          min={100}
          max={200}
          step={5}
          onValueChange={([v]) => onPatch({ lineHeight: v / 100 })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <Input
          type="color"
          className="h-8 w-full cursor-pointer p-1"
          value={style.color ?? '#0f172a'}
          onChange={(e) => onPatch({ color: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Alineación</Label>
        <AlignToggle value={style.align} onChange={(align) => onPatch({ align })} />
      </div>
    </>
  );
}

export interface WidgetSlideInnerContext {
  slides: WidgetSlideContent[];
  estilosHeader?: WidgetEstilosHeader;
  patchHeaderStyle: (
    field: WidgetHeaderTextField,
    patch: Partial<WidgetCampoEstilo>,
  ) => void;
  patchSlide: (slideId: string, patch: Partial<WidgetSlideContent>) => void;
}

export interface WidgetSlideInnerPropertiesProps {
  context: WidgetSlideInnerContext;
  selection: WidgetSlideInnerSelection;
}

export function WidgetSlideTextInnerProperties({
  context,
  selection,
}: WidgetSlideInnerPropertiesProps) {
  if (selection.kind === 'header-text') {
    const style = context.estilosHeader?.[selection.field] ?? {};
    const label =
      selection.field === 'tituloWidget'
        ? 'Título'
        : selection.field === 'subtituloWidget'
          ? 'Subtítulo'
          : 'Instrucción';

    return (
      <div className="flex flex-col gap-4">
        <SectionTitle>Texto — {label}</SectionTitle>
        <TextStyleFields
          style={style}
          defaultSize={selection.field === 'tituloWidget' ? 20 : 14}
          sizeMax={selection.field === 'tituloWidget' ? 48 : 32}
          onPatch={(patch) => context.patchHeaderStyle(selection.field, patch)}
        />
      </div>
    );
  }

  if (selection.kind !== 'slide-text') return null;

  const slide = context.slides.find((f) => f.id === selection.slideId);
  if (!slide) return null;

  const styleKey =
    selection.field === 'encabezado'
      ? 'estiloEncabezado'
      : selection.field === 'subtitulo'
        ? 'estiloSubtitulo'
        : 'estiloCuerpo';
  const style = slide[styleKey] ?? {};
  const label =
    selection.field === 'encabezado'
      ? 'Encabezado'
      : selection.field === 'subtitulo'
        ? 'Subtítulo'
        : 'Cuerpo';

  const patchStyle = (patch: Partial<WidgetCampoEstilo>) => {
    if (
      patchStyleWithSelection(
        { slideId: selection.slideId, field: selection.field },
        context,
        patch,
      )
    ) {
      return;
    }
    const prev = slide[styleKey] ?? {};
    context.patchSlide(selection.slideId, {
      [styleKey]: { ...prev, ...patch },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Texto — {label}</SectionTitle>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Selecciona texto en el lienzo para aplicar color o tamaño solo a la selección. Sin
        selección, el estilo afecta a todo el campo. En layout «Texto sobre imagen», usa el asa
        azul para arrastrar el texto.
      </p>
      <TextStyleFields
        style={{
          ...style,
          color:
            style.color ??
            (selection.field === 'encabezado'
              ? '#0f172a'
              : selection.field === 'subtitulo'
                ? '#475569'
                : '#64748b'),
        }}
        defaultSize={
          selection.field === 'encabezado' ? 18 : selection.field === 'subtitulo' ? 14 : 13
        }
        sizeMax={32}
        onPatch={patchStyle}
      />
    </div>
  );
}

export function WidgetSlideImageInnerProperties({
  context,
  selection,
}: WidgetSlideInnerPropertiesProps) {
  if (selection.kind !== 'slide-image') return null;

  const slide = context.slides.find((f) => f.id === selection.slideId);
  if (!slide) return null;

  const update = (patch: Partial<WidgetSlideContent>) => {
    context.patchSlide(selection.slideId, patch);
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Imagen de ficha</SectionTitle>
      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input
          className="h-8 text-xs"
          placeholder="https://…"
          value={slide.imagen ?? ''}
          onChange={(e) => {
            const trimmed = e.target.value.trim();
            update({ imagen: trimmed || undefined });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Texto alternativo</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Descripción de la imagen"
          value={slide.imagenAlt ?? ''}
          onChange={(e) => update({ imagenAlt: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Ajuste</Label>
        <div className="flex gap-1">
          {(['cover', 'contain'] as const).map((fit) => (
            <Button
              key={fit}
              type="button"
              size="sm"
              variant={(slide.imagenObjectFit ?? 'cover') === fit ? 'secondary' : 'outline'}
              className="flex-1 text-xs capitalize"
              onClick={() => update({ imagenObjectFit: fit })}
            >
              {fit}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Posición</Label>
        <Select
          value={slide.imagenObjectPosition ?? 'center'}
          onValueChange={(v) => update({ imagenObjectPosition: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="center top" className="text-xs">
              Arriba
            </SelectItem>
            <SelectItem value="center center" className="text-xs">
              Centro
            </SelectItem>
            <SelectItem value="center bottom" className="text-xs">
              Abajo
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Zoom</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {slide.imagenEscala ?? 100}%
          </span>
        </div>
        <Slider
          value={[slide.imagenEscala ?? 100]}
          min={50}
          max={200}
          step={5}
          onValueChange={([v]) => update({ imagenEscala: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Desplazamiento X</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {slide.imagenOffsetX ?? 0}%
          </span>
        </div>
        <Slider
          value={[slide.imagenOffsetX ?? 0]}
          min={-40}
          max={40}
          step={1}
          onValueChange={([v]) => update({ imagenOffsetX: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Desplazamiento Y</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {slide.imagenOffsetY ?? 0}%
          </span>
        </div>
        <Slider
          value={[slide.imagenOffsetY ?? 0]}
          min={-40}
          max={40}
          step={1}
          onValueChange={([v]) => update({ imagenOffsetY: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        En el lienzo: arrastra la imagen seleccionada para moverla; usa la esquina inferior
        derecha para cambiar el zoom.
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Radio esquinas</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {slide.imagenRadio ?? 8}px
          </span>
        </div>
        <Slider
          value={[slide.imagenRadio ?? 8]}
          min={0}
          max={24}
          step={2}
          onValueChange={([v]) => update({ imagenRadio: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Opacidad</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {slide.imagenOpacidad ?? 100}%
          </span>
        </div>
        <Slider
          value={[slide.imagenOpacidad ?? 100]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => update({ imagenOpacidad: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={slide.imagenEscalaDeGrises === true}
          onCheckedChange={(checked) =>
            update({ imagenEscalaDeGrises: checked === true })
          }
        />
        Escala de grises
      </label>
    </div>
  );
}
