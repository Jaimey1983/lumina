'use client';

import { useMemo } from 'react';
import type { EtiquetarImagenActivity } from '@lumina/types/slide';

import { normalizarEtiquetarImagen } from './etiquetar-imagen-config.js';

interface EtiquetarImagenEditorProps {
  actividad: EtiquetarImagenActivity;
  isSelected?: boolean;
}

/** Vista del lienzo en el editor: la imagen con sus marcadores numerados (se edita en el panel). */
export function EtiquetarImagenEditor({ actividad }: EtiquetarImagenEditorProps) {
  const act = useMemo(() => normalizarEtiquetarImagen(actividad, false), [actividad]);
  return (
    <div className="flex h-full w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etiquetar imagen</span>
        <span className="text-xs text-muted-foreground">
          {act.zonas.length} {act.zonas.length === 1 ? 'marcador' : 'marcadores'} · {act.etiquetas.length}{' '}
          {act.etiquetas.length === 1 ? 'etiqueta' : 'etiquetas'}
        </span>
      </div>
      {act.instruccion && <p className="truncate px-1 text-xs text-muted-foreground">{act.instruccion}</p>}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-muted/40">
        {act.imagen ? (
          <img src={act.imagen} alt={act.textoAlternativo} className="h-full w-full object-contain" draggable={false} />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin imagen</p>
        )}
      </div>
    </div>
  );
}
