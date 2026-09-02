'use client';

import { useState, type ReactNode } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Underline,
} from 'lucide-react';

import { FontFamilySelect } from '@/components/editor/font-family-select';
import { FontSizeInput } from '@/components/editor/font-size-input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import {
  applyTypographyPreset,
  isBoldWeight,
  matchTypographyPreset,
  typographyFromWidget,
  widgetPatchFromTypography,
  TYPOGRAPHY_PRESETS,
  type TypographyAlign,
  type TypographyList,
  type TypographyPresetId,
  type TypographyTransform,
  type TypographyValue,
} from '@/lib/typography';
import { cn } from '@/lib/utils';
import type { HeadingLevel } from '@/types/slide.types';
import type { WidgetCampoEstilo } from '@/types/widget.types';

const DEFAULT_LINE_HEIGHT = 1.35;
const DEFAULT_LETTER_SPACING = 0;

const PRESET_IDS = Object.keys(TYPOGRAPHY_PRESETS) as TypographyPresetId[];

const HEADING_OPTIONS: { id: HeadingLevel | 'p'; label: string }[] = [
  { id: 'p', label: 'P' },
  { id: 1, label: 'H1' },
  { id: 2, label: 'H2' },
  { id: 3, label: 'H3' },
  { id: 4, label: 'H4' },
  { id: 5, label: 'H5' },
  { id: 6, label: 'H6' },
];

function toHexColor(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return fallback;
}

const ALIGNS: { id: TypographyAlign; label: string; Icon: typeof AlignLeft }[] = [
  { id: 'left', label: 'Izquierda', Icon: AlignLeft },
  { id: 'center', label: 'Centro', Icon: AlignCenter },
  { id: 'right', label: 'Derecha', Icon: AlignRight },
  { id: 'justify', label: 'Justificado', Icon: AlignJustify },
];

const TRANSFORMS: { id: TypographyTransform; label: string }[] = [
  { id: 'none', label: 'Aa' },
  { id: 'uppercase', label: 'AA' },
  { id: 'capitalize', label: 'Tt' },
];

const LISTS: { id: TypographyList; label: string }[] = [
  { id: 'none', label: 'Texto' },
  { id: 'disc', label: 'Viñetas' },
  { id: 'decimal', label: 'Números' },
];

const HIGHLIGHT_DEFAULT = '#FEF3C7';

function InspectorSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-0.5 text-left">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <ChevronDown
          className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface TypographyInspectorProps {
  value: TypographyValue;
  onChange: (patch: Partial<TypographyValue>) => void;
  sizeMin?: number;
  sizeMax?: number;
  defaultSize?: number;
  defaultColor?: string;
  disabled?: boolean;
  headingLevel?: HeadingLevel;
  onHeadingLevelChange?: (nivel: HeadingLevel | undefined) => void;
  enableList?: boolean;
}

/** Inspector tipográfico único del panel derecho. */
export function TypographyInspector({
  value,
  onChange,
  sizeMin = 10,
  sizeMax = 48,
  defaultSize = 16,
  defaultColor = '#0f172a',
  disabled,
  headingLevel,
  onHeadingLevelChange,
  enableList,
}: TypographyInspectorProps) {
  const size = value.fontSize ?? defaultSize;
  const lineHeight = value.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const letterSpacing = value.letterSpacing ?? DEFAULT_LETTER_SPACING;
  const align = value.align ?? 'left';
  const transform = value.textTransform ?? 'none';
  const opacity = value.opacity ?? 100;
  const shadow = value.shadow ?? 0;
  const hasBackground = !!value.backgroundColor;
  const list = value.list ?? 'none';
  const activePreset = matchTypographyPreset(
    { ...value, fontSize: size, lineHeight },
    sizeMin,
    sizeMax,
  );

  const applyPreset = (id: TypographyPresetId) => {
    onChange(applyTypographyPreset(id, sizeMin, sizeMax));
    if (!onHeadingLevelChange) return;
    onHeadingLevelChange(id === 'titulo' ? 1 : undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Estilo</Label>
        <div className="grid grid-cols-3 gap-1">
          {PRESET_IDS.map((id) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={activePreset === id ? 'secondary' : 'outline'}
              className="h-7 px-1 text-[11px]"
              disabled={disabled}
              onClick={() => applyPreset(id)}
            >
              {TYPOGRAPHY_PRESETS[id].label}
            </Button>
          ))}
        </div>
      </div>

      {onHeadingLevelChange ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Nivel</Label>
          <div className="grid grid-cols-7 gap-1">
            {HEADING_OPTIONS.map(({ id, label }) => {
              const active = id === 'p' ? headingLevel === undefined : headingLevel === id;
              return (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant={active ? 'secondary' : 'outline'}
                  className="h-7 px-0 text-[10px]"
                  disabled={disabled}
                  onClick={() => onHeadingLevelChange(id === 'p' ? undefined : id)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <InspectorSection title="Tipografía">
        <FontFamilySelect
          value={value.fontFamily}
          onValueChange={(fontFamily) => onChange({ fontFamily })}
          disabled={disabled}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Tamaño (px)</Label>
          <FontSizeInput
            value={size}
            min={sizeMin}
            max={sizeMax}
            disabled={disabled}
            onChange={(fontSize) => onChange({ fontSize })}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <Toggle
            size="sm"
            variant="outline"
            disabled={disabled}
            pressed={isBoldWeight(value.fontWeight)}
            onPressedChange={(on) => onChange({ fontWeight: on ? 'bold' : 'normal' })}
            aria-label="Negrita"
          >
            <Bold className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            variant="outline"
            disabled={disabled}
            pressed={value.fontStyle === 'italic'}
            onPressedChange={(on) => onChange({ fontStyle: on ? 'italic' : 'normal' })}
            aria-label="Cursiva"
          >
            <Italic className="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            variant="outline"
            disabled={disabled}
            pressed={!!value.underline}
            onPressedChange={(on) => onChange({ underline: on })}
            aria-label="Subrayado"
          >
            <Underline className="size-3.5" />
          </Toggle>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Interlineado</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {lineHeight.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[Math.round(lineHeight * 100)]}
            min={100}
            max={200}
            step={5}
            disabled={disabled}
            onValueChange={([v]) => onChange({ lineHeight: v / 100 })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Espaciado letras</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {letterSpacing}px
            </span>
          </div>
          <Slider
            value={[letterSpacing]}
            min={-1}
            max={8}
            step={0.5}
            disabled={disabled}
            onValueChange={([v]) => onChange({ letterSpacing: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Alineación</Label>
          <div className="flex gap-1">
            {ALIGNS.map(({ id, label, Icon }) => (
              <Toggle
                key={id}
                size="sm"
                variant="outline"
                disabled={disabled}
                pressed={align === id}
                aria-label={label}
                title={label}
                onPressedChange={() => onChange({ align: id })}
              >
                <Icon className="size-3.5" />
              </Toggle>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Mayúsculas</Label>
          <div className="grid grid-cols-3 gap-1">
            {TRANSFORMS.map(({ id, label }) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={transform === id ? 'secondary' : 'outline'}
                className="h-7 px-1 text-[11px]"
                disabled={disabled}
                onClick={() => onChange({ textTransform: id })}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Aa normal · AA mayúsculas · Tt título</p>
        </div>
      </InspectorSection>

      <InspectorSection title="Color">
        <Input
          type="color"
          className="h-8 w-full cursor-pointer p-1"
          disabled={disabled}
          value={toHexColor(value.color, defaultColor)}
          onChange={(e) => onChange({ color: e.target.value })}
        />
      </InspectorSection>

      <InspectorSection title="Efectos" defaultOpen={false}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Opacidad</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{opacity}%</span>
          </div>
          <Slider
            value={[opacity]}
            min={15}
            max={100}
            step={5}
            disabled={disabled}
            onValueChange={([v]) => onChange({ opacity: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Sombra</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{shadow}px</span>
          </div>
          <Slider
            value={[shadow]}
            min={0}
            max={8}
            step={1}
            disabled={disabled}
            onValueChange={([v]) => onChange({ shadow: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
          <div className="space-y-0.5">
            <Label className="text-xs">Fondo</Label>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Resalta definiciones o llamadas
            </p>
          </div>
          <Switch
            checked={hasBackground}
            disabled={disabled}
            onCheckedChange={(on) =>
              onChange({
                backgroundColor: on ? HIGHLIGHT_DEFAULT : '',
                backgroundRadius: on ? 6 : 0,
              })
            }
            aria-label="Fondo del texto"
          />
        </div>

        {hasBackground ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Color de fondo</Label>
              <Input
                type="color"
                className="h-8 w-full cursor-pointer p-1"
                disabled={disabled}
                value={toHexColor(value.backgroundColor, HIGHLIGHT_DEFAULT)}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Radio</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {value.backgroundRadius ?? 6}px
                </span>
              </div>
              <Slider
                value={[value.backgroundRadius ?? 6]}
                min={0}
                max={24}
                step={1}
                disabled={disabled}
                onValueChange={([v]) => onChange({ backgroundRadius: v })}
              >
                <SliderThumb />
              </Slider>
            </div>
          </>
        ) : null}

        {enableList ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Lista</Label>
            <div className="grid grid-cols-3 gap-1">
              {LISTS.map(({ id, label }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={list === id ? 'secondary' : 'outline'}
                  className="h-7 px-1 text-[11px]"
                  disabled={disabled}
                  onClick={() => onChange({ list: id })}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Cada salto de línea se convierte en un ítem.
            </p>
          </div>
        ) : null}
      </InspectorSection>
    </div>
  );
}

export function WidgetTypographyFields({
  style,
  onPatch,
  sizeMax = 48,
  defaultSize = 16,
  defaultColor = '#0f172a',
}: {
  style: WidgetCampoEstilo;
  onPatch: (patch: Partial<WidgetCampoEstilo>) => void;
  sizeMax?: number;
  defaultSize?: number;
  defaultColor?: string;
}) {
  return (
    <TypographyInspector
      value={typographyFromWidget(style)}
      onChange={(patch) => onPatch(widgetPatchFromTypography(patch))}
      sizeMin={10}
      sizeMax={sizeMax}
      defaultSize={defaultSize}
      defaultColor={defaultColor}
    />
  );
}
