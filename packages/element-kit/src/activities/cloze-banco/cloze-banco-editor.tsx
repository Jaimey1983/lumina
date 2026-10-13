'use client';

import { useMemo } from 'react';
import type { ClozeBancoActivity } from '@lumina/types/slide';

import { normalizarClozeBanco, segmentarTexto } from './cloze-banco-config.js';

interface ClozeBancoEditorProps {
  actividad: ClozeBancoActivity;
  isSelected?: boolean;
}

/** Vista del lienzo en el editor: el texto con la respuesta de cada hueco resaltada (se edita en el panel). */
export function ClozeBancoEditor({ actividad }: ClozeBancoEditorProps) {
  const act = useMemo(() => normalizarClozeBanco(actividad, false), [actividad]);
  const partes = useMemo(() => segmentarTexto(act.texto, new Set(act.blancos.map((b) => b.id))), [act]);
  const distractores = act.distractores.filter((d) => d.trim() !== '');
  return (
    <div className="flex h-full w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cloze con banco</span>
        <span className="text-xs text-muted-foreground">
          {act.blancos.length} {act.blancos.length === 1 ? 'hueco' : 'huecos'} · {distractores.length}{' '}
          {distractores.length === 1 ? 'distractor' : 'distractores'}
        </span>
      </div>
      <p className="min-h-0 flex-1 overflow-hidden px-1 text-sm leading-relaxed text-foreground">
        {partes.map((p, i) =>
          p.tipo === 'texto' ? (
            <span key={i}>{p.texto}</span>
          ) : (
            <span key={i} className="mx-0.5 rounded border-b-2 border-primary bg-primary/10 px-1 font-semibold">
              {act.blancos.find((b) => b.id === p.id)?.respuesta || '____'}
            </span>
          ),
        )}
      </p>
    </div>
  );
}
