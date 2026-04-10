'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Plus, Trash2, XCircle } from 'lucide-react';

import type { QuizMultiple, QuizOption } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: QuizMultiple;
  modo: 'editor' | 'viewer';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: QuizMultiple }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Quiz
        </span>
        {actividad.multipleRespuesta && (
          <span className="text-[10px] text-muted-foreground">múltiple respuesta</span>
        )}
        {actividad.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {actividad.puntos} pts
          </span>
        )}
      </div>

      <p className="text-sm font-medium">{actividad.pregunta}</p>

      <ul className="space-y-1.5">
        {actividad.opciones.map((op) => (
          <li
            key={op.id}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
              op.esCorrecta
                ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                : 'border-border bg-muted/30 text-muted-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              {op.esCorrecta
                ? <CheckCircle className="size-3.5 shrink-0 text-green-600" />
                : <Circle className="size-3.5 shrink-0 opacity-30" />
              }
              {op.texto}
            </span>
            {op.esCorrecta && (
              <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                Correcta
              </span>
            )}
          </li>
        ))}
      </ul>

      {actividad.retroalimentacion?.explicacion && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
          {actividad.retroalimentacion.explicacion}
        </p>
      )}
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function OptionIcon({
  op,
  isSelected,
  submitted,
}: {
  op: QuizOption;
  isSelected: boolean;
  submitted: boolean;
}) {
  if (!submitted) {
    return isSelected
      ? <CheckCircle className="size-4 shrink-0 text-primary" />
      : <Circle className="size-4 shrink-0 text-muted-foreground/40" />;
  }
  if (isSelected && op.esCorrecta)  return <CheckCircle className="size-4 shrink-0 text-green-600" />;
  if (isSelected && !op.esCorrecta) return <XCircle className="size-4 shrink-0 text-red-500" />;
  if (!isSelected && op.esCorrecta) return <CheckCircle className="size-4 shrink-0 text-green-400 opacity-60" />;
  return <Circle className="size-4 shrink-0 opacity-20" />;
}

function ViewerView({ actividad }: { actividad: QuizMultiple }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    if (submitted) return;
    if (actividad.multipleRespuesta) {
      setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    } else {
      setSelected([id]);
    }
  }

  const correctIds = actividad.opciones.filter((o) => o.esCorrecta).map((o) => o.id);
  const isCorrect =
    submitted &&
    selected.length === correctIds.length &&
    selected.every((id) => correctIds.includes(id));

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{actividad.pregunta}</p>

      <ul className="space-y-2">
        {actividad.opciones.map((op) => {
          const isSel = selected.includes(op.id);
          return (
            <li key={op.id}>
              <button
                type="button"
                onClick={() => toggle(op.id)}
                disabled={submitted}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors',
                  !submitted && !isSel && 'border-border hover:border-primary/50 hover:bg-accent',
                  !submitted && isSel  && 'border-primary bg-primary/5',
                  submitted && isSel && op.esCorrecta  && 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300',
                  submitted && isSel && !op.esCorrecta && 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300',
                  submitted && !isSel && op.esCorrecta  && 'border-green-200 bg-green-50/50 opacity-80 dark:border-green-800',
                  submitted && !isSel && !op.esCorrecta && 'border-border opacity-40',
                )}
              >
                <OptionIcon op={op} isSelected={isSel} submitted={submitted} />
                {op.texto}
              </button>
            </li>
          );
        })}
      </ul>

      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected.length === 0}>
          Comprobar
        </Button>
      ) : (
        <div
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            isCorrect
              ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300',
          )}
        >
          {isCorrect
            ? (actividad.retroalimentacion?.correcto ?? '¡Correcto!')
            : (actividad.retroalimentacion?.incorrecto ??
              'Incorrecto. La respuesta correcta está resaltada en verde.')}
          {actividad.retroalimentacion?.mostrarExplicacion &&
            actividad.retroalimentacion.explicacion && (
              <p className="mt-1 text-xs opacity-80">
                {actividad.retroalimentacion.explicacion}
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function QuizMultipleActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} />;
}

// ─── QuizMultipleViewer (con onResponse y answered) ───────────────────────────

export function QuizMultipleViewer({
  activity,
  editorSyncKey,
  onResponse,
}: {
  activity: QuizMultiple;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setAnswered(false);
    setSelected(null);
  }, [editorSyncKey]);

  function handleSelect(index: number) {
    if (answered) return;
    const optionId = activity.opciones[index]?.id ?? null;
    if (!optionId) return;
    setSelected(optionId);
    setAnswered(true);
    onResponse?.(optionId);
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{activity.pregunta}</p>
      <ul className="space-y-2">
        {activity.opciones.map((op, idx) => {
          const isSel = selected === op.id;
          return (
            <li key={op.id}>
              <button
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors',
                  !answered && 'border-border hover:border-primary/50 hover:bg-accent',
                  answered && isSel && 'border-primary bg-primary/5',
                  answered && !isSel && 'border-border opacity-40',
                )}
              >
                {isSel
                  ? <CheckCircle className="size-4 shrink-0 text-primary" />
                  : <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                }
                {op.texto}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
          <span>✓</span> ¡Respuesta enviada!
        </div>
      )}
    </div>
  );
}

// ─── Activity Editor ──────────────────────────────────────────────────────────

const DEFAULTS: QuizMultiple = {
  tipo: 'quiz_multiple',
  pregunta: '',
  opciones: [],
  shuffleOptions: false,
};

function normalize(a: QuizMultiple | null | undefined): QuizMultiple {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'quiz_multiple' };
}

interface EditorProps {
  editorSyncKey: string;
  activity: QuizMultiple | null;
  onChange: (a: QuizMultiple) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

export function QuizMultipleActivityEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: EditorProps) {
  const { local, setLocal, flush, commitImmediate, schedulePersist } = useActivityEditor<QuizMultiple>({
    data: activity,
    editorSyncKey,
    normalize,
    onChange,
  });

  function updateImmediate(partial: Partial<QuizMultiple>) {
    commitImmediate({ ...local, ...partial, tipo: 'quiz_multiple' });
  }

  function updateText(partial: Partial<QuizMultiple>) {
    const next = { ...local, ...partial, tipo: 'quiz_multiple' as const };
    setLocal(next);
    schedulePersist(next);
  }

  function addOption() {
    if (local.opciones.length >= 6) return;
    const newOption: QuizOption = { id: crypto.randomUUID(), texto: '', esCorrecta: false };
    updateImmediate({ opciones: [...local.opciones, newOption] });
  }

  function updateOptionText(id: string, texto: string) {
    const nextOpciones = local.opciones.map(o => o.id === id ? { ...o, texto } : o);
    setLocal({ ...local, opciones: nextOpciones, tipo: 'quiz_multiple' });
    schedulePersist({ ...local, opciones: nextOpciones, tipo: 'quiz_multiple' });
  }

  function removeOption(id: string) {
    const nextOpciones = local.opciones.filter(o => o.id !== id);
    updateImmediate({ opciones: nextOpciones });
  }

  function setCorrectOption(id: string) {
    // Para single correct answer (por defecto si no usamos checkbox de multipleRespuesta)
    const nextOpciones = local.opciones.map(o => ({
      ...o,
      esCorrecta: o.id === id
    }));
    updateImmediate({ opciones: nextOpciones });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(60vh,400px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Quiz
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
          <Label className="text-[11px] font-medium">Pregunta</Label>
          <Input
            value={local.pregunta}
            onChange={(e) => updateText({ pregunta: e.target.value })}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="Escribe la pregunta..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium">Opciones</Label>
          <div className="space-y-1.5">
            {local.opciones.map((op, idx) => (
              <div key={op.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`quiz-correct-${editorSyncKey}`}
                  checked={op.esCorrecta}
                  onChange={() => setCorrectOption(op.id)}
                  className="size-4 shrink-0 cursor-pointer"
                />
                <Input
                  value={op.texto}
                  onChange={(e) => updateOptionText(op.id, e.target.value)}
                  onBlur={flush}
                  className={cn('h-8 text-xs', op.esCorrecta && 'border-green-300 bg-green-50/30')}
                  placeholder={`Opción ${idx + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOption(op.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
          {local.opciones.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="mt-1 h-8 text-xs w-full"
            >
              <Plus className="mr-1.5 size-3" /> Agregar opción
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/15 px-2 py-1.5">
          <Label className="cursor-pointer text-[11px] font-medium leading-tight">
            Mezclar opciones
          </Label>
          <Switch
            className="scale-90"
            checked={local.shuffleOptions ?? false}
            onCheckedChange={(checked) => updateImmediate({ shuffleOptions: checked })}
          />
        </div>
      </div>
    </div>
  );
}
