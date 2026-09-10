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

import { FontFamilySelect } from './font-family-select.js';
import { FontSizeInput } from './font-size-input.js';
import { Button } from '@lumina/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lumina/ui/collapsible';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Slider, SliderThumb } from '@lumina/ui/slider';
import { Switch } from '@lumina/ui/switch';
import { Toggle } from '@lumina/ui/toggle';
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
} from './typography.js';
import { cn } from '@lumina/ui/lib/utils';
import { contrastVerdict } from './contrast.js';
import type { TextBoxValue } from './text-box.js';
import type { HeadingLevel } from '@lumina/types/slide';
import type { WidgetCampoEstilo } from '@lumina/types/widget';

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
  /** Color de fondo contra el que evaluar el contraste WCAG del texto. */
  contrastBackground?: string;
  /** Texto plano para el contador de palabras/caracteres. */
  metaText?: string;
  /** Panel «Caja» (relleno, borde, sombra, columnas…) — sólo para el primitivo `texto`. */
  boxValue?: TextBoxValue;
  onBoxChange?: (patch: Partial<TextBoxValue>) => void;
  /** Panel «Revelado» (animación por palabra/línea) — sólo para el primitivo `texto`. */
  revealValue?: RevealValue;
  onRevealChange?: (next: RevealValue | undefined) => void;
  /** Curvatura del texto (−100…100). */
  curvatura?: number;
  onCurvaturaChange?: (n: number | undefined) => void;
}

type RevealValue = NonNullable<import('@lumina/types/slide').TextBlock['revelado']>;

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
  boxValue,
  onBoxChange,
  revealValue,
  onRevealChange,
  curvatura,
  onCurvaturaChange,
  contrastBackground,
  metaText,
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

      {boxValue && onBoxChange ? (
        <BoxSection value={boxValue} onChange={onBoxChange} disabled={disabled} />
      ) : null}

      {onRevealChange ? (
        <RevealSection value={revealValue} onChange={onRevealChange} disabled={disabled} />
      ) : null}

      {onCurvaturaChange ? (
        <InspectorSection title="Curvatura" defaultOpen={false}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Curvatura</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {curvatura ?? 0}
              </span>
            </div>
            <Slider
              value={[curvatura ?? 0]}
              min={-100}
              max={100}
              step={5}
              disabled={disabled}
              onValueChange={([v]) => onCurvaturaChange(v || undefined)}
            >
              <SliderThumb />
            </Slider>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Una sola línea, sin formato por fragmentos.
            </p>
          </div>
        </InspectorSection>
      ) : null}

      {metaText !== undefined || contrastBackground ? (
        <TextMetaFooter
          text={metaText}
          fg={value.color ?? defaultColor}
          bg={contrastBackground}
          fontPx={size}
          bold={isBoldWeight(value.fontWeight)}
        />
      ) : null}
    </div>
  );
}

const V_ALIGNS: { id: NonNullable<TextBoxValue['alineacionVertical']>; label: string }[] = [
  { id: 'arriba', label: 'Arriba' },
  { id: 'centro', label: 'Centro' },
  { id: 'abajo', label: 'Abajo' },
];

function BoxSection({
  value,
  onChange,
  disabled,
}: {
  value: TextBoxValue;
  onChange: (patch: Partial<TextBoxValue>) => void;
  disabled?: boolean;
}) {
  const hasBorder =
    !!value.bordeColor || (value.bordeGrosor ?? 0) > 0 || (value.bordeRadio ?? 0) > 0;
  const hasShadow =
    !!value.sombraColor ||
    (value.sombraDesenfoque ?? 0) > 0 ||
    !!value.sombraX ||
    !!value.sombraY;
  const hasStroke = !!value.contornoColor || (value.contornoGrosor ?? 0) > 0;
  const hasGradient = !!value.degradadoDesde && !!value.degradadoHasta;

  return (
    <InspectorSection title="Caja" defaultOpen={false}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Relleno</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {value.relleno ?? 0}px
          </span>
        </div>
        <Slider
          value={[value.relleno ?? 0]}
          min={0}
          max={64}
          step={2}
          disabled={disabled}
          onValueChange={([v]) => onChange({ relleno: v || undefined })}
        >
          <SliderThumb />
        </Slider>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Alineación vertical</Label>
        <div className="grid grid-cols-3 gap-1">
          {V_ALIGNS.map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={value.alineacionVertical === id ? 'secondary' : 'outline'}
              className="h-7 px-1 text-[11px]"
              disabled={disabled}
              onClick={() =>
                onChange({
                  alineacionVertical: value.alineacionVertical === id ? undefined : id,
                })
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Columnas</Label>
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={(value.columnas ?? 1) === n ? 'secondary' : 'outline'}
              className="h-7 px-1 text-[11px]"
              disabled={disabled}
              onClick={() => onChange({ columnas: n === 1 ? undefined : n })}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Ancho máx. de línea</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {value.medidaMax ? `${value.medidaMax} ch` : 'auto'}
          </span>
        </div>
        <Slider
          value={[value.medidaMax ?? 0]}
          min={0}
          max={90}
          step={2}
          disabled={disabled}
          onValueChange={([v]) => onChange({ medidaMax: v || undefined })}
        >
          <SliderThumb />
        </Slider>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <Label className="text-xs">Borde</Label>
        <Switch
          checked={hasBorder}
          disabled={disabled}
          onCheckedChange={(on) =>
            onChange(
              on
                ? { bordeColor: '#2563eb', bordeGrosor: 2, bordeRadio: 8 }
                : { bordeColor: undefined, bordeGrosor: undefined, bordeRadio: undefined },
            )
          }
        />
      </div>
      {hasBorder ? (
        <>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            disabled={disabled}
            value={toHexColor(value.bordeColor, '#2563eb')}
            onChange={(e) => onChange({ bordeColor: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Grosor</Label>
              <Slider
                value={[value.bordeGrosor ?? 2]}
                min={1}
                max={12}
                step={1}
                disabled={disabled}
                onValueChange={([v]) => onChange({ bordeGrosor: v })}
              >
                <SliderThumb />
              </Slider>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Radio</Label>
              <Slider
                value={[value.bordeRadio ?? 8]}
                min={0}
                max={32}
                step={1}
                disabled={disabled}
                onValueChange={([v]) => onChange({ bordeRadio: v })}
              >
                <SliderThumb />
              </Slider>
            </div>
          </div>
        </>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <Label className="text-xs">Sombra de caja</Label>
        <Switch
          checked={hasShadow}
          disabled={disabled}
          onCheckedChange={(on) =>
            onChange(
              on
                ? { sombraColor: 'rgba(2,6,23,0.35)', sombraDesenfoque: 18, sombraX: 0, sombraY: 8 }
                : {
                    sombraColor: undefined,
                    sombraDesenfoque: undefined,
                    sombraX: undefined,
                    sombraY: undefined,
                  },
            )
          }
        />
      </div>
      {hasShadow ? (
        <div className="space-y-1">
          <Label className="text-[10px]">Desenfoque</Label>
          <Slider
            value={[value.sombraDesenfoque ?? 18]}
            min={0}
            max={48}
            step={1}
            disabled={disabled}
            onValueChange={([v]) => onChange({ sombraDesenfoque: v })}
          >
            <SliderThumb />
          </Slider>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <Label className="text-xs">Contorno del texto</Label>
        <Switch
          checked={hasStroke}
          disabled={disabled}
          onCheckedChange={(on) =>
            onChange(
              on
                ? { contornoColor: '#000000', contornoGrosor: 1 }
                : { contornoColor: undefined, contornoGrosor: undefined },
            )
          }
        />
      </div>
      {hasStroke ? (
        <>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-1"
            disabled={disabled}
            value={toHexColor(value.contornoColor, '#000000')}
            onChange={(e) => onChange({ contornoColor: e.target.value })}
          />
          <div className="space-y-1">
            <Label className="text-[10px]">Grosor</Label>
            <Slider
              value={[value.contornoGrosor ?? 1]}
              min={0.5}
              max={8}
              step={0.5}
              disabled={disabled}
              onValueChange={([v]) => onChange({ contornoGrosor: v })}
            >
              <SliderThumb />
            </Slider>
          </div>
        </>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <Label className="text-xs">Degradado del texto</Label>
        <Switch
          checked={hasGradient}
          disabled={disabled}
          onCheckedChange={(on) =>
            onChange(
              on
                ? { degradadoDesde: '#6366f1', degradadoHasta: '#ec4899', degradadoAngulo: 90 }
                : { degradadoDesde: undefined, degradadoHasta: undefined, degradadoAngulo: undefined },
            )
          }
        />
      </div>
      {hasGradient ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Desde</Label>
              <Input
                type="color"
                className="h-8 w-full cursor-pointer p-1"
                disabled={disabled}
                value={toHexColor(value.degradadoDesde, '#6366f1')}
                onChange={(e) => onChange({ degradadoDesde: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Hasta</Label>
              <Input
                type="color"
                className="h-8 w-full cursor-pointer p-1"
                disabled={disabled}
                value={toHexColor(value.degradadoHasta, '#ec4899')}
                onChange={(e) => onChange({ degradadoHasta: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Ángulo</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {value.degradadoAngulo ?? 90}°
              </span>
            </div>
            <Slider
              value={[value.degradadoAngulo ?? 90]}
              min={0}
              max={360}
              step={5}
              disabled={disabled}
              onValueChange={([v]) => onChange({ degradadoAngulo: v })}
            >
              <SliderThumb />
            </Slider>
          </div>
        </>
      ) : null}
    </InspectorSection>
  );
}

const REVEAL_EFFECTS: { id: RevealValue['efecto']; label: string }[] = [
  { id: 'aparecer', label: 'Aparecer' },
  { id: 'subir', label: 'Subir' },
  { id: 'zoom', label: 'Zoom' },
];

function RevealSection({
  value,
  onChange,
  disabled,
}: {
  value?: RevealValue;
  onChange: (next: RevealValue | undefined) => void;
  disabled?: boolean;
}) {
  const por = value?.por;
  return (
    <InspectorSection title="Revelado del texto" defaultOpen={false}>
      <div className="space-y-1.5">
        <Label className="text-xs">Modo</Label>
        <div className="grid grid-cols-3 gap-1">
          {([
            ['none', 'Ninguno'],
            ['palabra', 'Palabra'],
            ['linea', 'Línea'],
          ] as const).map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={(por ?? 'none') === id ? 'secondary' : 'outline'}
              className="h-7 px-1 text-[11px]"
              disabled={disabled}
              onClick={() =>
                onChange(
                  id === 'none'
                    ? undefined
                    : { por: id, efecto: value?.efecto ?? 'aparecer', retraso: value?.retraso },
                )
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      {value ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Efecto</Label>
            <div className="grid grid-cols-3 gap-1">
              {REVEAL_EFFECTS.map(({ id, label }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={value.efecto === id ? 'secondary' : 'outline'}
                  className="h-7 px-1 text-[11px]"
                  disabled={disabled}
                  onClick={() => onChange({ ...value, efecto: id })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Retraso entre unidades</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {value.retraso ?? (value.por === 'linea' ? 140 : 60)}ms
              </span>
            </div>
            <Slider
              value={[value.retraso ?? (value.por === 'linea' ? 140 : 60)]}
              min={20}
              max={280}
              step={10}
              disabled={disabled}
              onValueChange={([v]) => onChange({ ...value, retraso: v })}
            >
              <SliderThumb />
            </Slider>
          </div>
        </>
      ) : null}
    </InspectorSection>
  );
}

function TextMetaFooter({
  text,
  fg,
  bg,
  fontPx,
  bold,
}: {
  text?: string;
  fg: string;
  bg?: string;
  fontPx: number;
  bold: boolean;
}) {
  const words = text ? (text.trim().match(/\S+/g)?.length ?? 0) : null;
  const chars = text ? text.length : null;
  const verdict = bg ? contrastVerdict(fg, bg, fontPx, bold) : null;

  if (words === null && !verdict) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2 text-[10px] text-muted-foreground">
      {words !== null ? (
        <span className="tabular-nums">
          {words} {words === 1 ? 'palabra' : 'palabras'} · {chars} caracteres
        </span>
      ) : (
        <span />
      )}
      {verdict ? (
        <span
          className={cn(
            'tabular-nums',
            !verdict.passes && 'font-semibold text-amber-600 dark:text-amber-500',
          )}
          title={`Contraste WCAG AA — mínimo ${verdict.umbral}:1 (${
            verdict.large ? 'texto grande' : 'texto normal'
          })`}
        >
          {!verdict.passes ? '⚠ ' : ''}
          Contraste {verdict.ratio.toFixed(1)}:1
        </span>
      ) : null}
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
