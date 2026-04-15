'use client';

import { useState, type CSSProperties } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/slide.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentResponse {
  studentId: string;
  /** Nombre mostrado (viene del viewer / evento response-update). */
  studentName?: string;
  correct: boolean | null;
  activityType: string;
  details?: { label: string; correct: boolean | null }[];
  response?: unknown;
}

export interface LiveResponsesPanelProps {
  liveResponses: Map<string, { activityType: string; responses: StudentResponse[] }>;
  activeSlideId: string;
  activeSlideIndex: number;
  activeActivity?: Activity | null;
  /** Sesión autónoma activa: muestra cuántos estudiantes están en cada slide. */
  showAutonomousSlideProgress?: boolean;
  /** Índice 0-based → número de estudiantes con el cursor en ese slide. */
  autonomousStudentsPerSlide?: number[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function colorFromId(id: string): string {
  const colors = [
    '#F97316', '#3B82F6', '#10B981', '#8B5CF6',
    '#EF4444', '#F59E0B', '#06B6D4', '#EC4899',
  ];
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length]!;
}

/** Iniciales: primera + última palabra; una sola palabra → una letra; sin nombre → ? */
function liveResponseInitials(studentName: string | undefined): string {
  const trimmed = (studentName ?? '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first?.[0]) return '?';
  if (parts.length === 1) return first[0].toUpperCase();
  const last = parts[parts.length - 1];
  const a = first[0].toUpperCase();
  const b = (last?.[0] ?? '').toUpperCase();
  return `${a}${b}`.slice(0, 2);
}

function liveAvatarStyle(studentId: string): CSSProperties {
  return {
    backgroundColor: colorFromId(studentId),
    color: '#ffffff',
  };
}

function displayStudentLabel(resp: StudentResponse): string {
  const name = resp.studentName?.trim();
  if (name) return name;
  const id = resp.studentId?.trim();
  if (id) return id;
  return 'Estudiante';
}

const NON_EVALUABLE = new Set(['encuesta_viva', 'nube_palabras']);

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveResponsesPanel({
  liveResponses,
  activeSlideId,
  activeSlideIndex,
  activeActivity,
  showAutonomousSlideProgress,
  autonomousStudentsPerSlide,
}: LiveResponsesPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const entry = liveResponses.get(activeSlideId);
  const responses = entry?.responses ?? [];
  const activityType = entry?.activityType ?? '';
  const isNonEvaluable = NON_EVALUABLE.has(activityType);

  function toggleExpand(studentId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  const uniqueResponses = responses.filter(
    (r, index, self) => index === self.findIndex(t => t.studentId === r.studentId)
  );

  const isPoll = activityType === 'encuesta_viva';
  let pollCounts: { idx: number; label: string; count: number; pct: number }[] = [];
  if (isPoll && activeActivity?.tipo === 'encuesta_viva') {
    const totalVotes = uniqueResponses.length;
    pollCounts = activeActivity.opciones.map((opt, idx) => {
      const count = uniqueResponses.filter((r) => Number(r.response) === idx).length;
      return {
        idx,
        label: opt.texto,
        count,
        pct: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });
  }

  return (
    <div className="flex flex-col gap-3 p-3">

      {showAutonomousSlideProgress &&
      autonomousStudentsPerSlide &&
      autonomousStudentsPerSlide.length > 0 ? (
        <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Progreso (autónomo)
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-foreground">
            {autonomousStudentsPerSlide.map((count, idx) => (
              <li
                key={idx}
                className="flex justify-between gap-2 tabular-nums text-muted-foreground"
              >
                <span>
                  Slide {idx + 1}
                  {idx === activeSlideIndex ? (
                    <span className="ml-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      (activo)
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-medium text-foreground">
                  {count} estudiante{count !== 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Banner */}
      <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2">
        <Users className="size-4 shrink-0 text-primary" />
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{responses.length}</span>
          {' '}estudiante{responses.length !== 1 ? 's' : ''} respondieron
        </span>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Slide {activeSlideIndex + 1} — Respuestas
      </p>

      {activityType && (
        <span className="self-start rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {activityType}
        </span>
      )}

      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Sin respuestas aún.</p>
          <p className="text-[10px] text-muted-foreground/60">
            Las respuestas aparecerán aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {/* Poll Summary */}
          {isPoll && pollCounts.length > 0 && (
            <div className="mb-2 space-y-1.5 rounded-md border border-border bg-card p-3 shadow-sm">
              <p className="mb-2 text-xs font-semibold">Resultados</p>
              {pollCounts.map((pc) => (
                <div key={pc.idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span className="truncate pr-2 font-medium text-foreground">{pc.label}</span>
                    <span className="shrink-0">{pc.count} ({pc.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${pc.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {uniqueResponses.map((resp) => {
            const isExpanded = expandedIds.has(resp.studentId);
            const hasDetails = (resp.details?.length ?? 0) > 0;
            const globalCorrect = isNonEvaluable ? null : resp.correct;

            return (
              <div
                key={resp.studentId}
                className={cn(
                  'overflow-hidden rounded-md border border-border bg-card text-xs',
                  'animate-in fade-in-0 slide-in-from-top-1 duration-200',
                )}
              >
                {/* Row header — always visible */}
                <button
                  type="button"
                  onClick={() => hasDetails && toggleExpand(resp.studentId)}
                  className={cn(
                    'flex w-full items-center gap-2 p-2 text-left',
                    hasDetails
                      ? 'cursor-pointer hover:bg-muted/40'
                      : 'cursor-default',
                  )}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white tabular-nums shadow-sm"
                    style={liveAvatarStyle(String(resp.studentId ?? ''))}
                  >
                    {liveResponseInitials(resp.studentName)}
                  </span>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-foreground font-medium">
                      {displayStudentLabel(resp)}
                    </div>
                    {resp.response !== undefined && activityType === 'short_answer' && (
                      <div className="mt-1 break-words rounded bg-muted/50 p-1.5 text-[11px] italic text-muted-foreground">
                        {`"${String(resp.response)}"`}
                      </div>
                    )}
                    {resp.response !== undefined && activityType === 'nube_palabras' && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(Array.isArray(resp.response) ? resp.response : [resp.response]).map((w, i) => (
                          <span key={i} className="rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            {String(w)}
                          </span>
                        ))}
                      </div>
                    )}
                    {resp.response !== undefined && activityType === 'encuesta_viva' && activeActivity?.tipo === 'encuesta_viva' && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        Votó: <span className="font-medium text-foreground">{activeActivity.opciones[Number(resp.response)]?.texto ?? '?'}</span>
                      </div>
                    )}
                  </div>

                  {/* Correct/incorrect icon */}
                  <span className="shrink-0">
                    {isNonEvaluable ? (
                      <span className="text-[10px] text-muted-foreground">Respondió</span>
                    ) : globalCorrect === true ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : globalCorrect === false ? (
                      <XCircle className="size-4 text-rose-500" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </span>

                  {/* Chevron — only when there are details to expand */}
                  {hasDetails && (
                    <span className="shrink-0 text-muted-foreground">
                      {isExpanded
                        ? <ChevronUp className="size-3.5" />
                        : <ChevronDown className="size-3.5" />}
                    </span>
                  )}
                </button>

                {/* Expanded detail list */}
                {isExpanded && hasDetails && (
                  <div className="border-t border-border bg-muted/20 px-2 pb-2 pt-1">
                    {resp.details!.map((detail, i) => {
                      const isLast = i === resp.details!.length - 1;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 py-0.5 text-[11px]"
                        >
                          <span className="w-3 shrink-0 font-mono text-muted-foreground/50">
                            {isLast ? '└' : '├'}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {detail.label}
                          </span>
                          <span className="shrink-0">
                            {detail.correct === true ? (
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                            ) : detail.correct === false ? (
                              <XCircle className="size-3.5 text-rose-500" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
