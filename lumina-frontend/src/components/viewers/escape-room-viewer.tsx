'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { CheckCircle2, Clock, Eye, Lock, Trophy, XCircle } from 'lucide-react';

import {
  historialFromTeam,
  tiempoRestanteLive,
  useEscapeRoomSession,
} from '@/hooks/use-escape-room-session';
import {
  calcularPuntos,
  esCorrecta,
  intentosMaximosDeSala,
  pistasDeSala,
  pistasReveladasPorIntentos,
} from '@/lib/escape-room-logic';
import type { EscapeRoomRankingRow } from '@/lib/escape-room-live.types';
import { useSound } from '@/hooks/use-sound';
import { cn } from '@/lib/utils';
import type { Block, EscapeRoomActivity, EscapeRoomSala } from '@/types/slide.types';
import { normalizeEscapeRoomActivity } from '@/components/editor/activities/escape-room-editor';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'sala' | 'victoria' | 'derrota' | 'cerrado';
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
  slideId?: string;
  editorSyncKey?: string;
  liveSocket?: Socket | null;
  onComplete?: (points: number, timeMs?: number) => void;
  onAnswer?: (salaId: string, answer: string, correct?: boolean, intento?: number) => void;
  /**
   * Pinta el lienzo visual de una sala (`bloques` / `fondo`) cuando el autor lo
   * diseñó. Lo inyecta `SlideRenderer`, que es quien sabe renderizar bloques: así
   * el viewer no importa el renderer y no se crea un ciclo de módulos.
   * Si falta, la sala cae a la tarjeta de texto de siempre.
   */
  renderSalaCanvas?: (sala: EscapeRoomSala) => ReactNode;
  /** Se llama al pulsar "Finalizar" en la pantalla de cierre. */
  onExit?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

/**
 * Bloques del lienzo de una sala que el estudiante puede ver.
 * Se descartan los de tipo `actividad`: el acertijo lo sirve el propio viewer y
 * el diseñador tampoco los deja insertar (`EscapeRoomSalaCanvas`).
 */
export function bloquesVisiblesDeSala(sala: EscapeRoomSala): Block[] {
  return (sala.bloques ?? []).filter((b) => b.tipo !== 'actividad');
}

export function salaTieneLienzo(sala: EscapeRoomSala): boolean {
  return bloquesVisiblesDeSala(sala).length > 0;
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
  studentId,
  studentName,
  classId,
  slideId,
  editorSyncKey,
  liveSocket,
  onComplete,
  onAnswer,
  renderSalaCanvas,
  onExit,
}: EscapeRoomViewerProps) {
  const { play } = useSound();
  const isDark = variant === 'dark';

  const act = normalizeEscapeRoomActivity(activity);
  const salas = act.salas;
  const totalSalas = Math.max(1, salas.length);
  const tiempoLimiteSeg =
    (act.tiempoLimiteMinutos ?? 0) > 0 ? act.tiempoLimiteMinutos! * 60 : 0;

  const session = useEscapeRoomSession({
    liveSocket,
    classId,
    slideId,
    studentId,
    studentName,
    editorSyncKey,
  });
  const isLive = session.mode === 'live';
  const { requestRanking } = session;
  const mostrarRanking = act.mostrarRanking !== false;

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
  const [ranking, setRanking] = useState<EscapeRoomRankingRow[]>([]);
  const [livePistaTexts, setLivePistaTexts] = useState<string[]>([]);
  const [mostrarPistasLive, setMostrarPistasLive] = useState(false);
  const [joiningTeam, setJoiningTeam] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tiempoInicioRef = useRef(0);
  const puntosRef = useRef(0);
  const prevLiveSalaRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;
  /** El cierre en vivo llega por estado del servidor: notificar una sola vez. */
  const cierreNotificadoRef = useRef(false);
  puntosRef.current = puntosAcumulados;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Reset cuando cambia el slide en previsualización (modo local únicamente)
  useEffect(() => {
    if (isLive && session.team) return;
    stopTimer();
    setPhase('intro');
    setSalaActual(0);
    setIntentos(0);
    setPuntosAcumulados(0);
    setTiempoRestante(tiempoLimiteSeg);
    setMostrarPista(false);
    setLivePistaTexts([]);
    setMostrarPistasLive(false);
    setInputValue('');
    setSelectedOption(null);
    setFeedback('none');
    setHistorial([]);
    setTiempoFinal(0);
    setAdvancing(false);
    setRanking([]);
    prevLiveSalaRef.current = 0;
    cierreNotificadoRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorSyncKey]);

  // Sincronizar progreso del equipo desde el servidor (reconexión + compañeros)
  useEffect(() => {
    if (!isLive || !session.team) return;

    const team = session.team;
    const historialLive = historialFromTeam(team, salas);
    const salaIdx = Math.min(team.salaIndex, totalSalas - 1);
    const currentRoom = team.rooms.find((r) => r.salaIndex === team.salaIndex);

    if (team.finished || team.salaIndex >= totalSalas) {
      stopTimer();
      const elapsed = session.startedAtMs
        ? Date.now() - session.startedAtMs
        : Date.now() - tiempoInicioRef.current;
      setTiempoFinal(elapsed);
      setPuntosAcumulados(team.points);
      setHistorial(historialLive);
      if (phaseRef.current !== 'cerrado') setPhase('victoria');
      if (!cierreNotificadoRef.current) {
        cierreNotificadoRef.current = true;
        onCompleteRef.current?.(team.points, elapsed);
      }
      return;
    }

    const hadProgress =
      team.salaIndex > 0 ||
      team.rooms.some((r) => r.status === 'superada' || r.status === 'agotada');

    if (hadProgress && phaseRef.current === 'intro') {
      tiempoInicioRef.current = session.startedAtMs ?? Date.now();
      setPhase('sala');
    }

    if (
      team.salaIndex > prevLiveSalaRef.current &&
      phaseRef.current === 'sala' &&
      !advancing
    ) {
      const prevRoom = team.rooms.find(
        (r) => r.salaIndex === prevLiveSalaRef.current,
      );
      setAdvancing(true);
      setFeedback(prevRoom?.status === 'agotada' ? 'bloqueada' : 'correcto');
      window.setTimeout(() => {
        setAdvancing(false);
        setFeedback('none');
        setInputValue('');
        setSelectedOption(null);
        setMostrarPista(false);
        setMostrarPistasLive(false);
        setLivePistaTexts([]);
      }, 1500);
    }

    prevLiveSalaRef.current = team.salaIndex;
    setSalaActual(salaIdx);
    setPuntosAcumulados(team.points);
    setHistorial(historialLive);
    setIntentos(currentRoom?.intentos ?? 0);
  }, [
    advancing,
    isLive,
    salas,
    session.startedAtMs,
    session.team,
    totalSalas,
  ]);

  // Reloj compartido en vivo (arranque del docente)
  useEffect(() => {
    if (!isLive || phase === 'intro' || phase === 'victoria' || phase === 'derrota') {
      return undefined;
    }
    if (tiempoLimiteSeg <= 0 || session.startedAtMs == null) return undefined;

    const tick = () => {
      const rest = tiempoRestanteLive(session.startedAtMs, tiempoLimiteSeg);
      if (rest != null) setTiempoRestante(rest);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isLive, phase, session.startedAtMs, tiempoLimiteSeg]);

  // Podio de cierre: solo en vivo y solo cuando la partida terminó para el equipo
  useEffect(() => {
    if (!isLive || !mostrarRanking) return;
    if (phase !== 'victoria' && phase !== 'derrota') return;
    let cancelado = false;
    void requestRanking().then((rows) => {
      if (!cancelado) setRanking(rows);
    });
    return () => {
      cancelado = true;
    };
  }, [isLive, mostrarRanking, phase, requestRanking]);

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
    void (async () => {
      if (isLive && !session.team) {
        setJoiningTeam(true);
        const ok = await session.joinTeam();
        setJoiningTeam(false);
        if (!ok) return;
      }

      const now = session.startedAtMs ?? Date.now();
      tiempoInicioRef.current = now;
      if (isLive && session.startedAtMs != null && tiempoLimiteSeg > 0) {
        setTiempoRestante(
          tiempoRestanteLive(session.startedAtMs, tiempoLimiteSeg) ?? tiempoLimiteSeg,
        );
      } else {
        setTiempoRestante(tiempoLimiteSeg);
      }
      setPhase('sala');

      if (!isLive && tiempoLimiteSeg > 0) {
        stopTimer();
        timerRef.current = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) { stopTimer(); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    })();
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

    if (isLive && session.team) {
      void (async () => {
        const ack = await session.submitAnswer(sala.id, respuesta);
        onAnswerRef.current?.(
          sala.id,
          respuesta,
          ack.outcome === 'correcto',
          ack.intento,
        );

        if (!ack.ok) return;

        if (ack.outcome === 'correcto') {
          play('correct');
          setFeedback('correcto');
          setAdvancing(true);
          window.setTimeout(() => {
            setAdvancing(false);
            setFeedback('none');
            setInputValue('');
            setSelectedOption(null);
            setMostrarPista(false);
            setMostrarPistasLive(false);
            setLivePistaTexts([]);
          }, 1500);
        } else if (ack.outcome === 'incorrecto') {
          play('wrong');
          setFeedback('incorrecto');
          setIntentos(ack.intento ?? intentos + 1);
          if (ack.pistas && ack.pistas.length > 0) {
            setLivePistaTexts(ack.pistas);
            setMostrarPistasLive(true);
          }
        } else if (ack.outcome === 'bloqueada') {
          play('wrong');
          setFeedback('bloqueada');
          setAdvancing(true);
          window.setTimeout(() => {
            setAdvancing(false);
            setFeedback('none');
          }, 1500);
        } else if (
          ack.outcome === 'ya_resuelta' ||
          ack.outcome === 'sala_no_activa'
        ) {
          setFeedback('none');
          setInputValue('');
          setSelectedOption(null);
        }
      })();
      return;
    }

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

      const maxIntentos = intentosMaximosDeSala(sala);
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

  // Podio: solo en vivo, solo al cerrar y solo si el autor lo dejó activo.
  const podio =
    mostrarRanking && ranking.length > 0 ? (
      <div className="w-full max-w-xs space-y-1">
        <p
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wider',
            isDark ? 'text-white/50' : 'text-[#9ca3af]',
          )}
        >
          Ranking de equipos
        </p>
        {ranking.map((r) => {
          const propio = session.team?.id === r.teamId;
          return (
            <div
              key={r.teamId}
              className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs',
                propio
                  ? isDark
                    ? 'bg-[#2563EB]/30 text-white'
                    : 'bg-[#dbeafe] text-[#1d4ed8]'
                  : isDark
                    ? 'bg-white/10 text-white/90'
                    : 'bg-[#f9fafb] text-[#111827]',
              )}
            >
              <span className="w-4 shrink-0 text-center font-bold tabular-nums">
                {r.position}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
              {!r.finished && (
                <span
                  className={cn(
                    'shrink-0 text-[10px]',
                    isDark ? 'text-white/50' : 'text-[#9ca3af]',
                  )}
                >
                  en juego
                </span>
              )}
              <span className="shrink-0 font-semibold tabular-nums">{r.points} pts</span>
            </div>
          );
        })}
      </div>
    ) : null;

  const botonFinalizar = (
    <button
      type="button"
      onClick={() => {
        setPhase('cerrado');
        onExit?.();
      }}
      className={cn(
        'mt-1 rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
        isDark
          ? 'bg-white/15 text-white hover:bg-white/25'
          : 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]',
      )}
    >
      Finalizar
    </button>
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
            {isLive && (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  isDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
                )}
              >
                Modo equipos
              </span>
            )}
          </div>

          {isLive && session.team && (
            <div
              className={cn(
                'w-full max-w-xs rounded-lg border px-3 py-2 text-left text-xs',
                isDark ? 'border-white/20 bg-white/10 text-white/90' : 'border-[#e5e7eb] bg-[#f9fafb] text-[#111827]',
              )}
            >
              <p className="font-semibold">{session.team.name}</p>
              <p className={cn('mt-1', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
                {session.team.members.map((m) => m.studentName).join(' · ') ||
                  'Esperando compañeros…'}
              </p>
            </div>
          )}

          {isLive && session.joinError && (
            <p className="text-xs font-medium text-red-500">{session.joinError}</p>
          )}

          <Button
            type="button"
            disabled={joiningTeam || session.hydrating}
            className="mt-2 gap-2 bg-[#2563EB] px-6 text-white hover:bg-[#1d4ed8]"
            onClick={comenzar}
          >
            {joiningTeam ? 'Uniéndote al equipo…' : '▶ Comenzar'}
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

          {podio}
          {botonFinalizar}
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

          {podio}
          {botonFinalizar}
        </div>
      </div>
    );
  }

  // ─── CERRADO ───────────────────────────────────────────────────────────────

  if (phase === 'cerrado') {
    return (
      <div className={shell}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-[#111827]')}>
            Actividad finalizada
          </p>
          <p className={cn('text-xs', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
            <span className="font-semibold tabular-nums">{puntosAcumulados}</span> puntos
            {tiempoFinal > 0 ? ` · ${formatMs(tiempoFinal)}` : ''}
          </p>
        </div>
      </div>
    );
  }

  // ─── SALA ──────────────────────────────────────────────────────────────────

  if (!sala) return null;

  const inputDisabled = advancing || feedback === 'correcto' || feedback === 'bloqueada';
  const confirmDisabled = inputDisabled || !puedeConfirmar;
  // Salas legacy no traen `bloques`: sin lienzo, la tarjeta de texto queda igual.
  const salaCanvas =
    renderSalaCanvas && salaTieneLienzo(sala) ? renderSalaCanvas(sala) : null;
  const maxIntentosSala = intentosMaximosDeSala(sala);
  const intentosRestantes = Number.isFinite(maxIntentosSala) ? maxIntentosSala - intentos : null;
  /** Pistas desbloqueadas en modo local: la n-ésima se revela tras el n-ésimo fallo. */
  const pistasLocales = pistasDeSala(sala).slice(0, pistasReveladasPorIntentos(sala, intentos));

  return (
    <div className={shell}>

      {/* Header: progreso + timer */}
      <div className="mb-3 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn('text-xs font-semibold', isDark ? 'text-white/70' : 'text-[#6b7280]')}
          >
            Sala {salaActual + 1} de {totalSalas}
            {isLive && session.team ? (
              <span className={cn('ml-2 font-normal', isDark ? 'text-white/50' : 'text-[#9ca3af]')}>
                · {session.team.name}
              </span>
            ) : null}
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

        {/* Lienzo visual de la sala — solo si el autor lo diseñó */}
        {salaCanvas && (
          <div
            className={cn(
              'shrink-0 overflow-hidden rounded-lg border',
              isDark ? 'border-white/15' : 'border-[#e5e7eb]',
            )}
          >
            {salaCanvas}
          </div>
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

        {/* Botón pista — aparece tras el primer fallo (local) o vía servidor (vivo) */}
        {isLive && session.team && intentos >= 1 && feedback !== 'correcto' && !advancing ? (
          !mostrarPistasLive ? (
            <button
              type="button"
              onClick={() => {
                void session.requestHint(sala.id).then((pistas) => {
                  if (pistas.length > 0) {
                    setLivePistaTexts(pistas);
                    setMostrarPistasLive(true);
                  }
                });
              }}
              className={cn(
                'flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                isDark
                  ? 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  : 'border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] hover:bg-[#f3f4f6]',
              )}
            >
              <Eye className="size-3.5" aria-hidden />
              Pedir pista
            </button>
          ) : (
            <div
              className={cn(
                'space-y-1.5 rounded-lg border px-3 py-2 text-xs animate-in fade-in duration-200',
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-amber-200 bg-[#fef3c7] text-[#92400e]',
              )}
            >
              {(livePistaTexts.length > 0 ? livePistaTexts : session.livePistas.map((_, i) => `Pista ${i + 1}`)).map(
                (text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{text}</span>
                  </div>
                ),
              )}
            </div>
          )
        ) : null}

        {!isLive && pistasLocales.length > 0 && feedback !== 'correcto' && !advancing && (
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
              {pistasLocales.length > 1 ? `Ver pistas (${pistasLocales.length})` : 'Ver pista'}
            </button>
          ) : (
            <div
              className={cn(
                'space-y-1.5 rounded-lg border px-3 py-2 text-xs animate-in fade-in duration-200',
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-amber-200 bg-[#fef3c7] text-[#92400e]',
              )}
            >
              {pistasLocales.map((texto, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{texto}</span>
                </div>
              ))}
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
