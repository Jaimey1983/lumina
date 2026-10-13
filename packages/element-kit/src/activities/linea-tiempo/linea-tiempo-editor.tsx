'use client';

import { useMemo } from 'react';
import type { LineaTiempoActivity } from '@lumina/types/slide';

import { eventosEnOrden, normalizarLineaTiempo } from './linea-tiempo-config.js';

interface LineaTiempoEditorProps {
  actividad: LineaTiempoActivity;
  isSelected?: boolean;
}

/** Vista del lienzo en el editor: el eje con los eventos en su orden correcto (se edita en el panel). */
export function LineaTiempoEditor({ actividad }: LineaTiempoEditorProps) {
  const act = useMemo(() => normalizarLineaTiempo(actividad), [actividad]);
  const ordenados = useMemo(() => eventosEnOrden(act.eventos), [act.eventos]);
  return (
    <div className="flex h-full w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Línea de tiempo</span>
        <span className="text-xs text-muted-foreground">
          {act.eventos.length} {act.eventos.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>
      {act.instruccion && <p className="truncate px-1 text-xs text-muted-foreground">{act.instruccion}</p>}
      <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden border-l-2 border-border pl-3">
        {ordenados.map((e) => (
          <li key={e.id} className="flex items-baseline gap-2 truncate text-xs text-foreground">
            <span className="shrink-0 font-semibold text-muted-foreground">{e.fechaTexto || '—'}</span>
            <span className="truncate">{e.texto}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
