'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { CheckCircle2, Clock, Eye, Lock, Trophy, XCircle } from 'lucide-react';

import { useSound } from '@/hooks/use-sound';
import { cn } from '@/lib/utils';
import type { EscapeRoomActivity, EscapeRoomSala } from '@/types/slide.types';
import { normalizeEscapeRoomActivity } from '@/components/editor/activities/escape-room-editor';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'sala' | 'victoria' | 'derrota';
type FeedbackState = 'none' | 'correcto' | 'incorrecto' | 'bloqueada';

interface SalaHistorial {
  salaId: string;
  nombre: string;
  intentos: number;
  puntos: number;
}

export interface EscapeRoomViewerProps {
  activity: EscapeRoomActivity;
  variant?: 'dark' | 'light';
  studentId: string;
  studentName: string;
  classId?: string;
  editorSyncKey?: string;
  liveSocket?: Socket | null;
  onComplete?: (points: number, timeMs?: number) => void;
  onAnswer?: (salaId: string, answer: string, correct?: boolean, intento?: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esCorrecta(sala: EscapeRoomSala, respuesta: string): boolean {
  const r = respuesta.trim();
  const c = sala.respuestaCorrecta.trim();
  if (!r) return false;
  return sala.ignorarMayusculas
    ? r.toLowerCase() === c.toLowerCase()
    : r === c;
}

function calcularPuntos(intento: number, puntosBase: number): number {
  if (intento <= 1) return puntosBase;
  if (intento === 2) return Math.round(puntosBase * (150 / 300));
  return Math.round(puntosBase * (50 / 300));
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

function formatSeg(seg: number): string {
  const v = Math.max(0, seg);
  const m = Math.floor(v / 60);
  const s = v % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Confetti (CSS puro) ──────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#2563EB', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const CONFETTI_CSS = `
@keyframes lumina-er-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  80%  { opacity: 0.85; }
  100% { transform: translateY(420px) rotate(540deg); opacity: 0; }
}
`;

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    left: `${Math.round((i * 97 + 4) % 97)}%`,
    delay: `${((i * 0.09) % 1.4).toFixed(2)}s`,
    dur: `${(1.9 + (i % 5) * 0.22).toFixed(2)}s`,
    size: 6 + (i % 4) * 2,
    isCircle: i % 3 !== 0,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{CONFETTI_CSS}</style>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animationName: 'lumina-er-fall',
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}

// ─── Barra de progreso de salas ───────────────────────────────────────────────

function SalaProgress({
  total,
  completadas,
  isDark,
}: {
  total: number;
  completadas: number;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-500',
            i < completadas
              ? 'bg-[#2563EB]'
              : isDark ? 'bg-white/20' : 'bg-[#e5e7eb]',
          )}
        />
      ))}
    </div>
  );
}

// ─── EscapeRoomViewer ─────────────────────────────────────────────────────────

export function EscapeRoomViewer({
  activity,
  variant = 'light',
  studentId: _studentId,
  studentName,
  classId: _classId,
  editorSyncKey,
  liveSocket: _liveSocket,
  onComplete,
  onAnswer,
}: EscapeRoomViewerProps) {
  const { play } = useSound();
  const isDark = variant === 'dark';

  const act = normalizeEscapeRoomActivity(activity);
  const salas = act.salas;
  const totalSalas = Math.max(1, salas.length);
  const tiempoLimiteSeg =
    (act.tiempoLimiteMinutos ?? 0) > 0 ? act.tiempoLimiteMinutos! * 60 : 0;

  // ── State ──────────────────────────────────────────────────────────────────

  const [phase, setPhase] = useState<Phase>('intro');
  const [salaActual, setSalaActual] = useState(0);
  const [intentos, setIntentos] = useState(0);
  const [puntosAcumulados, setPuntosAcumulados] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(tiempoLimiteSeg);
  const [mostrarPista, setMostrarPista] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [historial, setHistorial] = useState<SalaHistorial[]>([]);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tiempoInicioRef = useRef(0);
  const puntosRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;
  puntosRef.current = puntosAcumulados;

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Reset cuando cambia el slide en la previsualización del editor
  useEffect(() => {
    stopTimer();
    setPhase('intro');
    setSalaActual(0);
    setIntentos(0);
    setPuntosAcumulados(0);
    setTiempoRestante(tiempoLimiteSeg);
    setMostrarPista(false);
    setInputValue('');
    setSelectedOption(null);
    setFeedback('none');
    setHistorial([]);
    setTiempoFinal(0);
    setAdvancing(false);
  // editorSyncKey + tiempoLimiteSeg estables para el lint
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorSyncKey]);

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), []);

  // Derrota cuando el contador llega a 0
  useEffect(() => {
    if (tiempoRestante !== 0) return;
    if (tiempoLimiteSeg === 0) return;
    if (phase === 'victoria' || phase === 'derrota' || phase === 'intro') return;
    stopTimer();
    const elapsed = Date.now() - tiempoInicioRef.current;
    setTiempoFinal(elapsed);
    setPhase('derrota');
    onCompleteRef.current?.(puntosRef.current, elapsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante]);

  // ── Avanzar ────────────────────────────────────────────────────────────────

  function advanceToNext(
    currentIdx: number,
    newHistorial: SalaHistorial[],
    newPuntos: number,
  ) {
    setAdvancing(true);
    setTimeout(() => {
      const next = currentIdx + 1;
      if (next >= totalSalas) {
        stopTimer();
        const elapsed = Date.now() - tiempoInicioRef.current;
        setTiempoFinal(elapsed);
        setPuntosAcumulados(newPuntos);
        setHistorial(newHistorial);
        setAdvancing(false);
        setPhase('victoria');
        onCompleteRef.current?.(newPuntos, elapsed);
      } else {
        setSalaActual(next);
        setIntentos(0);
        setFeedback('none');
        setInputValue('');
        setSelectedOption(null);
        setMostrarPista(false);
        setPuntosAcumulados(newPuntos);
        setHistorial(newHistorial);
        setAdvancing(false);
      }
    }, 1500);
  }

  // ── Comenzar ───────────────────────────────────────────────────────────────

  function comenzar() {
    const now = Date.now();
    tiempoInicioRef.current = now;
    setTiempoRestante(tiempoLimiteSeg);
    setPhase('sala');

    if (tiempoLimiteSeg > 0) {
      stopTimer();
      timerRef.current = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) { stopTimer(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }

  // ── Confirmar respuesta ────────────────────────────────────────────────────

  function confirmar() {
    if (advancing) return;
    const sala = salas[salaActual];
    if (!sala) return;

    const respuesta =
      sala.tipoRespuesta === 'opcion_multiple'
        ? (selectedOption ?? '')
        : inputValue;

    if (!respuesta.trim()) return;

    const intentoActual = intentos + 1;
    const correcto = esCorrecta(sala, respuesta);

    onAnswerRef.current?.(sala.id, respuesta, correcto, intentoActual);

    if (correcto) {
      const puntos = calcularPuntos(intentoActual, act.puntosBase);
      play('correct');
      setFeedback('correcto');
      const newHistorial = [
        ...historial,
        { salaId: sala.id, nombre: sala.nombre, intentos: intentoActual, puntos },
      ];
      advanceToNext(salaActual, newHistorial, puntosAcumulados + puntos);
    } else {
      play('wrong');
      const newIntentos = intentoActual;
      setIntentos(newIntentos);
      setFeedback('incorrecto');

      const maxIntentos =
        sala.intentosMaximos === -1 ? Infinity : sala.intentosMaximos;
      if (newIntentos >= maxIntentos) {
        setFeedback('bloqueada');
        const newHistorial = [
          ...historial,
          { salaId: sala.id, nombre: sala.nombre, intentos: newIntentos, puntos: 0 },
        ];
        advanceToNext(salaActual, newHistorial, puntosAcumulados);
      }
    }
  }

  // ── Derivados ─────────────────────────────────────────────────────────────

  const sala = salas[salaActual];
  const opcionesMultiple = sala?.opciones ?? [];
  const puedeConfirmar =
    sala?.tipoRespuesta === 'opcion_multiple'
      ? selectedOption !== null
      : inputValue.trim().length > 0;
  const timerRojo =
    tiempoLimiteSeg > 0 &&
    tiempoRestante > 0 &&
    tiempoRestante <= tiempoLimiteSeg * 0.2;
  const completadas = historial.length;

  const shell = cn(
    'relative flex h-full min-h-0 w-full max-w-full flex-col rounded-xl border p-4 shadow-lumina-sm sm:p-5',
    isDark ? 'border-white/20 bg-white/10' : 'border-[#e5e7eb] bg-white/95',
  );

  // ─── INTRO ─────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className={shell}>
        <style>{`
          @keyframes lumina-lock-sway {
            0%,100%{transform:rotate(0deg)}
            25%{transform:rotate(-10deg)}
            75%{transform:rotate(10deg)}
          }
        `}</style>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center">
          <div
            className={cn(
              'flex size-16 items-center justify-center rounded-full shadow-lumina-sm animate-in zoom-in duration-500',
              isDark ? 'bg-white/15' : 'bg-[#dbeafe]',
            )}
          >
            <Lock
              className={cn('size-8', isDark ? 'text-white' : 'text-[#2563EB]')}
              aria-hidden
              style={{ animation: 'lumina-lock-sway 2.4s ease-in-out infinite' }}
            />
          </div>

          <h2
            className={cn(
              'text-xl font-bold leading-snug',
              isDark ? 'text-white' : 'text-[#111827]',
            )}
          >
            {act.titulo}
          </h2>

          <p
            className={cn(
              'max-w-xs text-sm leading-relaxed',
              isDark ? 'text-white/70' : 'text-[#6b7280]',
            )}
          >
            {act.introduccion}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                isDark ? 'bg-white/15 text-white' : 'bg-[#dbeafe] text-[#2563EB]',
              )}
            >
              {totalSalas} sala{totalSalas !== 1 ? 's' : ''}
            </span>
            {tiempoLimiteSeg > 0 && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                  isDark ? 'bg-white/15 text-white' : 'bg-[#fef3c7] text-[#d97706]',
                )}
              >
                <Clock className="size-3" aria-hidden />
                {act.tiempoLimiteMinutos} min
              </span>
            )}
          </div>

          <Button
            type="button"
            className="mt-2 gap-2 bg-[#2563EB] px-6 text-white hover:bg-[#1d4ed8]"
            onClick={comenzar}
          >
            ▶ Comenzar
          </Button>
        </div>

        {studentName.trim() && (
          <p
            className={cn(
              'shrink-0 text-center text-xs',
              isDark ? 'text-white/40' : 'text-[#9ca3af]',
            )}
          >
            {studentName}
          </p>
        )}
      </div>
    );
  }

  // ─── VICTORIA ──────────────────────────────────────────────────────────────

  if (phase === 'victoria') {
    return (
      <div className={cn(shell, 'overflow-hidden')}>
        <Confetti />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 py-2 text-center">
          <Trophy
            className="size-14 text-amber-500 drop-shadow-md animate-in zoom-in duration-500"
            aria-hidden
          />
          <h2
            className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-[#111827]')}
          >
            ¡Escapaste!
          </h2>

          <div className="flex gap-3">
            <div
              className={cn(
                'flex flex-col items-center rounded-lg border px-4 py-2',
                isDark
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-[#e5e7eb] bg-[#f9fafb] text-[#111827]',
              )}
            >
              <span className="text-xl font-bold tabular-nums">{puntosAcumulados}</span>
              <span className={cn('text-xs', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
                puntos
              </span>
            </div>
            {tiempoFinal > 0 && (
              <div
                className={cn(
                  'flex flex-col items-center rounded-lg border px-4 py-2',
                  isDark
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-[#e5e7eb] bg-[#f9fafb] text-[#111827]',
                )}
              >
                <span className="text-xl font-bold tabular-nums">{formatMs(tiempoFinal)}</span>
                <span className={cn('text-xs', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
                  tiempo
                </span>
              </div>
            )}
          </div>

          {historial.length > 0 && (
            <div className="w-full max-w-xs space-y-1">
              <p
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  isDark ? 'text-white/50' : 'text-[#9ca3af]',
                )}
              >
                Desglose por sala
              </p>
              {historial.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs',
                    isDark ? 'bg-white/10 text-white/90' : 'bg-[#f9fafb] text-[#111827]',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{h.nombre}</span>
                  <span
                    className={cn(
                      'shrink-0 text-[10px]',
                      isDark ? 'text-white/50' : 'text-[#9ca3af]',
                    )}
                  >
                    {h.intentos} intento{h.intentos !== 1 ? 's' : ''}
                  </span>
                  <span
                    className={cn(
                      'ml-1 shrink-0 font-semibold tabular-nums',
                      h.puntos > 0
                        ? 'text-[#2563EB]'
                        : isDark ? 'text-white/40' : 'text-[#9ca3af]',
                    )}
                  >
                    {h.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DERROTA ───────────────────────────────────────────────────────────────

  if (phase === 'derrota') {
    return (
      <div className={shell}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center">
          <Clock
            className={cn(
              'size-14 animate-in zoom-in duration-500',
              isDark ? 'text-red-300' : 'text-red-500',
            )}
            aria-hidden
          />
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-[#111827]')}>
            ¡Se acabó el tiempo!
          </h2>
          <p className={cn('text-sm', isDark ? 'text-white/70' : 'text-[#6b7280]')}>
            Completaste{' '}
            <span className="font-bold tabular-nums">{completadas}</span>{' '}
            de{' '}
            <span className="font-bold tabular-nums">{totalSalas}</span>{' '}
            sala{totalSalas !== 1 ? 's' : ''}
          </p>
          <div
            className={cn(
              'rounded-lg border px-6 py-3 text-center',
              isDark
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-[#e5e7eb] bg-[#f9fafb] text-[#111827]',
            )}
          >
            <p className="text-2xl font-extrabold tabular-nums">{puntosAcumulados}</p>
            <p className={cn('text-xs', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
              puntos acumulados
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── SALA ──────────────────────────────────────────────────────────────────

  if (!sala) return null;

  const inputDisabled = advancing || feedback === 'correcto' || feedback === 'bloqueada';
  const confirmDisabled = inputDisabled || !puedeConfirmar;
  const intentosRestantes =
    sala.intentosMaximos === -1
      ? null
      : sala.intentosMaximos - intentos;

  return (
    <div className={shell}>

      {/* Header: progreso + timer */}
      <div className="mb-3 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn('text-xs font-semibold', isDark ? 'text-white/70' : 'text-[#6b7280]')}
          >
            Sala {salaActual + 1} de {totalSalas}
          </span>
          {tiempoLimiteSeg > 0 && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums transition-colors duration-300',
                timerRojo
                  ? 'animate-pulse bg-red-100 text-red-600'
                  : isDark
                    ? 'bg-white/15 text-white'
                    : 'bg-[#f3f4f6] text-[#111827]',
              )}
            >
              <Clock className="size-3" aria-hidden />
              {formatSeg(tiempoRestante)}
            </span>
          )}
        </div>
        <SalaProgress total={totalSalas} completadas={completadas} isDark={isDark} />
      </div>

      {/* Overlay de transición correcto/bloqueado */}
      {advancing && (
        <div
          className={cn(
            'absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl animate-in fade-in duration-200',
            feedback === 'correcto'
              ? isDark ? 'bg-emerald-900/85' : 'bg-emerald-50/95'
              : isDark ? 'bg-red-900/85' : 'bg-red-50/95',
          )}
        >
          {feedback === 'correcto' ? (
            <>
              <CheckCircle2
                className="size-16 text-emerald-500 animate-in zoom-in duration-300"
                aria-hidden
              />
              <p
                className={cn(
                  'text-lg font-bold',
                  isDark ? 'text-emerald-200' : 'text-emerald-700',
                )}
              >
                ¡Correcto!
              </p>
              <p
                className={cn('text-sm', isDark ? 'text-emerald-300/80' : 'text-emerald-600')}
              >
                {salaActual + 1 < totalSalas
                  ? 'Pasando a la siguiente sala…'
                  : 'Última sala superada…'}
              </p>
            </>
          ) : (
            <>
              <XCircle
                className="size-16 text-red-500 animate-in zoom-in duration-300"
                aria-hidden
              />
              <p
                className={cn('text-base font-bold', isDark ? 'text-red-200' : 'text-red-700')}
              >
                Sala bloqueada
              </p>
              <p className={cn('text-sm', isDark ? 'text-red-300/80' : 'text-red-600')}>
                Continuando de todas formas…
              </p>
            </>
          )}
        </div>
      )}

      {/* Contenido de la sala */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">

        {/* Nombre */}
        <h3
          className={cn(
            'text-base font-bold leading-snug',
            isDark ? 'text-white' : 'text-[#111827]',
          )}
        >
          {sala.nombre}
        </h3>

        {/* Descripción narrativa */}
        {sala.descripcion.trim() && (
          <p
            className={cn(
              'text-sm leading-relaxed',
              isDark ? 'text-white/60' : 'text-[#6b7280]',
            )}
          >
            {sala.descripcion}
          </p>
        )}

        <div className={cn('h-px shrink-0', isDark ? 'bg-white/15' : 'bg-[#e5e7eb]')} />

        {/* Desafío */}
        <p
          className={cn(
            'text-sm font-semibold leading-snug',
            isDark ? 'text-white' : 'text-[#111827]',
          )}
        >
          {sala.desafio}
        </p>

        {/* Input según tipo */}
        {sala.tipoRespuesta === 'opcion_multiple' ? (
          <div className="grid grid-cols-2 gap-2">
            {opcionesMultiple.map((op, i) => {
              const isSelected = selectedOption === op;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={inputDisabled}
                  onClick={() => { if (!inputDisabled) setSelectedOption(op); }}
                  className={cn(
                    'rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    isSelected
                      ? isDark
                        ? 'border-[#2563EB] bg-[#2563EB]/30 text-white'
                        : 'border-[#2563EB] bg-[#dbeafe] text-[#2563EB]'
                      : isDark
                        ? 'border-white/20 bg-white/5 text-white/80 enabled:hover:border-white/40'
                        : 'border-[#e5e7eb] bg-white text-[#111827] enabled:hover:border-[#2563EB] enabled:hover:bg-[#eff6ff]',
                  )}
                >
                  <span className="mr-1.5 font-bold text-[#9ca3af]">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {op}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type={sala.tipoRespuesta === 'codigo' ? 'number' : 'text'}
            value={inputValue}
            disabled={inputDisabled}
            placeholder={
              sala.tipoRespuesta === 'codigo' ? 'Código numérico…' : 'Tu respuesta…'
            }
            onChange={(e) => {
              setInputValue(e.target.value);
              if (feedback === 'incorrecto') setFeedback('none');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !confirmDisabled) confirmar();
            }}
            className={cn(
              'h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors',
              isDark
                ? 'border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-[#2563EB]'
                : 'border-[#e5e7eb] bg-white text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563EB] focus:ring-2 focus:ring-[#dbeafe]',
              feedback === 'incorrecto' && !inputDisabled
                ? isDark ? 'border-red-400/60' : 'border-red-300 bg-red-50/30'
                : '',
            )}
          />
        )}

        {/* Feedback incorrecto */}
        {feedback === 'incorrecto' && !advancing && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium animate-in slide-in-from-top-1 duration-200',
              isDark ? 'bg-red-900/40 text-red-200' : 'bg-red-50 text-red-700',
            )}
          >
            <XCircle className="size-4 shrink-0" aria-hidden />
            {intentosRestantes !== null && intentosRestantes > 0
              ? `Incorrecto. Te queda${intentosRestantes === 1 ? '' : 'n'} ${intentosRestantes} intento${intentosRestantes !== 1 ? 's' : ''}.`
              : 'Respuesta incorrecta.'}
          </div>
        )}

        {/* Botón pista — aparece tras el primer fallo */}
        {sala.pista?.trim() && intentos >= 1 && feedback !== 'correcto' && !advancing && (
          !mostrarPista ? (
            <button
              type="button"
              onClick={() => setMostrarPista(true)}
              className={cn(
                'flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                isDark
                  ? 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  : 'border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] hover:bg-[#f3f4f6]',
              )}
            >
              <Eye className="size-3.5" aria-hidden />
              Ver pista
            </button>
          ) : (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs animate-in fade-in duration-200',
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-amber-200 bg-[#fef3c7] text-[#92400e]',
              )}
            >
              <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{sala.pista}</span>
            </div>
          )
        )}
      </div>

      {/* Confirmar */}
      <div className="mt-3 shrink-0">
        <Button
          type="button"
          disabled={confirmDisabled}
          onClick={confirmar}
          className="h-10 w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-40"
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
}
