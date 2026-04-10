'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentResponse {
  studentId: string;
  correct: boolean | null;
  activityType: string;
  details?: { label: string; correct: boolean | null }[];
}

export interface LiveResponsesPanelProps {
  liveResponses: Map<string, { activityType: string; responses: StudentResponse[] }>;
  activeSlideId: string;
  activeSlideIndex: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStudentBadge(studentId: string): string {
  const match = studentId.match(/(\d+)$/);
  return match ? `E${match[1]}` : studentId.slice(0, 2).toUpperCase();
}

const NON_EVALUABLE = new Set(['encuesta_viva', 'nube_palabras']);

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveResponsesPanel({
  liveResponses,
  activeSlideId,
  activeSlideIndex,
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

  return (
    <div className="flex flex-col gap-3 p-3">

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
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary tabular-nums">
                    {getStudentBadge(resp.studentId)}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {resp.studentId}
                  </span>

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
