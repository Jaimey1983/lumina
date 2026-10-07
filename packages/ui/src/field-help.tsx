'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from './lib/utils.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog.js';
import { Popover, PopoverContent, PopoverTrigger } from './popover.js';

export interface FieldHelpProps {
  /** Nombre del campo o sección; da el `aria-label` («Ayuda: …») y el título de la ventana grande. */
  label: string;
  /** Texto de ayuda. Admite JSX (`<code>`, párrafos, listas). */
  children: React.ReactNode;
  /**
   * `normal` — globo pequeño junto al icono (textos de hasta ~300 caracteres).
   * `large` — ventana «Cómo funciona» (textos más largos o con pasos).
   */
  size?: 'normal' | 'large';
  className?: string;
}

const triggerClassName =
  'inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Icono ⓘ que muestra una ayuda larga solo al pulsarlo (clic, Enter o Espacio;
 * se cierra con Escape). El contenido no está en el DOM mientras está cerrado.
 * Etapa R: los textos explicativos de 3 líneas o más salen del panel y viven acá.
 */
function FieldHelp({ label, children, size = 'normal', className }: FieldHelpProps) {
  const ariaLabel = `Ayuda: ${label}`;
  const trigger = (
    <button type="button" aria-label={ariaLabel} className={cn(triggerClassName, className)}>
      <Info className="size-3.5" aria-hidden="true" />
    </button>
  );

  if (size === 'large') {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 space-y-2 p-3 text-xs leading-relaxed text-muted-foreground"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export { FieldHelp };
