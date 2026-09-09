'use client';

import { useState, type ReactNode } from 'react';

/**
 * Marca «ocultar respuesta»: en el viewer el texto sale difuminado hasta que el
 * alumno hace clic (o Enter/Espacio). En el editor / no interactivo se muestra ya.
 */
export function SpoilerRun({
  children,
  revealed = false,
}: {
  children?: ReactNode;
  revealed?: boolean;
}) {
  const [open, setOpen] = useState(revealed);
  if (open) {
    return <span data-spoiler="revealed">{children}</span>;
  }
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Mostrar respuesta oculta"
      data-spoiler="1"
      onClick={() => setOpen(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
        }
      }}
      style={{
        filter: 'blur(5px)',
        cursor: 'pointer',
        borderRadius: 3,
        background: 'rgba(15,23,42,0.06)',
        userSelect: 'none',
        transition: 'filter 120ms',
      }}
    >
      {children}
    </span>
  );
}
