'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { Trophy } from 'lucide-react';

import { useSound } from '@/hooks/use-sound';
import { cn } from '@/lib/utils';
import type { TorneoActivity } from '@/types/slide.types';

export interface TorneoRankingRow {
  studentId: string;
  studentName: string;
  points: number;
  position: number;
}

export type TorneoAnswerPayload = {
  questionIndex: number;
  answer: string;
  responseMs: number;
  torneoId: string | null;
  correctAnswer: string;
};

export interface TorneoViewerProps {
  activity: TorneoActivity;
  variant?: 'dark' | 'light';
  studentId: string;
  studentName: string;
  classId: string;
  onAnswer?: (payload: TorneoAnswerPayload) => void;
  /** Socket del viewer en vivo; sin socket solo se muestra la pantalla de espera. */
  liveSocket?: Socket | null;
  /** Igual que otros viewers: cambio de slide reinicia estado local. */
  editorSyncKey?: string;
}

const KAHOOT_COLORS = [
  { label: 'A', bg: '#1368CE', border: '#0d4f9e' },
  { label: 'B', bg: '#26890C', border: '#1a6208' },
  { label: 'C', bg: '#FFA602', border: '#c77f00' },
  { label: 'D', bg: '#E21B3C', border: '#a8142d' },
] as const;

function parseRankingPayload(payload: unknown): TorneoRankingRow[] {
  let raw: unknown;
  if (Array.isArray(payload)) {
    raw = payload;
  } else if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as { ranking?: unknown; podio?: unknown };
    raw = Array.isArray(o.ranking) && o.ranking.length > 0 ? o.ranking : o.podio ?? o.ranking;
  } else {
    raw = undefined;
  }
  if (!Array.isArray(raw)) return [];
  const out: TorneoRankingRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const o = row as Record<string, unknown>;
    const studentId = typeof o.studentId === 'string' ? o.studentId : '';
    const studentName = typeof o.studentName === 'string' ? o.studentName : '';
    const pointsRaw =
      typeof o.points === 'number' && Number.isFinite(o.points)
        ? o.points
        : typeof o.total === 'number' && Number.isFinite(o.total)
          ? o.total
          : 0;
    const points = pointsRaw;
    const position =
      typeof o.position === 'number' && Number.isFinite(o.position)
        ? Math.floor(o.position)
        : out.length + 1;
    if (studentId) out.push({ studentId, studentName, points, position });
  }
  return out.sort((a, b) => a.position - b.position);
}

function questionIndexFromPayload(payload: unknown): number | null {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const o = payload as Record<string, unknown>;
  const a = o.questionIndex;
  const b = o.index;
  if (typeof a === 'number' && Number.isFinite(a)) return Math.max(0, Math.floor(a));
  if (typeof b === 'number' && Number.isFinite(b)) return Math.max(0, Math.floor(b));
  return null;
}

function tiempoFromPayload(payload: unknown, fallback: number): number {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return fallback;
  const t = (payload as { tiempoSegundos?: unknown }).tiempoSegundos;
  if (typeof t === 'number' && Number.isFinite(t) && t > 0) return Math.floor(t);
  return fallback;
}

/** Fuera del componente para no disparar `react-hooks/purity` al medir tiempos de respuesta. */
function monotonicNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function elapsedSinceStartMs(startMs: number): number {
  return Math.max(0, Math.round(monotonicNowMs() - startMs));
}

export function TorneoViewer({
  activity,
  variant = 'light',
  studentId,
  studentName,
  classId,
  onAnswer,
  liveSocket,
  editorSyncKey,
}: TorneoViewerProps) {
  const { play } = useSound();
  const [phase, setPhase] = useState<'waiting' | 'question' | 'ranking' | 'finished'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTotal, setTimeTotal] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [ranking, setRanking] = useState<TorneoRankingRow[]>([]);
  const [rankingTick, setRankingTick] = useState(3);
  const [startBanner, setStartBanner] = useState(false);

  const questionStartedAtRef = useRef<number>(0);
  const torneoIdRef = useRef<string | null>(null);
  const torneoEndedRef = useRef(false);
  const rankingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDark = variant === 'dark';

  const clearQuestionTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const clearRankingTimer = useCallback(() => {
    if (rankingIntervalRef.current) {
      clearInterval(rankingIntervalRef.current);
      rankingIntervalRef.current = null;
    }
  }, []);

  const preguntas = activity.preguntas ?? [];
  const totalQuestions = Math.max(1, preguntas.length);
  const safeIndex = Math.min(currentQuestion, preguntas.length - 1);
  const q = preguntas[safeIndex];

  const paddedOptions = useMemo(() => {
    const raw = q?.opciones ?? [];
    const four: string[] = [...raw];
    while (four.length < 4) four.push('');
    return four.slice(0, 4);
  }, [q?.opciones]);

  useEffect(() => {
    setPhase('waiting');
    setCurrentQuestion(0);
    setTimeLeft(0);
    setTimeTotal(1);
    setSelectedAnswer(null);
    setAnswered(false);
    setRanking([]);
    setRankingTick(3);
    setStartBanner(false);
    torneoIdRef.current = null;
    torneoEndedRef.current = false;
    clearQuestionTimer();
    clearRankingTimer();
  }, [editorSyncKey, clearQuestionTimer, clearRankingTimer]);

  const activityRef = useRef(activity);
  activityRef.current = activity;

  useEffect(() => {
    const sock = liveSocket;
    if (!sock) return undefined;

    const onStart = (payload: unknown) => {
      if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
        const tid = (payload as Record<string, unknown>).torneoId;
        if (typeof tid === 'string' && tid.trim()) {
          torneoIdRef.current = tid.trim();
        }
      }
      setStartBanner(true);
      setPhase('waiting');
      window.setTimeout(() => setStartBanner(false), 2500);
    };

    const onQuestion = (payload: unknown) => {
      clearRankingTimer();
      const list = activityRef.current.preguntas ?? [];
      const maxIdx = Math.max(0, list.length - 1);
      const idxRaw = questionIndexFromPayload(payload);
      const i =
        idxRaw !== null ? Math.min(Math.max(0, idxRaw), maxIdx) : 0;

      setCurrentQuestion(i);
      const pq = list[i];
      const dur = tiempoFromPayload(payload, pq?.tiempoSegundos ?? 20);
      setTimeTotal(Math.max(1, dur));
      setTimeLeft(Math.max(1, dur));
      setSelectedAnswer(null);
      setAnswered(false);
      questionStartedAtRef.current = monotonicNowMs();
      setPhase('question');

      clearQuestionTimer();
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearQuestionTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const onRanking = (payload: unknown) => {
      clearQuestionTimer();
      const rows = parseRankingPayload(payload);
      setRanking((prev) => (rows.length > 0 ? rows : prev));
      setPhase('ranking');
      setRankingTick(3);
      clearRankingTimer();
      rankingIntervalRef.current = setInterval(() => {
        setRankingTick((t) => {
          if (t <= 1) {
            clearRankingTimer();
            if (!torneoEndedRef.current) {
              setPhase('waiting');
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    };

    const onEnd = (payload: unknown) => {
      torneoEndedRef.current = true;
      clearQuestionTimer();
      clearRankingTimer();
      setRanking(parseRankingPayload(payload));
      setPhase('finished');
    };

    sock.on('torneo:start', onStart);
    sock.on('torneo:question', onQuestion);
    sock.on('torneo:ranking', onRanking);
    sock.on('torneo:end', onEnd);

    return () => {
      sock.off('torneo:start', onStart);
      sock.off('torneo:question', onQuestion);
      sock.off('torneo:ranking', onRanking);
      sock.off('torneo:end', onEnd);
      clearQuestionTimer();
      clearRankingTimer();
    };
  }, [liveSocket, clearQuestionTimer, clearRankingTimer]);

  const notifyAnswer = useCallback(
    (questionIndex: number, answer: string, responseMs: number) => {
      const list = activityRef.current.preguntas ?? [];
      const cur = list[questionIndex];
      const correctAnswer =
        typeof cur?.correcta === 'string' ? cur.correcta : String(cur?.correcta ?? '');
      onAnswer?.({
        questionIndex,
        answer,
        responseMs,
        torneoId: torneoIdRef.current,
        correctAnswer,
      });
    },
    [onAnswer],
  );

  useEffect(() => {
    if (phase !== 'question' || answered || timeLeft > 0 || !q) return;
    setAnswered(true);
    play('wrong');
    const elapsed = elapsedSinceStartMs(questionStartedAtRef.current);
    notifyAnswer(safeIndex, '', elapsed);
  }, [phase, answered, timeLeft, q, play, notifyAnswer, safeIndex]);

  const progressRatio = timeTotal > 0 ? Math.min(1, Math.max(0, timeLeft / timeTotal)) : 0;
  const barColor =
    progressRatio > 0.5 ? '#22c55e' : progressRatio > 0.25 ? '#fbbf24' : '#ef4444';

  function handlePick(optionText: string) {
    if (phase !== 'question' || answered || !optionText.trim()) return;
    setSelectedAnswer(optionText);
    setAnswered(true);
    clearQuestionTimer();
    play('submit');
    notifyAnswer(safeIndex, optionText, elapsedSinceStartMs(questionStartedAtRef.current));
  }

  const myRankRow = useMemo(
    () => ranking.find((r) => r.studentId === studentId),
    [ranking, studentId],
  );

  const topThree = useMemo(() => {
    const sorted = [...ranking].sort((a, b) => a.position - b.position);
    return sorted.slice(0, 3);
  }, [ranking]);

  const motivational = useMemo(() => {
    const pos = myRankRow?.position ?? ranking.length + 1;
    if (pos <= 1) return '¡Campeón del torneo!';
    if (pos === 2) return '¡Subcampeón espectacular!';
    if (pos === 3) return '¡Estás en el podio!';
    if (pos <= Math.ceil(ranking.length / 2) && ranking.length > 0) return '¡Muy buen trabajo!';
    return '¡Sigue practicando, vas por buen camino!';
  }, [myRankRow?.position, ranking.length]);

  const shellClass = cn(
    'flex h-full min-h-0 w-full max-w-full flex-col rounded-xl border p-4 shadow-lumina-sm sm:p-6',
    isDark ? 'border-white/20 bg-white/10' : 'border-[#e5e7eb] bg-white/95',
  );

  const rootProps = { 'data-lumina-class-id': classId || undefined };

  if (phase === 'finished') {
    const [first, second, third] = topThree;
    return (
      <div className={shellClass} {...rootProps}>
        <div className="mb-4 text-center">
          <Trophy className="mx-auto size-14 text-amber-500 drop-shadow-md" aria-hidden />
          <h2 className={cn('mt-2 text-xl font-bold', isDark ? 'text-white' : 'text-[#111827]')}>
            Torneo finalizado
          </h2>
          <p className={cn('text-sm', isDark ? 'text-white/70' : 'text-[#6b7280]')}>
            {studentName.trim() || 'Tu posición'}{' '}
            {myRankRow ? (
              <>
                · lugar <span className="font-bold tabular-nums">{myRankRow.position}</span> ·{' '}
                <span className="font-semibold tabular-nums">{Math.round(myRankRow.points)}</span> pts
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-1 items-end justify-center gap-2 pb-2">
          {[second, first, third].map((row, i) => {
            const heights = ['h-24', 'h-36', 'h-20'];
            const orderLabels = ['2º', '1º', '3º'];
            const bg =
              i === 1 ? 'from-amber-400 to-amber-600' : 'from-[#94a3b8] to-[#64748b]';
            const name = row?.studentName?.trim() || '—';
            return (
              <div
                key={`${row?.studentId ?? i}-${i}`}
                className={cn(
                  'flex w-[28%] max-w-[140px] flex-col items-center justify-end rounded-t-lg bg-gradient-to-t px-2 pt-3 text-center text-white shadow-lumina-md animate-in zoom-in duration-500',
                  bg,
                  heights[i],
                )}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="text-xs font-bold opacity-90">{orderLabels[i]}</span>
                <span className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight">{name}</span>
              </div>
            );
          })}
        </div>

        <p
          className={cn(
            'mt-4 text-center text-sm font-medium leading-snug',
            isDark ? 'text-amber-200' : 'text-[#92400e]',
          )}
        >
          {motivational}
        </p>
      </div>
    );
  }

  if (phase === 'ranking') {
    const top5 = [...ranking].sort((a, b) => a.position - b.position).slice(0, 5);
    return (
      <div className={shellClass} {...rootProps}>
        <h3 className={cn('text-center text-lg font-bold', isDark ? 'text-white' : 'text-[#111827]')}>
          Ranking
        </h3>
        <ul className="mt-4 flex-1 space-y-2 overflow-auto">
          {top5.map((row) => {
            const isMe = row.studentId === studentId;
            return (
              <li
                key={row.studentId}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                  isMe
                    ? isDark
                      ? 'border-amber-400/60 bg-amber-500/20 text-white'
                      : 'border-amber-300 bg-amber-50 text-[#111827]'
                    : isDark
                      ? 'border-white/15 bg-white/5 text-white/90'
                      : 'border-[#e5e7eb] bg-[#f9fafb] text-[#111827]',
                )}
              >
                <span className="tabular-nums font-bold">#{row.position}</span>
                <span className="min-w-0 flex-1 truncate px-2 text-center font-medium">
                  {row.studentName.trim() || row.studentId}
                </span>
                <span className="tabular-nums font-semibold">{Math.round(row.points)}</span>
              </li>
            );
          })}
        </ul>
        <p
          className={cn(
            'mt-4 text-center text-sm font-semibold tabular-nums',
            isDark ? 'text-white/80' : 'text-[#2563EB]',
          )}
        >
          Siguiente pregunta en {Math.max(0, rankingTick)}…
        </p>
      </div>
    );
  }

  if (phase === 'question' && q) {
    return (
      <div className={shellClass} {...rootProps}>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]/80">
          <div
            className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{
              width: `${progressRatio * 100}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        <p
          className={cn(
            'text-center text-xs font-medium tabular-nums',
            isDark ? 'text-white/70' : 'text-[#6b7280]',
          )}
        >
          Pregunta {safeIndex + 1} de {totalQuestions} · {timeLeft}s
        </p>
        <p
          className={cn(
            'my-4 text-center text-lg font-bold leading-snug sm:text-xl',
            isDark ? 'text-white' : 'text-[#111827]',
          )}
        >
          {q.enunciado}
        </p>
        <div className="grid flex-1 grid-cols-2 gap-3 min-h-0">
          {paddedOptions.map((text, idx) => {
            const style = KAHOOT_COLORS[idx] ?? KAHOOT_COLORS[0];
            const disabled = answered || !text.trim();
            return (
              <button
                key={`${idx}-${style.label}`}
                type="button"
                disabled={disabled}
                onClick={() => handlePick(text)}
                className={cn(
                  'flex min-h-[4.5rem] flex-col items-start justify-center rounded-xl border-b-4 px-4 py-3 text-left text-white shadow-lumina-xs transition-transform disabled:cursor-not-allowed disabled:opacity-45 enabled:active:scale-[0.98]',
                  selectedAnswer === text && 'ring-4 ring-white/80',
                )}
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              >
                <span className="text-lg font-black">{style.label}</span>
                <span className="mt-1 line-clamp-3 text-sm font-semibold leading-tight">{text || '—'}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass} {...rootProps}>
      {startBanner ? (
        <div
          className={cn(
            'mb-4 rounded-lg px-4 py-3 text-center text-base font-bold animate-in zoom-in duration-300',
            isDark ? 'bg-amber-500/25 text-amber-100' : 'bg-amber-100 text-amber-900',
          )}
        >
          ¡Torneo iniciado!
        </div>
      ) : null}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
        <Trophy
          className={cn(
            'size-20 sm:size-24 text-amber-500 animate-pulse',
          )}
          aria-hidden
        />
        <p className={cn('text-center text-lg font-semibold', isDark ? 'text-white' : 'text-[#111827]')}>
          Esperando al docente…
        </p>
        <p className={cn('max-w-xs text-center text-sm', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
          Cuando el docente lance una pregunta, aparecerá aquí con tiempo limitado.
        </p>
      </div>
    </div>
  );
}
