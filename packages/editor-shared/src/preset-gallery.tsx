'use client';

import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { cn } from '@lumina/ui/lib/utils';

/**
 * Forma mínima de un preset (compatible con `ElementPreset<TEstado>` de
 * `@lumina/element-kit-core`; se declara acá para no depender de ese paquete).
 */
export interface GalleryPreset {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly thumbnail?: string;
  /** Parche profundo y parcial del estado del elemento (T2). */
  readonly estadoPatch: object;
}

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Aplica el parche de un preset al estado: los objetos anidados se mezclan en
 * profundidad (`configuracion: { duracionGiro }` solo toca esa clave) y los
 * arreglos y valores simples se reemplazan. No muta el estado recibido.
 */
export function aplicarPreset<TEstado>(estado: TEstado, preset: GalleryPreset): TEstado {
  const mezclar = (base: unknown, parche: unknown): unknown => {
    if (!esObjetoPlano(parche)) return parche;
    const origen = esObjetoPlano(base) ? base : {};
    const salida: Record<string, unknown> = { ...origen };
    for (const [clave, valor] of Object.entries(parche)) {
      if (valor === undefined) continue;
      salida[clave] = mezclar(origen[clave], valor);
    }
    return salida;
  };
  return mezclar(estado, preset.estadoPatch) as TEstado;
}

/** `true` si cada valor del parche ya está en el estado (igualdad en profundidad). */
export function presetCoincide(estado: unknown, preset: GalleryPreset): boolean {
  const contiene = (actual: unknown, parche: unknown): boolean => {
    if (esObjetoPlano(parche)) {
      if (!esObjetoPlano(actual)) return false;
      return Object.entries(parche).every(
        ([clave, valor]) => valor === undefined || contiene(actual[clave], valor),
      );
    }
    if (Array.isArray(parche)) return JSON.stringify(actual) === JSON.stringify(parche);
    return Object.is(actual, parche);
  };
  const claves = Object.keys(preset.estadoPatch);
  return claves.length > 0 && contiene(estado, preset.estadoPatch);
}

export interface PresetGalleryProps {
  /** `definicion.presets`; sin presets (o vacío) no se renderiza nada. */
  presets: readonly GalleryPreset[] | undefined;
  /** Estado actual, para marcar el preset activo. */
  estado: unknown;
  /** El docente eligió un preset: el llamador aplica `aplicarPreset` al estado. */
  onSelect: (preset: GalleryPreset) => void;
  /** Clave de recuerdo de la sección, p. ej. `widget.boton.estilos`. */
  storageKey: string;
  title?: string;
  className?: string;
}

/**
 * Galería de estilos preconfigurados de un elemento, dentro de una sección
 * plegable (abierta por defecto). Un botón por preset, con `aria-pressed` en el
 * activo; se opera con teclado como cualquier botón.
 */
export function PresetGallery({
  presets,
  estado,
  onSelect,
  storageKey,
  title = 'Estilos',
  className,
}: PresetGalleryProps) {
  if (!presets || presets.length === 0) return null;

  return (
    <CollapsibleSection
      title={title}
      badge={presets.length}
      storageKey={storageKey}
      defaultOpen
    >
      <div
        role="group"
        aria-label={title}
        className={cn('grid grid-cols-2 gap-1.5 pt-2', className)}
        data-preset-gallery
      >
        {presets.map((preset) => {
          const activo = presetCoincide(estado, preset);
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activo}
              title={preset.description}
              data-preset-id={preset.id}
              onClick={() => onSelect(preset)}
              className={cn(
                'flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-md border px-2 py-1.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activo
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:bg-muted/60',
              )}
            >
              {preset.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura decorativa de un preset
                <img src={preset.thumbnail} alt="" className="h-8 w-full rounded object-cover" />
              ) : null}
              <span className="text-[11px] font-semibold leading-tight text-foreground">
                {preset.label}
              </span>
              {preset.description ? (
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {preset.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
