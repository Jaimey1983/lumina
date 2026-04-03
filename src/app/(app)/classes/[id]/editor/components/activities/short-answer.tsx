'use client';

import type { ShortAnswerActivity } from '@/types/slide.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: ShortAnswerActivity = {
  tipo: 'short_answer',
  question: '',
  expectedAnswer: '',
  caseSensitive: false,
  maxLength: 200,
};

function clampMaxLength(n: number): number {
  return Math.min(1000, Math.max(10, Math.round(Number.isFinite(n) ? n : DEFAULTS.maxLength)));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activity: ShortAnswerActivity | null;
  onChange: (a: ShortAnswerActivity) => void;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function ShortAnswerActivityEditor({ activity, onChange }: Props) {
  const data = activity ?? DEFAULTS;

  function patch(partial: Partial<ShortAnswerActivity>) {
    onChange({ ...data, ...partial, tipo: 'short_answer' });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          Respuesta corta
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sa-question" className="text-xs font-medium">
          Pregunta
        </Label>
        <Textarea
          id="sa-question"
          value={data.question}
          onChange={(e) => patch({ question: e.target.value })}
          rows={3}
          className="min-h-[4.5rem] resize-y text-sm"
          placeholder="Escribe la pregunta…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sa-expected" className="text-xs font-medium">
          Respuesta modelo (referencia)
        </Label>
        <Input
          id="sa-expected"
          value={data.expectedAnswer}
          onChange={(e) => patch({ expectedAnswer: e.target.value })}
          className="text-sm"
          placeholder="Respuesta esperada para calificar o como referencia"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sa-hint" className="text-xs font-medium">
          Pista (opcional)
        </Label>
        <Input
          id="sa-hint"
          value={data.hint ?? ''}
          onChange={(e) => patch({ hint: e.target.value || undefined })}
          className="text-sm"
          placeholder="Pista para el estudiante"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sa-max" className="text-xs font-medium">
          Máx. caracteres
        </Label>
        <Input
          id="sa-max"
          type="number"
          min={10}
          max={1000}
          value={data.maxLength}
          onChange={(e) => patch({ maxLength: clampMaxLength(Number(e.target.value)) })}
          className="text-sm tabular-nums"
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2.5">
        <Label htmlFor="sa-case" className="cursor-pointer text-xs font-medium leading-snug">
          Distinguir mayúsculas
        </Label>
        <Switch
          id="sa-case"
          checked={data.caseSensitive}
          onCheckedChange={(checked) => patch({ caseSensitive: checked })}
        />
      </div>
    </div>
  );
}
