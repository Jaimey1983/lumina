'use client';

import { useMemo } from 'react';
import type { RelacionarLineasActivity, RelacionarLineasItem } from '@lumina/types/slide';

import { etiquetaItem, normalizarRelacionarLineas } from './relacionar-lineas-config.js';

interface RelacionarLineasEditorProps {
  actividad: RelacionarLineasActivity;
  isSelected?: boolean;
}

function Celda({ item }: { item: RelacionarLineasItem }) {
  return (
    <div className="flex min-h-[28px] items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 p-1.5 text-xs text-foreground">
      {item.imagen ? <img src={item.imagen} alt={item.texto ?? ''} className="h-8 w-auto object-contain" /> : etiquetaItem(item)}
    </div>
  );
}

/** Vista del lienzo en el editor: las dos columnas y cuántas relaciones hay (se edita en el panel). */
export function RelacionarLineasEditor({ actividad }: RelacionarLineasEditorProps) {
  const act = useMemo(() => normalizarRelacionarLineas(actividad), [actividad]);
  return (
    <div className="flex h-full w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relacionar con líneas</span>
        <span className="text-xs text-muted-foreground">
          {act.relaciones.length} {act.relaciones.length === 1 ? 'relación' : 'relaciones'}
        </span>
      </div>
      {act.instruccion && <p className="truncate px-1 text-xs text-muted-foreground">{act.instruccion}</p>}
      <div className="grid flex-1 grid-cols-[1fr_2rem_1fr] gap-1 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-1.5">
          {act.izquierda.map((i) => (
            <Celda key={i.id} item={i} />
          ))}
        </div>
        <div aria-hidden className="self-center text-center text-muted-foreground">
          ⟷
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          {act.derecha.map((d) => (
            <Celda key={d.id} item={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
