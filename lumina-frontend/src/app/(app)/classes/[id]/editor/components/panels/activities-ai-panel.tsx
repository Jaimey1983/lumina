'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lumina/ui/select';
import { cn } from '@/lib/utils';
import {
  useGenerateActivity,
  useRefineActivity,
  type AiActivityType,
} from '@/hooks/api/use-ai';
import { buildCurricularContextTexto } from '../../lib/curricular-context-texto';
import type { IaPanelCurricularContext } from './flyout-left-panels';

import {
  AI_ACTIVITY_OPTIONS,
  activityTitleFromContent,
  aiActivityHasUsableContent,
  defaultCountForAiActivity,
  normalizeAiActivity,
} from './activities-ai-normalize';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  desempenoEnunciado?: string;
  hasActivity?: boolean;
  onInsertActivity?: (activityContent: Record<string, unknown>) => void;
  /** Motor curricular único (J6.4/J6.5) — contexto heredado de la Entrada 3. */
  curricularContext?: IaPanelCurricularContext;
}

interface PreviewState {
  tipo: AiActivityType;
  content: Record<string, unknown>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivitiesAiPanel({
  desempenoEnunciado,
  hasActivity,
  onInsertActivity,
  curricularContext,
}: Props) {
  // J6.5: si la clase ya tiene un `desempenoId` (Entrada 2, J6.3), el
  // contexto elegido en la Entrada 3 (J6.4: indicadores abordados + temas +
  // subtemas) se hereda tal cual — no se vuelve a pedir un tema libre. Sin
  // `desempenoId` (clase legado o sin configurar), se degrada al flujo
  // manual de siempre.
  const tieneContextoJ6 = Boolean(curricularContext?.desempenoId);
  const contextoClase = curricularContext?.contextoClase;
  const indicadoresAbordados = contextoClase?.indicadoresAbordados ?? [];
  const temasClase = contextoClase?.temas ?? [];
  const subtemasClase = contextoClase?.subtemas ?? [];
  const heredarEnunciado = curricularContext?.desempenoEnunciado ?? desempenoEnunciado ?? null;

  const [texto, setTexto] = useState(desempenoEnunciado ?? '');
  const [tipo, setTipo] = useState<AiActivityType>('quiz_multiple');
  const { mutate: generateActivity, isPending } = useGenerateActivity();
  const selected = AI_ACTIVITY_OPTIONS.find((o) => o.value === tipo);

  // ── J8 — vista previa + chat de refinamiento (mismo patrón que IaPanel:
  // generar NO inserta de inmediato, el docente ajusta y luego inserta) ──────
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [refinementInput, setRefinementInput] = useState('');
  const { mutate: refineActivity, isPending: isRefining } = useRefineActivity();

  const curriculumContextTexto = useMemo(() => {
    if (!tieneContextoJ6) return undefined;
    return buildCurricularContextTexto({
      desempenoEnunciado: heredarEnunciado,
      indicadoresAbordados,
      temas: temasClase,
      subtemas: subtemasClase,
    });
  }, [tieneContextoJ6, heredarEnunciado, indicadoresAbordados, temasClase, subtemasClase]);

  // Con contexto J6: el "tema" que viaja en `text` (requerido por el DTO)
  // sale de lo que el docente ya eligió en la Entrada 3, no de un input
  // nuevo — temas > subtemas > el enunciado del desempeño como último
  // recurso.
  const effectiveTexto = tieneContextoJ6
    ? (temasClase.join(', ') || subtemasClase.join(', ') || heredarEnunciado || '')
    : texto;

  const handleGenerar = (full: boolean) => {
    if (!effectiveTexto.trim()) return;
    generateActivity(
      {
        text: effectiveTexto.trim(),
        type: tipo,
        count: defaultCountForAiActivity(tipo, full),
        curriculumContext: curriculumContextTexto,
      },
      {
        onSuccess: (data) => {
          const activityContent = normalizeAiActivity(tipo, data.activity ?? data);
          if (!aiActivityHasUsableContent(activityContent)) {
            toast.error('La IA no generó contenido usable. Intenta con un texto más específico.');
            return;
          }
          setPreview({ tipo, content: activityContent });
          setConversationHistory([]);
          toast.success('Actividad generada. Revísala y ajústala antes de insertar.');
        },
        onError: () => toast.error('Error al generar. Intenta de nuevo.'),
      },
    );
  };

  const handleRefinar = useCallback(() => {
    if (!refinementInput.trim() || !preview) return;
    const instruction = refinementInput.trim();
    setRefinementInput('');
    const newHistory = [...conversationHistory, { role: 'user' as const, content: instruction }];
    setConversationHistory(newHistory);
    refineActivity(
      {
        type: preview.tipo,
        currentActivity: preview.content,
        instruction,
        conversationHistory: newHistory,
      },
      {
        onSuccess: (data) => {
          const activityContent = normalizeAiActivity(preview.tipo, data.activity ?? data);
          setPreview({ tipo: preview.tipo, content: activityContent });
          setConversationHistory((prev) => [
            ...prev,
            { role: 'assistant' as const, content: `Ajustado: "${instruction}".` },
          ]);
        },
        onError: () => toast.error('Error al ajustar. Intenta de nuevo.'),
      },
    );
  }, [refinementInput, preview, conversationHistory, refineActivity]);

  const handleInsertar = () => {
    if (!preview) return;
    onInsertActivity?.(preview.content);
    toast.success(
      preview.tipo === 'puzzle_imagen'
        ? 'Actividad insertada — sube la imagen desde las propiedades del bloque.'
        : 'Actividad insertada',
    );
    setPreview(null);
    setConversationHistory([]);
  };

  const previewTitle = preview ? activityTitleFromContent(preview.content) : '';

  return (
    <div className="flex flex-col gap-3 p-4">
      {hasActivity && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Genera actividades automáticamente con IA.{' '}
        {tieneContextoJ6
          ? 'La actividad se contextualiza con el desempeño e indicadores de esta clase — solo elige el tipo.'
          : 'Elige el tipo y el tema.'}
      </p>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Tipo de actividad</Label>
        <Select
          value={tipo}
          onValueChange={(v) => {
            setTipo(v as AiActivityType);
            setPreview(null);
            setConversationHistory([]);
          }}
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

      {!tieneContextoJ6 && (
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
      )}

      <Button
        size="sm"
        className="w-full gap-2"
        disabled={hasActivity || !effectiveTexto.trim() || isPending}
        onClick={() => handleGenerar(false)}
      >
        <Sparkles className="size-3.5" />
        {isPending ? 'Generando…' : preview ? 'Generar de nuevo' : 'Generar'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        disabled={hasActivity || !effectiveTexto.trim() || isPending}
        onClick={() => handleGenerar(true)}
      >
        <Wand2 className="size-3.5" />
        {isPending ? 'Generando…' : 'Generar actividad completa'}
      </Button>

      {preview && (
        <div className="flex flex-col gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              Vista previa
            </p>
            <p className="text-[11px] leading-snug text-foreground line-clamp-3">{previewTitle}</p>
          </div>
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleInsertar}
          >
            <Check className="size-3.5" />
            Insertar en el slide
          </Button>

          {/* ── J8 — chat de refinamiento (mismo patrón que IaPanel) ── */}
          <div className="space-y-2 border-t border-border pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ajustar con IA
            </p>
            {conversationHistory.length > 0 && (
              <div className="max-h-32 space-y-1.5 overflow-y-auto">
                {conversationHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 text-[11px] leading-snug',
                      msg.role === 'user'
                        ? 'ml-4 bg-primary/10 text-primary'
                        : 'mr-4 bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                placeholder='Ej: "agrega dos preguntas más", "hazla más fácil"'
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isRefining && handleRefinar()}
                className="h-8 flex-1 text-xs"
                disabled={isRefining}
              />
              <Button
                type="button"
                size="sm"
                className="h-8 px-2.5"
                disabled={!refinementInput.trim() || isRefining}
                onClick={handleRefinar}
              >
                {isRefining ? '…' : 'Ajustar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tieneContextoJ6 ? (
        <div className="flex flex-col gap-2 mt-1">
          {heredarEnunciado && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Desempeño
              </p>
              <div className="rounded-md border border-border bg-muted/30 p-2">
                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-4">
                  {heredarEnunciado}
                </p>
              </div>
            </div>
          )}
          {indicadoresAbordados.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Indicadores abordados
              </p>
              <ul className="space-y-0.5 rounded-md border border-border bg-muted/30 p-2">
                {indicadoresAbordados.map((ind) => (
                  <li key={ind} className="text-[11px] leading-relaxed text-muted-foreground">
                    · {ind}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(temasClase.length > 0 || subtemasClase.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {[...temasClase, ...subtemasClase].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        desempenoEnunciado && (
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
        )
      )}
    </div>
  );
}
