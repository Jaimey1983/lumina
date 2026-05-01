'use client';

import { Plus, Trash2 } from 'lucide-react';

import type { TorneoActivity } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

function normalizeTorneo(raw: TorneoActivity | null | undefined): TorneoActivity {
  const fb = BLOCK_FALLBACKS.torneo;
  if (!raw || raw.tipo !== 'torneo') {
    return {
      tipo: 'torneo',
      preguntas: fb.preguntas.map((p) => ({
        enunciado: p.enunciado,
        opciones: [...p.opciones],
        correcta: p.correcta,
        tiempoSegundos: p.tiempoSegundos,
      })),
      puntosBase: fb.puntosBase,
      bonusVelocidad: fb.bonusVelocidad,
    };
  }
  return {
    ...raw,
    preguntas: (raw.preguntas ?? []).map((p) => ({
      enunciado: p.enunciado ?? '',
      opciones: [...(p.opciones ?? [])].slice(0, 8),
      correcta: p.correcta ?? '',
      tiempoSegundos: Math.max(5, p.tiempoSegundos ?? 20),
    })),
    puntosBase: raw.puntosBase ?? 1000,
    bonusVelocidad: raw.bonusVelocidad ?? 500,
  };
}

function padFourOpciones(opciones: string[]): string[] {
  const o = [...opciones];
  while (o.length < 4) o.push('');
  return o.slice(0, 4);
}

export function TorneoActivityEditor({
  editorSyncKey,
  activity,
  canvasLayout,
  isSelected,
  onChange,
  onRemove,
}: {
  editorSyncKey: string;
  activity: TorneoActivity;
  canvasLayout: boolean;
  isSelected: boolean;
  onChange: (next: TorneoActivity) => void;
  onRemove?: () => void;
}) {
  const { local, flush, schedulePersist, commitImmediate } = useActivityEditor({
    data: activity,
    editorSyncKey,
    normalize: normalizeTorneo,
    onChange,
  });

  function updatePregunta(
    index: number,
    patch: Partial<TorneoActivity['preguntas'][number]>,
  ) {
    const next = { ...local };
    const pq = [...next.preguntas];
    const cur = pq[index];
    if (!cur) return;
    pq[index] = { ...cur, ...patch };
    next.preguntas = pq;
    schedulePersist(next);
  }

  function addPregunta() {
    const next = {
      ...local,
      preguntas: [
        ...local.preguntas,
        {
          enunciado: 'Nueva pregunta',
          opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correcta: 'Opción A',
          tiempoSegundos: 20,
        },
      ],
    };
    commitImmediate(next);
  }

  function removePregunta(index: number) {
    if (local.preguntas.length <= 1) return;
    const pq = local.preguntas.filter((_, i) => i !== index);
    commitImmediate({ ...local, preguntas: pq });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(70vh,520px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-amber-400/50',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#fffbeb] px-2 py-1.5">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
          Torneo
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[#9ca3af]">
          En vivo — el docente controla el ritmo por Socket.IO
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-[#9ca3af] hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              flush();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium">Puntos base</Label>
            <Input
              type="number"
              min={0}
              value={local.puntosBase}
              onChange={(e) =>
                schedulePersist({
                  ...local,
                  puntosBase: Math.max(0, Number(e.target.value) || 0),
                })
              }
              onBlur={flush}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium">Bonus velocidad</Label>
            <Input
              type="number"
              min={0}
              value={local.bonusVelocidad}
              onChange={(e) =>
                schedulePersist({
                  ...local,
                  bonusVelocidad: Math.max(0, Number(e.target.value) || 0),
                })
              }
              onBlur={flush}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {local.preguntas.map((preg, pi) => {
          const opts = padFourOpciones(preg.opciones);
          return (
            <div
              key={pi}
              className="space-y-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#111827]">
                  Pregunta {pi + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-[#9ca3af] hover:text-red-600"
                  disabled={local.preguntas.length <= 1}
                  onClick={() => removePregunta(pi)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Enunciado</Label>
                <Input
                  value={preg.enunciado}
                  onChange={(e) => updatePregunta(pi, { enunciado: e.target.value })}
                  onBlur={flush}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Tiempo (seg)</Label>
                <Input
                  type="number"
                  min={5}
                  value={preg.tiempoSegundos}
                  onChange={(e) =>
                    updatePregunta(pi, {
                      tiempoSegundos: Math.max(5, Number(e.target.value) || 5),
                    })
                  }
                  onBlur={flush}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {opts.map((op, oi) => (
                  <div key={oi} className="space-y-0.5">
                    <Label className="text-[10px] text-[#6b7280]">
                      Opción {String.fromCharCode(65 + oi)}
                    </Label>
                    <Input
                      value={op}
                      onChange={(e) => {
                        const nextOpts = [...opts];
                        nextOpts[oi] = e.target.value;
                        updatePregunta(pi, { opciones: nextOpts });
                      }}
                      onBlur={flush}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Respuesta correcta</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2 text-xs text-[#111827]"
                  value={
                    opts.some((x) => x.trim() === preg.correcta.trim())
                      ? preg.correcta
                      : (opts.find((x) => x.trim()) ?? '')
                  }
                  onChange={(e) => updatePregunta(pi, { correcta: e.target.value })}
                >
                  {opts.filter((x) => x.trim()).length === 0 ? (
                    <option value="">— Agrega opciones —</option>
                  ) : (
                    opts.filter((x) => x.trim()).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs border-amber-200 bg-amber-50/50 hover:bg-amber-50"
          onClick={addPregunta}
        >
          <Plus className="mr-1 size-3" /> Agregar pregunta
        </Button>
      </div>
    </div>
  );
}
