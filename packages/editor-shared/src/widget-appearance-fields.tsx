'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from 'lucide-react';

import type { WidgetAlineacion, WidgetLayoutId } from '@lumina/types/widget';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Slider, SliderThumb } from '@lumina/ui/slider';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { Toggle } from '@lumina/ui/toggle';
import { TabsLayoutGallery } from './tabs-layout-gallery.js';
import { WidgetSectionTitle } from './widget-properties-panel.js';

/**
 * Id del widget dueño de la columna de apariencia. Con él las secciones se
 * pliegan solas y recuerdan su estado (`widgets.<scope>.<título>`); sin él
 * (`null`) se comportan como antes de la etapa S.
 */
const WidgetAppearanceScope = createContext<string | null>(null);

function sectionSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Columna estándar de secciones de apariencia (mismo espaciado en todos los widgets). */
export function WidgetAppearanceStack({
  children,
  scope,
}: {
  children: ReactNode;
  /** Id del widget (`'flip-cards'`, `'tabs'`…): activa el plegado de sus secciones. */
  scope?: string;
}) {
  const stack = <div className="flex flex-col gap-5">{children}</div>;
  return scope ? (
    <WidgetAppearanceScope.Provider value={scope}>{stack}</WidgetAppearanceScope.Provider>
  ) : (
    stack
  );
}

export function WidgetAppearanceSection({
  title,
  children,
  collapsible,
  defaultOpen = false,
  storageKey,
  badge,
}: {
  title: string;
  children: ReactNode;
  /** Por defecto se pliega solo si la columna tiene `scope`; `false` fuerza el título fijo. */
  collapsible?: boolean;
  /** Estado inicial cuando se pliega y no hay preferencia guardada. */
  defaultOpen?: boolean;
  /** Por defecto `widgets.<scope>.<título>`. */
  storageKey?: string;
  badge?: ReactNode;
}) {
  const scope = useContext(WidgetAppearanceScope);
  if (collapsible ?? scope !== null) {
    return (
      <CollapsibleSection
        title={title}
        defaultOpen={defaultOpen}
        storageKey={storageKey ?? (scope ? `widgets.${scope}.${sectionSlug(title)}` : undefined)}
        badge={badge}
      >
        {children}
      </CollapsibleSection>
    );
  }
  return (
    <div className="space-y-3">
      <WidgetSectionTitle>{title}</WidgetSectionTitle>
      {children}
    </div>
  );
}

export function WidgetAppearanceHint({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-snug text-muted-foreground">{children}</p>;
}

export interface WidgetContainerAppearanceValues {
  colorFondoContenedor: string;
  opacidadFondoContenedor: number;
  paddingContenedor: number;
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return fallback;
}

export function WidgetContainerAppearanceFields({
  values,
  onPatch,
  showPadding = true,
}: {
  values: WidgetContainerAppearanceValues;
  onPatch: (patch: Partial<WidgetContainerAppearanceValues>) => void;
  /** false cuando el padding se edita en otra sección (p. ej. Flip Cards → Layout). */
  showPadding?: boolean;
}) {
  return (
    <WidgetAppearanceSection title="Contenedor">
      <WidgetColorPickerField
        label="Color de fondo"
        value={values.colorFondoContenedor}
        fallback="#F8FAFC"
        onChange={(colorFondoContenedor) => onPatch({ colorFondoContenedor })}
      />
      <WidgetPercentSliderField
        label="Opacidad fondo"
        value={values.opacidadFondoContenedor}
        min={0}
        max={100}
        step={5}
        suffix="%"
        onChange={(opacidadFondoContenedor) => onPatch({ opacidadFondoContenedor })}
      />
      {showPadding ? (
        <WidgetPxSliderField
          label="Padding"
          value={values.paddingContenedor}
          min={0}
          max={48}
          step={2}
          onChange={(paddingContenedor) => onPatch({ paddingContenedor })}
        />
      ) : null}
    </WidgetAppearanceSection>
  );
}

export function WidgetInstructionAlignmentFields({
  value,
  onChange,
}: {
  value: WidgetAlineacion;
  onChange: (align: WidgetAlineacion) => void;
}) {
  return (
    <WidgetAppearanceSection title="Instrucción">
      <div className="space-y-1.5">
        <Label className="text-xs">Alineación</Label>
        <div className="flex gap-0.5">
          {(
            [
              ['izquierda', AlignLeft],
              ['centro', AlignCenter],
              ['derecha', AlignRight],
            ] as const
          ).map(([align, Icon]) => (
            <Toggle
              key={align}
              size="sm"
              pressed={value === align}
              aria-label={align}
              onPressedChange={() => onChange(align)}
            >
              <Icon className="size-3.5" />
            </Toggle>
          ))}
        </div>
      </div>
    </WidgetAppearanceSection>
  );
}

export function WidgetLayoutGallerySection({
  hint,
  activeId,
  onSelect,
}: {
  hint: string;
  activeId: WidgetLayoutId;
  onSelect: (id: WidgetLayoutId) => void;
}) {
  return (
    <WidgetAppearanceSection title="Layout del widget" defaultOpen>
      <WidgetAppearanceHint>{hint}</WidgetAppearanceHint>
      <TabsLayoutGallery activeId={activeId} onSelect={onSelect} />
    </WidgetAppearanceSection>
  );
}

export function WidgetColorsAppearanceSection({ children }: { children: ReactNode }) {
  return <WidgetAppearanceSection title="Colores">{children}</WidgetAppearanceSection>;
}

export function WidgetColorPickerField({
  label,
  value,
  onChange,
  fallback,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Normaliza valores inválidos en el input type=color. */
  fallback?: string;
}) {
  const display = fallback ? normalizeHexColor(value, fallback) : value;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="color"
        className="h-8 w-full cursor-pointer p-1"
        value={display}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function WidgetPercentSliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  suffix = '%',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)}>
        <SliderThumb />
      </Slider>
    </div>
  );
}

export function WidgetPxSliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{value}px</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)}>
        <SliderThumb />
      </Slider>
    </div>
  );
}

export function WidgetOptionButtonGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <WidgetAppearanceSection title={title}>
      <div className="flex gap-1">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={value === opt.value ? 'secondary' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </WidgetAppearanceSection>
  );
}

export interface WidgetBackdropAppearanceValues {
  colorBackdrop: string;
  opacidadBackdrop: number;
}

export function WidgetBackdropAppearanceFields({
  values,
  onPatch,
}: {
  values: WidgetBackdropAppearanceValues;
  onPatch: (patch: Partial<WidgetBackdropAppearanceValues>) => void;
}) {
  return (
    <WidgetAppearanceSection title="Backdrop del modal">
      <WidgetColorPickerField
        label="Color"
        value={values.colorBackdrop}
        onChange={(colorBackdrop) => onPatch({ colorBackdrop })}
      />
      <WidgetPercentSliderField
        label="Opacidad"
        value={values.opacidadBackdrop}
        onChange={(opacidadBackdrop) => onPatch({ opacidadBackdrop })}
      />
    </WidgetAppearanceSection>
  );
}
