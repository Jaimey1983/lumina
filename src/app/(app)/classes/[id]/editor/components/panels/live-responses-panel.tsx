'use client';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LiveResponsesPanelProps {
  liveResponses: Map<string, { activityType: string; responses: unknown[] }>;
  activeSlideId: string;
  activeSlideIndex: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPrimitive(v: unknown): v is string | number | boolean {
  return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

function formatResponse(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'Verdadero' : 'Falso';
  if (Array.isArray(v)) return v.map(formatResponse).join(', ');
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveResponsesPanel({
  liveResponses,
  activeSlideId,
  activeSlideIndex,
}: LiveResponsesPanelProps) {
  const entry = liveResponses.get(activeSlideId);
  const responses = entry?.responses ?? [];
  const totalAll = Array.from(liveResponses.values()).reduce((sum, e) => sum + e.responses.length, 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Summary banner */}
      <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2">
        <Users className="size-4 text-primary" />
        <div className="flex-1 text-xs">
          <span className="font-semibold text-foreground">{responses.length}</span>
          <span className="text-muted-foreground"> en este slide</span>
          <span className="mx-1.5 text-border">|</span>
          <span className="font-semibold text-foreground">{totalAll}</span>
          <span className="text-muted-foreground"> total</span>
        </div>
      </div>

      {/* Slide indicator */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Slide {activeSlideIndex + 1} — Respuestas
      </p>

      {/* Activity type badge */}
      {entry?.activityType && (
        <span className="self-start rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {entry.activityType}
        </span>
      )}

      {/* Responses list */}
      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Sin respuestas aún.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Las respuestas de los estudiantes aparecerán aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {responses.map((resp, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-start gap-2 rounded-md border border-border bg-card p-2 text-xs',
                'animate-in fade-in-0 slide-in-from-top-1 duration-200',
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary tabular-nums">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1 break-words text-foreground">
                {isPrimitive(resp) ? (
                  <span>{formatResponse(resp)}</span>
                ) : (
                  <code className="text-[10px] text-muted-foreground">
                    {formatResponse(resp)}
                  </code>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Aggregate for primitives */}
      {responses.length > 0 && responses.every(isPrimitive) && (
        <ResponseAggregate responses={responses as (string | number | boolean)[]} />
      )}
    </div>
  );
}

// ─── Aggregate view for simple responses ──────────────────────────────────────

function ResponseAggregate({ responses }: { responses: (string | number | boolean)[] }) {
  // Count frequencies
  const counts = new Map<string, number>();
  for (const r of responses) {
    const key = formatResponse(r);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div className="mt-1 space-y-1.5 rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Distribución
      </p>
      {sorted.map(([label, count]) => (
        <div key={label} className="space-y-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="truncate font-medium text-foreground">{label}</span>
            <span className="tabular-nums text-muted-foreground">
              {count} ({Math.round((count / responses.length) * 100)}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
