'use client';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
} from 'lucide-react';

import type {
  Block,
  FlipCardCara,
  FlipCardsCampoEstilo,
  FlipCardsWidget,
} from '@/types/slide.types';
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
import type {
  FlipCardsCaraLado,
  FlipCardsInnerSelection,
} from './flip-cards-config';
import { FLIP_CARDS_FONT_OPTIONS } from './flip-cards-text-styles';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function AlignToggle({
  value,
  onChange,
}: {
  value: FlipCardsCampoEstilo['align'];
  onChange: (align: FlipCardsCampoEstilo['align']) => void;
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

function TextStyleFields({
  style,
  onPatch,
  sizeMax = 48,
  defaultSize = 16,
}: {
  style: FlipCardsCampoEstilo;
  onPatch: (patch: Partial<FlipCardsCampoEstilo>) => void;
  sizeMax?: number;
  defaultSize?: number;
}) {
  const fontValue =
    FLIP_CARDS_FONT_OPTIONS.find((f) => f.value === style.fontFamily)?.value ??
    FLIP_CARDS_FONT_OPTIONS[0].value;

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
            {FLIP_CARDS_FONT_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value} className="text-xs">
                {f.label}
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
        <div className="flex items-center justify-between">
          <Label className="text-xs">Espaciado letras</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {style.letterSpacing ?? 0}px
          </span>
        </div>
        <Slider
          value={[style.letterSpacing ?? 0]}
          min={-1}
          max={8}
          step={0.5}
          onValueChange={([v]) => onPatch({ letterSpacing: v })}
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

function patchHeaderStyle(
  block: FlipCardsWidget,
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion',
  patch: Partial<FlipCardsCampoEstilo>,
): FlipCardsWidget {
  const prev = block.estilosHeader?.[field] ?? {};
  return {
    ...block,
    estilosHeader: {
      ...block.estilosHeader,
      [field]: { ...prev, ...patch },
    },
  };
}

function patchCardFace(
  block: FlipCardsWidget,
  cardId: string,
  face: FlipCardsCaraLado,
  patch: Partial<FlipCardCara>,
): FlipCardsWidget {
  return {
    ...block,
    tarjetas: block.tarjetas.map((c) => {
      if (c.id !== cardId) return c;
      if (face === 'frente') {
        return { ...c, frente: { ...c.frente, ...patch } };
      }
      return { ...c, reverso: { ...c.reverso, ...patch } };
    }),
  };
}

export interface FlipCardsInnerPropertiesProps {
  block: FlipCardsWidget;
  selection: FlipCardsInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function FlipCardsTextInnerProperties({
  block,
  selection,
  applyNow,
}: FlipCardsInnerPropertiesProps) {
  const update = (fn: (w: FlipCardsWidget) => FlipCardsWidget) => {
    void applyNow((b) => (b.tipo === 'flip-cards' ? fn(b) : b));
  };

  if (selection.kind === 'header-text') {
    const style = block.estilosHeader?.[selection.field] ?? {};
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
          defaultSize={selection.field === 'tituloWidget' ? 18 : 14}
          sizeMax={selection.field === 'tituloWidget' ? 48 : 32}
          onPatch={(patch) =>
            update((w) => patchHeaderStyle(w, selection.field, patch))
          }
        />
      </div>
    );
  }

  if (selection.kind !== 'card-text') return null;

  const card = block.tarjetas.find((c) => c.id === selection.cardId);
  if (!card) return null;
  const cara = selection.face === 'frente' ? card.frente : card.reverso;
  const isTitle = selection.field === 'titulo';
  const style = (isTitle ? cara.estiloTitulo : cara.estiloCuerpo) ?? {};
  const label = isTitle ? 'Título de tarjeta' : 'Cuerpo de tarjeta';

  const patchStyle = (patch: Partial<FlipCardsCampoEstilo>) => {
    const key = isTitle ? 'estiloTitulo' : 'estiloCuerpo';
    const prev = cara[key] ?? {};
    update((w) =>
      patchCardFace(w, selection.cardId, selection.face, {
        [key]: { ...prev, ...patch },
      }),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>
        Texto — {label} ({selection.face === 'frente' ? 'Frente' : 'Atrás'})
      </SectionTitle>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Usa el asa azul a la izquierda del texto en el lienzo para arrastrarlo dentro de la
        tarjeta.
      </p>
      <TextStyleFields
        style={{
          ...style,
          color:
            style.color ??
            (selection.face === 'reverso' ? '#ffffff' : '#0f172a'),
        }}
        defaultSize={isTitle ? 14 : 12}
        sizeMax={32}
        onPatch={patchStyle}
      />
    </div>
  );
}

export function FlipCardsImageInnerProperties({
  block,
  selection,
  applyNow,
}: FlipCardsInnerPropertiesProps) {
  if (selection.kind !== 'card-image') return null;

  const card = block.tarjetas.find((c) => c.id === selection.cardId);
  if (!card) return null;
  const cara = selection.face === 'frente' ? card.frente : card.reverso;

  const update = (patch: Partial<FlipCardCara>) => {
    void applyNow((b) => {
      if (b.tipo !== 'flip-cards') return b;
      return patchCardFace(b, selection.cardId, selection.face, patch);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>
        Imagen ({selection.face === 'frente' ? 'Frente' : 'Atrás'})
      </SectionTitle>
      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input
          className="h-8 text-xs"
          placeholder="https://…"
          value={cara.imagen ?? ''}
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
          value={cara.imagenAlt ?? ''}
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
              variant={(cara.imagenObjectFit ?? 'cover') === fit ? 'secondary' : 'outline'}
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
          value={cara.imagenObjectPosition ?? 'center'}
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
            {cara.imagenEscala ?? 100}%
          </span>
        </div>
        <Slider
          value={[cara.imagenEscala ?? 100]}
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
            {cara.imagenOffsetX ?? 0}%
          </span>
        </div>
        <Slider
          value={[cara.imagenOffsetX ?? 0]}
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
            {cara.imagenOffsetY ?? 0}%
          </span>
        </div>
        <Slider
          value={[cara.imagenOffsetY ?? 0]}
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
            {cara.imagenRadio ?? 4}px
          </span>
        </div>
        <Slider
          value={[cara.imagenRadio ?? 4]}
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
            {cara.imagenOpacidad ?? 100}%
          </span>
        </div>
        <Slider
          value={[cara.imagenOpacidad ?? 100]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => update({ imagenOpacidad: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Brillo</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {cara.imagenBrillo ?? 100}%
          </span>
        </div>
        <Slider
          value={[cara.imagenBrillo ?? 100]}
          min={40}
          max={160}
          step={5}
          onValueChange={([v]) => update({ imagenBrillo: v })}
        >
          <SliderThumb />
        </Slider>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={cara.imagenEscalaDeGrises === true}
          onCheckedChange={(checked) =>
            update({ imagenEscalaDeGrises: checked === true })
          }
        />
        Escala de grises
      </label>
    </div>
  );
}
