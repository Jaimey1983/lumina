'use client';

import type {
  WidgetCampoEstilo,
  WidgetEstilosHeader,
  WidgetHeaderTextField,
  WidgetSlideContent,
  WidgetSlideInnerSelection,
} from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { WidgetDraftTextField } from '@/components/widgets/shared/panel-only-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { WidgetTypographyFields } from '@/components/editor/typography-inspector';
import {
  applyInlineStyleToWidgetSelection,
  getActiveWidgetTextEditor,
  sanitizeWidgetHtml,
} from '@/components/widgets/shared/widget-rich-text';
import { WidgetSectionTitle as SectionTitle } from '@/components/widgets/shared/widget-properties-panel';

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
  } else if (patch.underline !== undefined) {
    if (
      applyInlineStyleToWidgetSelection({
        textDecoration: patch.underline ? 'underline' : 'none',
      })
    ) {
      appliedInline = true;
    }
  }

  if (!appliedInline) return false;

  const active = getActiveWidgetTextEditor();
  if (!active) return true;

  const html = sanitizeWidgetHtml(active.getHtml());
  context.patchSlide(selection.slideId, { [selection.field]: html });
  return true;
}

export interface WidgetSlideInnerContext {
  slides: WidgetSlideContent[];
  estilosHeader?: WidgetEstilosHeader;
  getHeaderValue?: (field: WidgetHeaderTextField) => string;
  patchHeaderValue?: (field: WidgetHeaderTextField, value: string) => void;
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

    const headerValue = context.getHeaderValue?.(selection.field) ?? '';

    return (
      <div className="flex flex-col gap-4">
        <SectionTitle>Texto — {label}</SectionTitle>
        {context.patchHeaderValue ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Contenido</Label>
            <WidgetDraftTextField
              key={selection.field}
              className={
                selection.field === 'tituloWidget' ? 'h-8 text-xs' : 'min-h-[72px] text-xs'
              }
              value={headerValue}
              multiline={selection.field !== 'tituloWidget'}
              rows={3}
              placeholder={
                selection.field === 'tituloWidget'
                  ? 'Título del widget'
                  : selection.field === 'subtituloWidget'
                    ? 'Subtítulo'
                    : 'Instrucción'
              }
              onChange={(next) => context.patchHeaderValue!(selection.field, next)}
            />
          </div>
        ) : null}
        <WidgetTypographyFields
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

  const slideField = selection.field;
  const slideTextValue =
    slideField === 'encabezado'
      ? (slide.encabezado ?? '')
      : slideField === 'subtitulo'
        ? (slide.subtitulo ?? '')
        : (slide.cuerpo ?? '');

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
      <div className="space-y-1.5">
        <Label className="text-xs">Contenido</Label>
        <WidgetDraftTextField
          key={`${selection.slideId}-${slideField}`}
          className={slideField === 'cuerpo' ? 'min-h-[96px] text-xs' : 'h-8 text-xs'}
          value={slideTextValue}
          multiline={slideField === 'cuerpo'}
          rows={4}
          placeholder={
            slideField === 'cuerpo'
              ? 'Cuerpo de la ficha'
              : slideField === 'encabezado'
                ? 'Encabezado'
                : 'Subtítulo'
          }
          onChange={(next) =>
            context.patchSlide(selection.slideId, { [slideField]: next })
          }
        />
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        En layout «Texto sobre imagen», usa el asa azul en el lienzo para arrastrar el texto.
      </p>
      <WidgetTypographyFields
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
        defaultColor={
          selection.field === 'encabezado'
            ? '#0f172a'
            : selection.field === 'subtitulo'
              ? '#475569'
              : '#64748b'
        }
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
        <WidgetDraftTextField
          className="h-8 text-xs"
          placeholder="https://…"
          value={slide.imagen ?? ''}
          onChange={(next) => {
            const trimmed = next.trim();
            update({ imagen: trimmed || undefined });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Texto alternativo</Label>
        <WidgetDraftTextField
          className="h-8 text-xs"
          placeholder="Descripción de la imagen"
          value={slide.imagenAlt ?? ''}
          onChange={(next) => update({ imagenAlt: next || undefined })}
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
