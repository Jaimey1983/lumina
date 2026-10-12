'use client';

import { useMemo } from 'react';
import type { ProblemaPasosActivity } from '@lumina/types/slide';

import { normalizarProblemaPasos, pistasDe } from './problema-pasos-config.js';

interface ProblemaPasosEditorProps {
  actividad: ProblemaPasosActivity;
  isSelected?: boolean;
}

/** Vista del lienzo en el editor: enunciado y pasos (se edita en el panel de propiedades). */
export function ProblemaPasosEditor({ actividad }: ProblemaPasosEditorProps) {
  const act = useMemo(() => normalizarProblemaPasos(actividad), [actividad]);
  return (
    <div className="flex h-full w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Problema paso a paso</span>
        <span className="text-xs text-muted-foreground">
          {act.pasos.length} {act.pasos.length === 1 ? 'paso' : 'pasos'}
          {act.secuencial ? ' · en orden' : ''}
        </span>
      </div>
      {act.enunciado && <p className="line-clamp-3 px-1 text-xs text-foreground">{act.enunciado}</p>}
      <ol className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        {act.pasos.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground">
            <span className="font-semibold text-muted-foreground">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate">{p.instruccion || 'Paso sin instrucción'}</span>
            {pistasDe(p).length > 0 && <span className="shrink-0 text-[10px] text-muted-foreground">{pistasDe(p).length} 💡</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
