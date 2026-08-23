'use client';

import { useEffect, useState } from 'react';
import type { EmparejaLado, MatchPairs } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { RenderLado } from './emparejar-shared';
import { ladoTieneImagen } from './emparejar-config';

interface EmparejarViewerProps {
  actividad: MatchPairs;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}

export function EmparejarViewer({
  actividad,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: EmparejarViewerProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ leftId: string; rightId: string }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [shuffledRight, setShuffledRight] = useState<{ id: string; lado: EmparejaLado }[]>([]);
  const { play } = useSound();

  useEffect(() => {
    if (!actividad?.pares) return;
    const rightItems = actividad.pares.map((p) => ({ id: p.id, lado: p.derecha }));
    setShuffledRight(rightItems.sort(() => Math.random() - 0.5));
    setMatches([]);
    setAnswered(false);
  }, [actividad?.pares, editorSyncKey]);

  const handleLeftClick = (id: string) => {
    if (answered) return;
    if (selectedLeft === id) setSelectedLeft(null);
    else setSelectedLeft(id);
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft || answered) return;
    setMatches((prev) => {
      const filtered = prev.filter((m) => m.leftId !== selectedLeft && m.rightId !== rightId);
      return [...filtered, { leftId: selectedLeft, rightId }];
    });
    setSelectedLeft(null);
  };

  const removeMatch = (leftId: string) => {
    if (answered) return;
    setMatches((prev) => prev.filter((m) => m.leftId !== leftId));
  };

  const handleSubmit = () => {
    if (answered) return;
    setAnswered(true);
    const ok =
      actividad.pares.length > 0 &&
      matches.length === actividad.pares.length &&
      matches.every((m) => m.leftId === m.rightId);
    play(ok ? 'correct' : 'wrong');
    onResponse?.(matches);
  };

  if (!actividad) return null;

  const isDark = variant === 'dark';
  const textMuted = isDark ? 'text-white' : 'text-[#111827]';

  function itemClass(tieneImagen: boolean) {
    return tieneImagen ? 'min-h-[64px]' : 'min-h-[36px]';
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-xl p-6 shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
    >
      {actividad.instruccion && (
        <p className={cn('text-sm font-medium', textMuted)}>{actividad.instruccion}</p>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          {actividad.pares.map((p) => {
            const matchIndex = matches.findIndex((m) => m.leftId === p.id);
            const isMatched = matchIndex !== -1;
            const isSelected = selectedLeft === p.id;
            const tieneImagen = ladoTieneImagen(p.izquierda);

            let feedbackClass = '';
            if (isSelected) {
              feedbackClass = isDark
                ? 'border-[#2563EB] bg-[#2563EB]/80 ring-1 ring-[#2563EB] text-white'
                : 'border-[#2563EB] bg-[#dbeafe] ring-1 ring-[#2563EB] text-[#2563EB]';
            } else if (isMatched) {
              feedbackClass = isDark
                ? 'border-[#2563EB] bg-[#2563EB]/40 text-white'
                : 'border-[#2563EB]/50 bg-[#dbeafe] text-[#111827]';
            } else {
              feedbackClass = isDark
                ? 'cursor-pointer border-white/20 bg-white/15 text-white hover:bg-white/25'
                : 'cursor-pointer border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#eff6ff]';
            }

            return (
              <div
                key={p.id}
                onClick={() => (!isMatched ? handleLeftClick(p.id) : removeMatch(p.id))}
                className={cn(
                  'flex items-center justify-between rounded-md border p-3 text-sm transition-colors overflow-hidden',
                  itemClass(tieneImagen),
                  feedbackClass,
                  answered && 'pointer-events-none',
                )}
              >
                <div className="flex-1 min-w-0 flex items-center justify-center">
                  <RenderLado
                    lado={p.izquierda}
                    textClassName={isDark ? 'text-white' : undefined}
                  />
                </div>
                {isMatched && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[10px] text-white ml-2">
                    {matchIndex + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {shuffledRight.map((r) => {
            const matchIndex = matches.findIndex((m) => m.rightId === r.id);
            const isMatched = matchIndex !== -1;
            const tieneImagen = ladoTieneImagen(r.lado);

            let feedbackClass = '';
            if (isMatched) {
              feedbackClass = isDark
                ? 'border-[#2563EB] bg-[#2563EB]/40 text-white'
                : 'border-[#2563EB]/50 bg-[#dbeafe] text-[#111827]';
            } else {
              feedbackClass = isDark
                ? 'cursor-pointer border-white/20 bg-white/15 text-white hover:bg-white/25'
                : 'cursor-pointer border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#eff6ff]';
            }

            return (
              <div
                key={r.id}
                onClick={() => !isMatched && handleRightClick(r.id)}
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3 text-sm transition-colors overflow-hidden',
                  itemClass(tieneImagen),
                  feedbackClass,
                  !isMatched && !selectedLeft && 'cursor-not-allowed opacity-70',
                  answered && 'pointer-events-none',
                )}
              >
                {isMatched && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[10px] text-white">
                    {matchIndex + 1}
                  </span>
                )}
                <div className="flex-1 min-w-0 flex items-center justify-center">
                  <RenderLado
                    lado={r.lado}
                    textClassName={isDark ? 'text-white' : undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {answered ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          <span>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={matches.length !== actividad.pares.length}>
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
}
