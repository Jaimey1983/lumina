'use client';

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
import type {
  FlipCardsCaraLado,
  FlipCardsInnerSelection,
} from './flip-cards-config';
import { WidgetTypographyFields } from '@/components/editor/typography-inspector';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';

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
        <WidgetSectionTitle>Texto — {label}</WidgetSectionTitle>
        <WidgetTypographyFields
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
      <WidgetSectionTitle>
        Texto — {label} ({selection.face === 'frente' ? 'Frente' : 'Atrás'})
      </WidgetSectionTitle>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Usa el asa azul a la izquierda del texto en el lienzo para arrastrarlo dentro de la
        tarjeta.
      </p>
      <WidgetTypographyFields
        style={{
          ...style,
          color:
            style.color ??
            (selection.face === 'reverso' ? '#ffffff' : '#0f172a'),
        }}
        defaultSize={isTitle ? 14 : 12}
        sizeMax={32}
        defaultColor={selection.face === 'reverso' ? '#ffffff' : '#0f172a'}
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
      <WidgetSectionTitle>
        Imagen ({selection.face === 'frente' ? 'Frente' : 'Atrás'})
      </WidgetSectionTitle>
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
