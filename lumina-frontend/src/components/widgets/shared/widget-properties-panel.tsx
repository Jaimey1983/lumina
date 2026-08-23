'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Ancho estándar del panel derecho de propiedades de widgets Captivate. */
export const WIDGET_PROPERTIES_PANEL_WIDTH = 'w-72';

export function WidgetSectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function WidgetPropertiesPanelShell({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-l border-border bg-background',
        WIDGET_PROPERTIES_PANEL_WIDTH,
        className,
      )}
    >
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

/** Contenedor vertical de secciones (primera sin divisor). */
export function WidgetPropertiesPanelStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

/** Sección con divisor superior (texto/imagen contextual, ítem, apariencia). */
export function WidgetPropertiesPanelSection({
  children,
  hint,
}: {
  children: ReactNode;
  /** Texto auxiliar bajo el divisor (p. ej. edición contextual). */
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      {hint ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

/** Bloque con divisor sin hint (p. ej. apariencia global). */
export function WidgetPropertiesPanelBlock({ children }: { children: ReactNode }) {
  return <div className="border-t border-border pt-4">{children}</div>;
}

export const WIDGET_CONTEXT_TEXT_HINT =
  'Edición contextual del texto seleccionado en el lienzo.';
export const WIDGET_CONTEXT_IMAGE_HINT =
  'Edición contextual de la imagen seleccionada en el lienzo.';
