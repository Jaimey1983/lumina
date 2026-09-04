'use client';

import { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerateActivity, type AiActivityType } from '@/hooks/api/use-ai';

import {
  AI_ACTIVITY_OPTIONS,
  aiActivityHasUsableContent,
  defaultCountForAiActivity,
  normalizeAiActivity,
} from './activities-ai-normalize';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  desempenoEnunciado?: string;
  hasActivity?: boolean;
  onInsertActivity?: (activityContent: Record<string, unknown>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivitiesAiPanel({ desempenoEnunciado, hasActivity, onInsertActivity }: Props) {
  const [texto, setTexto] = useState(desempenoEnunciado ?? '');
  const [tipo, setTipo] = useState<AiActivityType>('quiz_multiple');
  const { mutate: generateActivity, isPending } = useGenerateActivity();
  const selected = AI_ACTIVITY_OPTIONS.find((o) => o.value === tipo);

  const handleGenerar = (full: boolean) => {
    if (!texto.trim()) return;
    generateActivity(
      { text: texto.trim(), type: tipo, count: defaultCountForAiActivity(tipo, full) },
      {
        onSuccess: (data) => {
          const activityContent = normalizeAiActivity(tipo, data.activity ?? data);
          if (!aiActivityHasUsableContent(activityContent)) {
            toast.error('La IA no generó contenido usable. Intenta con un texto más específico.');
            return;
          }
          onInsertActivity?.(activityContent);
          toast.success('Actividad generada e insertada');
        },
        onError: () => toast.error('Error al generar. Intenta de nuevo.'),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {hasActivity && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Genera actividades automáticamente con IA. Elige el tipo y el tema.
      </p>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Tipo de actividad</Label>
        <Select
          value={tipo}
          onValueChange={(v) => setTipo(v as AiActivityType)}
          disabled={hasActivity || isPending}
        >
          <SelectTrigger className="h-8 text-xs" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_ACTIVITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <p className="text-[10px] leading-snug text-muted-foreground">{selected.hint}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Tema o texto base</Label>
        <Input
          placeholder="Ej: La fotosíntesis en plantas C3"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={hasActivity || isPending}
          className="text-xs"
        />
      </div>

      <Button
        size="sm"
        className="w-full gap-2"
        disabled={hasActivity || !texto.trim() || isPending}
        onClick={() => handleGenerar(false)}
      >
        <Sparkles className="size-3.5" />
        {isPending ? 'Generando…' : 'Generar e insertar'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        disabled={hasActivity || !texto.trim() || isPending}
        onClick={() => handleGenerar(true)}
      >
        <Wand2 className="size-3.5" />
        {isPending ? 'Generando…' : 'Generar actividad completa'}
      </Button>

      {desempenoEnunciado && (
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Contexto curricular
          </p>
          <div className="rounded-md border border-border bg-muted/30 p-2">
            <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-4">
              {desempenoEnunciado}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
