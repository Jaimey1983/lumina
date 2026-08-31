'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import {
  parseEscapeRoomProgress,
  parseEscapeRoomRanking,
  parseEscapeRoomStarted,
  parseEscapeRoomState,
  type EscapeRoomAnswerOutcome,
  type EscapeRoomRankingRow,
  type EscapeRoomStatePublic,
  type EscapeRoomTeamPublic,
} from '@/lib/escape-room-live.types';

export type EscapeRoomSessionMode = 'local' | 'live';

export interface EscapeRoomAnswerAck {
  ok: boolean;
  outcome?: EscapeRoomAnswerOutcome;
  intento?: number;
  puntos?: number;
  pistas?: string[];
  state?: EscapeRoomStatePublic | null;
  error?: string;
}

interface UseEscapeRoomSessionOptions {
  liveSocket?: Socket | null;
  classId?: string;
  slideId?: string;
  studentId: string;
  studentName: string;
  editorSyncKey?: string;
}

interface UseEscapeRoomSessionResult {
  /** `live` solo si hay socket + ids y el docente abrió la partida. */
  mode: EscapeRoomSessionMode;
  runActive: boolean;
  team: EscapeRoomTeamPublic | null;
  startedAtMs: number | null;
  livePistas: string[];
  hydrating: boolean;
  joinError: string | null;
  joinTeam: (teamName?: string) => Promise<boolean>;
  submitAnswer: (salaId: string, answer: string) => Promise<EscapeRoomAnswerAck>;
  requestHint: (salaId: string) => Promise<string[]>;
  /** Podio de cierre. Vacío mientras el equipo siga jugando o sin `mostrarRanking`. */
  requestRanking: () => Promise<EscapeRoomRankingRow[]>;
}

function liveEligible(opts: UseEscapeRoomSessionOptions): boolean {
  return !!(
    opts.liveSocket &&
    opts.classId?.trim() &&
    opts.slideId?.trim() &&
    opts.studentId?.trim()
  );
}

function emitAck<T>(
  socket: Socket,
  event: string,
  payload: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (ack: T) => resolve(ack));
  });
}

export function useEscapeRoomSession(
  opts: UseEscapeRoomSessionOptions,
): UseEscapeRoomSessionResult {
  const eligible = liveEligible(opts);
  const [runActive, setRunActive] = useState(false);
  const [team, setTeam] = useState<EscapeRoomTeamPublic | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [livePistas, setLivePistas] = useState<string[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const teamRef = useRef(team);
  teamRef.current = team;

  const applyState = useCallback((state: EscapeRoomStatePublic | null) => {
    if (!state) {
      setRunActive(false);
      setTeam(null);
      setStartedAtMs(null);
      setLivePistas([]);
      return;
    }
    setRunActive(true);
    setStartedAtMs(state.startedAtMs);
    setTeam(state.team);
    setLivePistas([]);
  }, []);

  const refreshState = useCallback(async () => {
    const sock = opts.liveSocket;
    const classId = opts.classId?.trim();
    const slideId = opts.slideId?.trim();
    const studentId = opts.studentId?.trim();
    if (!sock || !classId || !slideId || !studentId) return;

    setHydrating(true);
    try {
      const ack = await emitAck<{
        ok: boolean;
        state?: unknown;
      }>(sock, 'escape-room:state', { classId, slideId, studentId });
      if (ack.ok) {
        applyState(parseEscapeRoomState(ack.state));
      }
    } finally {
      setHydrating(false);
    }
  }, [applyState, opts.classId, opts.liveSocket, opts.slideId, opts.studentId]);

  const handleProgress = useCallback(
    (raw: unknown) => {
      const progress = parseEscapeRoomProgress(raw);
      if (!progress) return;
      if (progress.slideId !== opts.slideId?.trim()) return;
      if (progress.classId !== opts.classId?.trim()) return;
      if (teamRef.current && progress.teamId !== teamRef.current.id) return;

      setRunActive(true);
      setStartedAtMs((prev) => prev ?? Date.now());
      setTeam((prev) => ({
        id: progress.teamId,
        name: progress.teamName,
        salaIndex: progress.salaIndex,
        points: progress.points,
        finished: progress.finished,
        members:
          progress.members && progress.members.length > 0
            ? progress.members
            : (prev?.members ?? []),
        rooms: progress.rooms,
      }));
    },
    [opts.classId, opts.slideId],
  );

  useEffect(() => {
    if (!eligible) {
      setRunActive(false);
      setTeam(null);
      setStartedAtMs(null);
      setLivePistas([]);
      setJoinError(null);
      return;
    }
    void refreshState();
  }, [eligible, opts.editorSyncKey, refreshState]);

  useEffect(() => {
    const sock = opts.liveSocket;
    if (!sock || !eligible) return undefined;

    const onStarted = (payload: unknown) => {
      const ev = parseEscapeRoomStarted(payload);
      if (!ev || ev.slideId !== opts.slideId?.trim()) return;
      setRunActive(true);
      setStartedAtMs(ev.startedAtMs);
    };

    const onAssigned = (payload: unknown) => {
      handleProgress(payload);
    };

    sock.on('escape-room:started', onStarted);
    sock.on('escape-room:team-assigned', onAssigned);
    sock.on('escape-room:team-progress', handleProgress);
    sock.on('escape-room:room-unlocked', handleProgress);

    return () => {
      sock.off('escape-room:started', onStarted);
      sock.off('escape-room:team-assigned', onAssigned);
      sock.off('escape-room:team-progress', handleProgress);
      sock.off('escape-room:room-unlocked', handleProgress);
    };
  }, [
    eligible,
    handleProgress,
    opts.liveSocket,
    opts.slideId,
  ]);

  const joinTeam = useCallback(
    async (teamName?: string): Promise<boolean> => {
      const sock = opts.liveSocket;
      const classId = opts.classId?.trim();
      const slideId = opts.slideId?.trim();
      const studentId = opts.studentId?.trim();
      if (!sock || !classId || !slideId || !studentId) return false;

      setJoinError(null);
      const ack = await emitAck<{
        ok: boolean;
        state?: unknown;
        error?: string;
      }>(sock, 'escape-room:join-team', {
        classId,
        slideId,
        studentId,
        studentName: opts.studentName?.trim() || studentId,
        ...(teamName?.trim() ? { teamName: teamName.trim() } : {}),
      });

      if (!ack.ok) {
        setJoinError(ack.error ?? 'No se pudo unir al equipo');
        return false;
      }

      applyState(parseEscapeRoomState(ack.state));
      return true;
    },
    [
      applyState,
      opts.classId,
      opts.liveSocket,
      opts.slideId,
      opts.studentId,
      opts.studentName,
    ],
  );

  const submitAnswer = useCallback(
    async (salaId: string, answer: string): Promise<EscapeRoomAnswerAck> => {
      const sock = opts.liveSocket;
      const classId = opts.classId?.trim();
      const slideId = opts.slideId?.trim();
      const studentId = opts.studentId?.trim();
      if (!sock || !classId || !slideId || !studentId) {
        return { ok: false, error: 'Sesión en vivo no disponible' };
      }

      const ack = await emitAck<{
        ok: boolean;
        outcome?: EscapeRoomAnswerOutcome;
        intento?: number;
        puntos?: number;
        pistas?: string[];
        state?: unknown;
        error?: string;
      }>(sock, 'escape-room:answer', {
        classId,
        slideId,
        studentId,
        studentName: opts.studentName?.trim() || studentId,
        salaId,
        answer,
      });

      if (!ack.ok) {
        return { ok: false, error: ack.error ?? 'Error al enviar respuesta' };
      }

      const state = parseEscapeRoomState(ack.state);
      if (state) applyState(state);
      if (Array.isArray(ack.pistas) && ack.pistas.length > 0) {
        setLivePistas(ack.pistas);
      }

      return {
        ok: true,
        outcome: ack.outcome,
        intento: ack.intento,
        puntos: ack.puntos,
        pistas: ack.pistas,
        state,
      };
    },
    [
      applyState,
      opts.classId,
      opts.liveSocket,
      opts.slideId,
      opts.studentId,
      opts.studentName,
    ],
  );

  const requestHint = useCallback(
    async (salaId: string): Promise<string[]> => {
      const sock = opts.liveSocket;
      const classId = opts.classId?.trim();
      const slideId = opts.slideId?.trim();
      const studentId = opts.studentId?.trim();
      if (!sock || !classId || !slideId || !studentId) return [];

      const ack = await emitAck<{
        ok: boolean;
        pistas?: string[];
        state?: unknown;
        error?: string;
      }>(sock, 'escape-room:hint-request', {
        classId,
        slideId,
        studentId,
        salaId,
      });

      if (!ack.ok) return [];

      const state = parseEscapeRoomState(ack.state);
      if (state) applyState(state);
      const pistas = Array.isArray(ack.pistas) ? ack.pistas : [];
      setLivePistas(pistas);
      return pistas;
    },
    [applyState, opts.classId, opts.liveSocket, opts.slideId, opts.studentId],
  );

  const requestRanking = useCallback(async (): Promise<EscapeRoomRankingRow[]> => {
    const sock = opts.liveSocket;
    const classId = opts.classId?.trim();
    const slideId = opts.slideId?.trim();
    const studentId = opts.studentId?.trim();
    if (!sock || !classId || !slideId || !studentId) return [];

    const ack = await emitAck<{
      ok: boolean;
      ranking?: unknown;
      error?: string;
    }>(sock, 'escape-room:ranking', { classId, slideId, studentId });

    if (!ack.ok) return [];
    return parseEscapeRoomRanking(ack.ranking);
  }, [opts.classId, opts.liveSocket, opts.slideId, opts.studentId]);

  const mode: EscapeRoomSessionMode =
    eligible && runActive ? 'live' : 'local';

  return {
    mode,
    runActive: eligible && runActive,
    team,
    startedAtMs,
    livePistas,
    hydrating,
    joinError,
    joinTeam,
    submitAnswer,
    requestHint,
    requestRanking,
  };
}

/** Deriva historial de salas completadas a partir del estado del equipo. */
export function historialFromTeam(
  team: EscapeRoomTeamPublic | null | undefined,
  salas: { id: string; nombre: string }[],
): { salaId: string; nombre: string; intentos: number; puntos: number }[] {
  if (!team) return [];
  return team.rooms
    .filter((r) => r.status === 'superada' || r.status === 'agotada')
    .sort((a, b) => a.salaIndex - b.salaIndex)
    .map((r) => ({
      salaId: r.salaId,
      nombre: salas.find((s) => s.id === r.salaId)?.nombre ?? `Sala ${r.salaIndex + 1}`,
      intentos: r.intentos,
      puntos: r.points,
    }));
}

/** Segundos restantes según reloj compartido de la partida. */
export function tiempoRestanteLive(
  startedAtMs: number | null,
  tiempoLimiteSeg: number,
): number | null {
  if (tiempoLimiteSeg <= 0 || startedAtMs == null) return null;
  const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
  return Math.max(0, tiempoLimiteSeg - elapsed);
}
