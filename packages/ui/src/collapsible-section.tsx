'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './lib/utils.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.js';

const STORAGE_PREFIX = 'lumina.panel.';

/**
 * Lee la preferencia guardada de una sección (`true` abierta, `false` cerrada,
 * `null` si no hay nada o el storage no está disponible). Nunca lanza.
 */
function readStoredOpen(storageKey: string, storage?: Pick<Storage, 'getItem'>): boolean | null {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store.getItem(STORAGE_PREFIX + storageKey);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  } catch {
    return null;
  }
}

/** Guarda la preferencia de una sección. Nunca lanza (storage bloqueado, modo privado…). */
function writeStoredOpen(
  storageKey: string,
  open: boolean,
  storage?: Pick<Storage, 'setItem'>,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store.setItem(STORAGE_PREFIX + storageKey, open ? '1' : '0');
  } catch {
    /* sin storage: la sección funciona igual, solo no recuerda el estado */
  }
}

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  /** Estado inicial cuando no hay preferencia guardada. Por defecto abierta. */
  defaultOpen?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  /** Conteo o texto corto junto al título (p. ej. «18», «0°»). */
  badge?: React.ReactNode;
  /**
   * Si se pasa, el estado abierto/cerrado se recuerda por usuario en
   * `localStorage` (`lumina.panel.<storageKey>`).
   */
  storageKey?: string;
  /**
   * Abre la sección cuando pasa a `true` (elemento seleccionado, coincidencia de
   * búsqueda, error) sin pisar la preferencia guardada; el usuario puede volver a cerrarla.
   */
  forceOpen?: boolean;
  className?: string;
}

/**
 * Sección plegable de los paneles del editor (etapa S). Un único estilo de
 * encabezado: botón con chevron, `aria-expanded` y foco visible. El contenido no
 * está en el DOM mientras la sección está cerrada.
 */
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  icon: Icon,
  badge,
  storageKey,
  forceOpen,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  // La preferencia guardada se aplica tras montar para no divergir del HTML del servidor.
  React.useEffect(() => {
    if (!storageKey) return;
    const stored = readStoredOpen(storageKey);
    if (stored !== null) setOpen(stored);
  }, [storageKey]);

  React.useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (storageKey) writeStoredOpen(storageKey, next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className={className}
      data-slot="collapsible-section"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-1.5 rounded-md py-0.5 text-left outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex min-w-0 items-center gap-1.5">
          {Icon ? <Icon className="size-3.5 shrink-0 text-muted-foreground" /> : null}
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {badge !== undefined && badge !== null && badge !== false ? (
            <span className="shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-medium leading-4 text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { CollapsibleSection, readStoredOpen, writeStoredOpen };
