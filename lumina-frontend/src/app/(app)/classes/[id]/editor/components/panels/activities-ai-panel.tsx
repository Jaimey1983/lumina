'use client';

import { useState } from 'react';
import { Sparkles, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { useGenerateQuiz, type QuizType, type GeneratedQuestion } from '@/hooks/api/use-ai';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  desempenoEnunciado?: string;
  hasActivity?: boolean;
  onInsertActivity?: (activityContent: Record<string, unknown>) => void;
}

// ─── Helpers — convertir GeneratedQuestion → formato actividad Lumina ─────────

function buildQuizMultipleActivity(
  questions: GeneratedQuestion[],
): Record<string, unknown> {
  const q = questions[0];
  return {
    tipo: 'quiz_multiple',
    pregunta: q?.question ?? '',
    opciones:
      q?.options?.map((texto, i) => ({
        id: `op-${i}`,
        texto,
        esCorrecta: i === q.correctIndex,
      })) ?? [],
    puntos: 10,
    ...(q?.explanation
      ? { retroalimentacion: { explicacion: q.explanation, mostrarExplicacion: true } }
      : {}),
  };
}

function buildTrueFalseActivity(
  questions: GeneratedQuestion[],
): Record<string, unknown> {
  const q = questions[0];
  return {
    tipo: 'verdadero_falso',
    afirmacion: q?.question ?? '',
    respuestaCorrecta: q?.correctIndex === 0,
    puntos: 5,
    ...(q?.explanation
      ? { retroalimentacion: { explicacion: q.explanation, mostrarExplicacion: true } }
      : {}),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivitiesAiPanel({ desempenoEnunciado, hasActivity, onInsertActivity }: Props) {
  const [expandido, setExpandido] = useState<'pregunta' | 'actividad' | null>(null);
  const [texto, setTexto] = useState(desempenoEnunciado ?? '');
  const [tipo, setTipo] = useState<QuizType>('MultipleChoice');
  const { mutate: generateQuiz, isPending } = useGenerateQuiz();

  const handleGenerarPregunta = () => {
    if (!texto.trim()) return;
    generateQuiz(
      { text: texto.trim(), count: 1, type: tipo },
      {
        onSuccess: (data) => {
          if (!data.questions.length) {
            toast.error('La IA no generó preguntas. Intenta con un texto más específico.');
            return;
          }
          let activityContent: Record<string, unknown>;
          if (tipo === 'TrueFalse') {
            activityContent = buildTrueFalseActivity(data.questions);
          } else {
            activityContent = buildQuizMultipleActivity(data.questions);
          }
          onInsertActivity?.(activityContent);
          toast.success('Actividad generada e insertada');
          setExpandido(null);
        },
        onError: () => toast.error('Error al generar. Intenta de nuevo.'),
      },
    );
  };

  const handleGenerarActividad = () => {
    if (!texto.trim()) return;
    generateQuiz(
      { text: texto.trim(), count: 5, type: 'MultipleChoice' },
      {
        onSuccess: (data) => {
          if (!data.questions.length) {
            toast.error('La IA no generó preguntas.');
            return;
          }
          const activityContent = buildQuizMultipleActivity(data.questions);
          onInsertActivity?.(activityContent);
          toast.success('Actividad generada e insertada');
          setExpandido(null);
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
        Genera actividades automáticamente con IA.
      </p>

      {/* ── Botón 1: Añadir pregunta ── */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={hasActivity}
          className="w-full justify-between gap-2"
          onClick={() => setExpandido(expandido === 'pregunta' ? null : 'pregunta')}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Añadir pregunta con IA
          </span>
          {expandido === 'pregunta' ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
        {expandido === 'pregunta' && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tema o texto base</Label>
              <Input
                placeholder="Ej: La fotosíntesis en plantas C3"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tipo de pregunta</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as QuizType)}>
                <SelectTrigger className="h-8 text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MultipleChoice" className="text-xs">
                    Selección múltiple
                  </SelectItem>
                  <SelectItem value="TrueFalse" className="text-xs">
                    Verdadero / Falso
                  </SelectItem>
                  <SelectItem value="FillInTheBlanks" className="text-xs">
                    Completar espacios
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="w-full gap-2"
              disabled={!texto.trim() || isPending}
              onClick={handleGenerarPregunta}
            >
              <Sparkles className="size-3.5" />
              {isPending ? 'Generando…' : 'Generar e insertar'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Botón 2: Generar actividad completa ── */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={hasActivity}
          className="w-full justify-between gap-2"
          onClick={() => setExpandido(expandido === 'actividad' ? null : 'actividad')}
        >
          <span className="flex items-center gap-2">
            <Wand2 className="size-4" />
            Generar actividad con IA
          </span>
          {expandido === 'actividad' ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
        {expandido === 'actividad' && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tema o texto base</Label>
              <Input
                placeholder="Ej: Revolución francesa, causas y consecuencias"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="text-xs"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Genera un quiz de 5 preguntas de selección múltiple listas para insertar.
            </p>
            <Button
              size="sm"
              className="w-full gap-2"
              disabled={!texto.trim() || isPending}
              onClick={handleGenerarActividad}
            >
              <Wand2 className="size-3.5" />
              {isPending ? 'Generando…' : 'Generar quiz completo'}
            </Button>
          </div>
        )}
      </div>

      {/* Desempeño como contexto */}
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
