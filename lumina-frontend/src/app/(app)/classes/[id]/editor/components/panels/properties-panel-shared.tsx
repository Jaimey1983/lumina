'use client';

import type { Block } from '@lumina/types/slide';

export type ApplyNow = (fn: (b: Block) => Block) => Promise<void>;

/** Cabecera común de los paneles de propiedades (mismo markup en todas las ramas). */
export function PropertiesHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
    </div>
  );
}
