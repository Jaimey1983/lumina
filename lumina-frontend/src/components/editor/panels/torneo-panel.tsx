'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { Download, Play, SkipForward, Square, Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { TorneoActivity } from '@/types/slide.types';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankingEntry {
  studentId: string;
  studentName: string;
  points: number;
  position: number;
}

export interface TorneoPanelProps {
  classId: string;
  sessionId: string;
  activity: TorneoActivity;
  socket: Socket;
}

type Phase = 'idle' | 'active' | 'finished';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRanking(payload: unknown): RankingEntry[] {
  const raw: unknown = Array.isArray(payload)
    ? payload
    : payload !== null &&
        typeof payload === 'object' &&
        !Array.isArray(payload) &&
        'ranking' in payload
      ? (payload as { ranking?: unknown }).ranking
      : undefined;
  if (!Array.isArray(raw)) return [];
  const out: RankingEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const studentId = typeof r.studentId === 'string' ? r.studentId : '';
    const studentName = typeof r.studentName === 'string' ? r.studentName : '';
    const pointsRaw =
      typeof r.points === 'number' && Number.isFinite(r.points)
        ? r.points
        : typeof r.total === 'number' && Number.isFinite(r.total)
          ? r.total
          : 0;
    const points = pointsRaw;
    const position =
      typeof r.position === 'number' && Number.isFinite(r.position)
        ? r.position
        : out.length + 1;
    if (studentId) out.push({ studentId, studentName, points, position });
  }
  return out.sort((a, b) => a.position - b.position);
}

function downloadCSV(ranking: RankingEntry[]) {
  const header = 'Posición,Nombre,Puntos\n';
  const rows = ranking
    .map((r) => `${r.position},"${r.studentName.replace(/"/g, '""')}",${Math.round(r.points)}`)
    .join('\n');
  const bom = '﻿';
  const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `torneo-resultados-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Podio ────────────────────────────────────────────────────────────────────

function Podio({ ranking }: { ranking: RankingEntry[] }) {
  const [first, second, third] = [
    ranking.find((r) => r.position === 1),
    ranking.find((r) => r.position === 2),
    ranking.find((r) => r.position === 3),
  ];
  const slots = [second, first, third];
  const heights = ['h-16', 'h-24', 'h-14'];
  const labels = ['2º', '1º', '3º'];
  const bgClasses = [
    'from-[#94a3b8] to-[#64748b]',
    'from-amber-400 to-amber-600',
    'from-[#b87333] to-[#8B6914]',
  ];

  return (
    <div className="flex items-end justify-center gap-2 px-2 pb-2 pt-4">
      {slots.map((row, i) => {
        const name = row?.studentName?.trim() || '—';
        const pts = row ? Math.round(row.points) : 0;
        return (
          <div
            key={i}
            className={cn(
              'flex w-[30%] max-w-[110px] flex-col items-center justify-end rounded-t-lg bg-gradient-to-t px-2 pt-2 text-center text-white shadow-lumina-md animate-in zoom-in duration-500',
              bgClasses[i],
              heights[i],
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-[10px] font-bold opacity-90">{labels[i]}</span>
            <span className="line-clamp-2 text-[10px] font-semibold leading-tight">{name}</span>
            <span className="text-[9px] opacity-80">{pts} pts</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TorneoPanel({ classId, sessionId, activity, socket }: TorneoPanelProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const torneoIdRef = useRef<string | null>(null);
  const activityRef = useRef(activity);
  activityRef.current = activity;

  const preguntas = activity.preguntas ?? [];
  const total = preguntas.length;

  // ── Socket listeners ────────────────────────────────────────────────────────

  useEffect(() => {
    function onStart(payload: unknown) {
      const p = payload as Record<string, unknown> | null;
      if (p && typeof p.torneoId === 'string') {
        torneoIdRef.current = p.torneoId;
      }
      setPhase('active');
      setCurrentQ(0);
    }

    function onRanking(payload: unknown) {
      const rows = parseRanking(payload);
      if (rows.length > 0) setRanking(rows);
    }

    socket.on('torneo:start', onStart);
    socket.on('torneo:ranking', onRanking);

    return () => {
      socket.off('torneo:start', onStart);
      socket.off('torneo:ranking', onRanking);
    };
  }, [socket]);

  // ── Teacher actions ─────────────────────────────────────────────────────────

  const handleInit = useCallback(() => {
    socket.emit('torneo:init', { classId, sessionId });
    setPhase('active');
    setCurrentQ(0);
  }, [socket, classId, sessionId]);

  const handleLaunchQuestion = useCallback(() => {
    const torneoId = torneoIdRef.current;
    const act = activityRef.current;
    const pqs = act.preguntas ?? [];
    if (!torneoId || currentQ >= pqs.length) return;
    const q = pqs[currentQ];
    if (!q) return;
    socket.emit('torneo:launch-question', {
      torneoId,
      index: currentQ,
      question: q,
      timeLimit: q.tiempoSegundos,
    });
    setCurrentQ((prev) => prev + 1);
  }, [socket, currentQ]);

  const handleFinish = useCallback(() => {
    const torneoId = torneoIdRef.current;
    if (!torneoId) return;
    socket.emit('torneo:finish', { torneoId });
    setPhase('finished');
  }, [socket]);

  // ── Render: IDLE ────────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          <span className="text-sm font-semibold text-[#111827]">Torneo</span>
        </div>
        <p className="text-xs text-[#6b7280]">
          {total} pregunta{total !== 1 ? 's' : ''} · Pulsa el botón para
          sincronizar a todos los estudiantes y comenzar.
        </p>
        <Button
          type="button"
          className="h-10 w-full gap-2 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          onClick={handleInit}
        >
          <Play className="size-4" />
          Iniciar Torneo
        </Button>
      </div>
    );
  }

  // ── Render: FINISHED ────────────────────────────────────────────────────────

  if (phase === 'finished') {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <span className="text-sm font-semibold text-[#111827]">Torneo finalizado</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs border-[#e5e7eb]"
            onClick={() => downloadCSV(ranking)}
          >
            <Download className="size-3.5" />
            CSV
          </Button>
        </div>

        {ranking.length > 0 ? (
          <>
            <Podio ranking={ranking} />
            <div className="mt-1 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                Top 10
              </p>
              <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F7]">
                      <th className="py-1.5 pl-2 text-left text-[10px] font-medium uppercase text-[#6b7280]">#</th>
                      <th className="py-1.5 text-left text-[10px] font-medium uppercase text-[#6b7280]">Nombre</th>
                      <th className="py-1.5 pr-2 text-right text-[10px] font-medium uppercase text-[#6b7280]">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.slice(0, 10).map((r) => (
                      <tr key={r.studentId} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                        <td className="py-1.5 pl-2 font-mono font-semibold text-[#111827]">{r.position}</td>
                        <td className="max-w-[100px] truncate py-1.5 text-[#111827]">{r.studentName || r.studentId}</td>
                        <td className="py-1.5 pr-2 text-right font-semibold tabular-nums text-[#111827]">
                          {Math.round(r.points)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-xs text-[#9ca3af]">Sin participantes registrados.</p>
        )}
      </div>
    );
  }

  // ── Render: ACTIVE ──────────────────────────────────────────────────────────

  const launchedCount = currentQ; // cuántas se han lanzado ya
  const remaining = total - launchedCount;
  const currentPreg = preguntas[launchedCount];

  return (
    <div className="flex flex-col gap-3 p-3">

      {/* Header: en vivo badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#2563EB]" />
          </span>
          <span className="text-xs font-semibold text-[#2563EB]">En vivo</span>
        </div>
        <span className="text-[10px] tabular-nums text-[#6b7280]">
          {launchedCount}/{total} lanzadas
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-red-600 hover:bg-red-50 hover:text-red-700"
          title="Finalizar torneo"
          onClick={handleFinish}
        >
          <Square className="size-3.5 fill-current" />
        </Button>
      </div>

      {/* Pregunta actual */}
      {currentPreg && launchedCount < total && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2.5 text-xs">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Siguiente — P{launchedCount + 1}
          </p>
          <p className="font-medium text-[#111827] line-clamp-3">{currentPreg.enunciado}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {currentPreg.opciones.slice(0, 4).map((op, i) => (
              <span
                key={i}
                className={cn(
                  'truncate rounded px-1.5 py-0.5 text-[10px] font-medium',
                  op === currentPreg.correcta
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#f3f4f6] text-[#6b7280]',
                )}
              >
                {String.fromCharCode(65 + i)}: {op || '—'}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-[#9ca3af]">{currentPreg.tiempoSegundos}s</p>
        </div>
      )}

      {/* Launch button */}
      {remaining > 0 ? (
        <Button
          type="button"
          className="h-9 w-full gap-2 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          onClick={handleLaunchQuestion}
        >
          <SkipForward className="size-4" />
          Lanzar P{launchedCount + 1}
        </Button>
      ) : (
        <Button
          type="button"
          className="h-9 w-full gap-2 bg-red-600 text-white hover:bg-red-700"
          onClick={handleFinish}
        >
          <Square className="size-4 fill-current" />
          Finalizar torneo
        </Button>
      )}

      {/* Ranking en vivo */}
      {ranking.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Ranking — Top 10
          </p>
          <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F5F5F7]">
                  <th className="py-1.5 pl-2 text-left text-[10px] font-medium uppercase text-[#6b7280]">#</th>
                  <th className="py-1.5 text-left text-[10px] font-medium uppercase text-[#6b7280]">Nombre</th>
                  <th className="py-1.5 pr-2 text-right text-[10px] font-medium uppercase text-[#6b7280]">Pts</th>
                </tr>
              </thead>
              <tbody>
                {ranking.slice(0, 10).map((r) => (
                  <tr key={r.studentId} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                    <td className="py-1.5 pl-2 font-mono font-semibold text-[#111827]">{r.position}</td>
                    <td className="max-w-[100px] truncate py-1.5 text-[#111827]">{r.studentName || r.studentId}</td>
                    <td className="py-1.5 pr-2 text-right font-semibold tabular-nums text-[#111827]">
                      {Math.round(r.points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
