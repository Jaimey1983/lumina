'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import type { WordCloud } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

// Editor-only fields that ride along with the persisted activity data.
export type WordCloudLocal = WordCloud & {
  maxCaracteresPorPalabra?: number;
  mostrarTiempoReal?: boolean;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: WordCloudLocal = {
  tipo: 'nube_palabras',
  instruccion: '',
  maxPalabrasPorUsuario: 3,
  maxCaracteresPorPalabra: 20,
  filtrarPalabrasComunes: false,
  mostrarTiempoReal: true,
};

function clampMaxWords(n: number): number {
  return Math.min(5, Math.max(1, Math.round(Number.isFinite(n) ? n : DEFAULTS.maxPalabrasPorUsuario!)));
}

function clampMaxChars(n: number): number {
  return Math.min(30, Math.max(5, Math.round(Number.isFinite(n) ? n : DEFAULTS.maxCaracteresPorPalabra!)));
}

function normalize(a: WordCloudLocal | null | undefined): WordCloudLocal {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'nube_palabras' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editorSyncKey?: string;
  data: WordCloudLocal | null;
  onChange: (data: WordCloudLocal) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function WordCloudActivityEditor({
  editorSyncKey,
  data,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<WordCloudLocal>({
      data,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateText(partial: Partial<WordCloudLocal>) {
    const next: WordCloudLocal = { ...local, ...partial, tipo: 'nube_palabras' };
    setLocal(next);
    schedulePersist(next);
  }

  function updateImmediate(partial: Partial<WordCloudLocal>) {
    commitImmediate({ ...local, ...partial, tipo: 'nube_palabras' });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(52vh,360px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
          Nube de palabras
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

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        <div className="space-y-1">
          <Label htmlFor="wc-question" className="text-[11px] font-medium">
            Tema / Pregunta
          </Label>
          <Textarea
            id="wc-question"
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="¿En una palabra, cómo describes el tema de hoy?"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="wc-max-words" className="text-[11px] font-medium">
              Palabras por estudiante
            </Label>
            <Input
              id="wc-max-words"
              type="number"
              min={1}
              max={5}
              value={local.maxPalabrasPorUsuario ?? 3}
              onChange={(e) =>
                updateImmediate({ maxPalabrasPorUsuario: Number(e.target.value) })
              }
              onBlur={(e) =>
                updateImmediate({ maxPalabrasPorUsuario: clampMaxWords(Number(e.target.value)) })
              }
              className="h-8 text-xs tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wc-max-chars" className="text-[11px] font-medium">
              Máx. caracteres por palabra
            </Label>
            <Input
              id="wc-max-chars"
              type="number"
              min={5}
              max={30}
              value={local.maxCaracteresPorPalabra ?? 20}
              onChange={(e) =>
                updateImmediate({ maxCaracteresPorPalabra: Number(e.target.value) })
              }
              onBlur={(e) =>
                updateImmediate({ maxCaracteresPorPalabra: clampMaxChars(Number(e.target.value)) })
              }
              className="h-8 text-xs tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/15 px-2 py-1.5">
            <Label htmlFor="wc-moderate" className="cursor-pointer text-[11px] font-medium leading-tight">
              Moderar respuestas
            </Label>
            <Switch
              id="wc-moderate"
              className="scale-90"
              checked={local.filtrarPalabrasComunes ?? false}
              onCheckedChange={(checked) => updateImmediate({ filtrarPalabrasComunes: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/15 px-2 py-1.5">
            <Label htmlFor="wc-realtime" className="cursor-pointer text-[11px] font-medium leading-tight">
              Mostrar resultados en tiempo real
            </Label>
            <Switch
              id="wc-realtime"
              className="scale-90"
              checked={local.mostrarTiempoReal ?? true}
              onCheckedChange={(checked) => updateImmediate({ mostrarTiempoReal: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

export function WordCloudViewer({
  activity,
  onAnswer,
}: {
  activity: WordCloudLocal;
  onAnswer?: (word: string) => void;
}) {
  const [word, setWord] = useState('');
  const [submittedWords, setSubmittedWords] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    const cleanWord = word.trim().toUpperCase();
    setSubmittedWords((prev) => [...prev, cleanWord]);
    if (onAnswer) onAnswer(cleanWord);
    setWord('');
  };

  const wordCounts = submittedWords.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!activity) return null;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-center text-base font-medium text-foreground">
        {activity.instruccion || '¿En una palabra, cómo describes el tema de hoy?'}
      </p>

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm items-center gap-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Escribe tu palabra..."
          maxLength={activity.maxCaracteresPorPalabra ?? 20}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!word.trim() || (activity.maxPalabrasPorUsuario ? submittedWords.length >= activity.maxPalabrasPorUsuario : false)}
        >
          Enviar
        </Button>
      </form>

      {activity.maxPalabrasPorUsuario && (
        <p className="mt-[-1rem] text-center text-xs text-muted-foreground">
          {submittedWords.length} de {activity.maxPalabrasPorUsuario} palabras enviadas
        </p>
      )}

      {activity.mostrarTiempoReal !== false && Object.entries(wordCounts).length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t py-8">
          {Object.entries(wordCounts).map(([w, count]) => (
            <span
              key={w}
              className="font-bold text-primary transition-all"
              style={{ fontSize: `${Math.min(3, 1 + (count - 1) * 0.2)}rem`, opacity: Math.min(1, 0.5 + count * 0.2) }}
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
