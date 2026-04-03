'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import type { MatchPairs } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function normalize(a: MatchPairs | null | undefined): MatchPairs {
  if (!a) {
    return {
      tipo: 'emparejar',
      instruccion: '',
      pares: [
        { id: generateId(), izquierda: '', derecha: '' },
        { id: generateId(), izquierda: '', derecha: '' },
      ],
    };
  }
  return { ...a, tipo: 'emparejar' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editorSyncKey?: string;
  data: MatchPairs | null;
  onChange: (data: MatchPairs) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function MatchPairsActivityEditor({
  editorSyncKey,
  data,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<MatchPairs>({
      data,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateText(partial: Partial<MatchPairs>) {
    const next: MatchPairs = { ...local, ...partial, tipo: 'emparejar' };
    setLocal(next);
    schedulePersist(next);
  }

  function updateImmediate(partial: Partial<MatchPairs>) {
    commitImmediate({ ...local, ...partial, tipo: 'emparejar' });
  }

  function addPair() {
    if (local.pares.length >= 8) return;
    updateImmediate({
      pares: [...local.pares, { id: generateId(), izquierda: '', derecha: '' }],
    });
  }

  function removePair(id: string) {
    if (local.pares.length <= 2) return;
    updateImmediate({
      pares: local.pares.filter((p) => p.id !== id),
    });
  }

  function updatePairField(id: string, field: 'izquierda' | 'derecha', value: string) {
    const nextPares = local.pares.map((p) =>
      p.id === id ? { ...p, [field]: value } : p,
    );
    updateText({ pares: nextPares });
  }

  function movePair(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === local.pares.length - 1) return;

    const newPares = [...local.pares];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newPares[index], newPares[swapIndex]] = [newPares[swapIndex], newPares[index]];

    updateImmediate({ pares: newPares });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(65vh,480px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
          Emparejar columnas
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Los cambios de texto se guardan al pausar la escritura
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            title="Eliminar esta actividad"
            aria-label="Eliminar esta actividad"
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
        <div className="space-y-1">
          <Label htmlFor="mp-instructions" className="text-[11px] font-medium">
            Instrucciones generales
          </Label>
          <Textarea
            id="mp-instructions"
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="Ej: Empareja cada concepto con su definición…"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium">Pares (mínimo 2, máximo 8)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPair}
              disabled={local.pares.length >= 8}
              className="h-6 px-2 text-[10px]"
            >
              <Plus className="mr-1 size-3" />
              Añadir par
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {local.pares.map((pair, idx) => (
              <div
                key={pair.id}
                className="group relative flex items-start gap-1 rounded-md border border-border bg-muted/10 p-1.5"
              >
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 rounded-[4px] text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                    disabled={idx === 0}
                    onClick={() => movePair(idx, 'up')}
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 rounded-[4px] text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                    disabled={idx === local.pares.length - 1}
                    onClick={() => movePair(idx, 'down')}
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Input
                      value={pair.izquierda}
                      onChange={(e) => updatePairField(pair.id, 'izquierda', e.target.value)}
                      onBlur={flush}
                      className="h-8 text-xs"
                      placeholder="Concepto (izq)"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      value={pair.derecha}
                      onChange={(e) => updatePairField(pair.id, 'derecha', e.target.value)}
                      onBlur={flush}
                      className="h-8 text-xs"
                      placeholder="Definición (der)"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 size-6 shrink-0 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                  disabled={local.pares.length <= 2}
                  onClick={() => removePair(pair.id)}
                  title={local.pares.length <= 2 ? 'Se requieren mínimo 2 pares' : 'Eliminar par'}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
