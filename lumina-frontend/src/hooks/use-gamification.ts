'use client';

import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { ActivityEvaluationResult } from '@/lib/activity-scoring';

export interface EstudianteLeaderboard {
  studentId: string;
  nombre: string;
  xp: number;
  racha: number;
  maxRacha: number;
  actividades: number;
  badges: string[];
}

export interface GamificacionEvento {
  studentId: string;
  nombre: string;
  xpGanado: number;
  racha: number;
  badgesNuevos: string[];
}

interface UseGamificationProps {
  socket: Socket | null;
  sessionId: string | null;
  classId: string | null;
  isViewer: boolean;
  studentId?: string;
  studentName?: string;
}

export function useGamification({
  socket,
  sessionId,
  classId,
  isViewer,
  studentId,
  studentName,
}: UseGamificationProps) {
  const [leaderboard, setLeaderboard] = useState<EstudianteLeaderboard[]>([]);
  const [miPosicion, setMiPosicion] = useState<number | null>(null);
  const [badgesNuevos, setBadgesNuevos] = useState<string[]>([]);
  const [ultimoEvento, setUltimoEvento] = useState<GamificacionEvento | null>(null);
  const [activo, setActivo] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onUpdate = (data: {
      leaderboard: EstudianteLeaderboard[];
      evento: GamificacionEvento;
      leaderboardVisible?: boolean;
    }) => {
      setLeaderboard(data.leaderboard);
      setUltimoEvento(data.evento);
      setActivo(true);
      if (typeof data.leaderboardVisible === 'boolean') {
        setLeaderboardVisible(data.leaderboardVisible);
      }
      if (studentId) {
        const pos = data.leaderboard.findIndex((e) => e.studentId === studentId);
        setMiPosicion(pos !== -1 ? pos + 1 : null);
      }
    };

    const onStarted = (data: {
      sessionId: string;
      leaderboardVisible: boolean;
      leaderboard?: EstudianteLeaderboard[];
    }) => {
      if (sessionId && data.sessionId !== sessionId) return;
      setActivo(true);
      setLeaderboardVisible(data.leaderboardVisible);
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    };

    const onVisibility = (data: { visible: boolean }) => {
      setLeaderboardVisible(Boolean(data.visible));
    };

    const onBadges = (data: { badges: string[] }) => {
      setBadgesNuevos(data.badges);
      setTimeout(() => setBadgesNuevos([]), 4000);
    };

    socket.on('gamification:update', onUpdate);
    socket.on('gamification:started', onStarted);
    socket.on('gamification:visibility', onVisibility);
    socket.on('gamification:badges', onBadges);

    return () => {
      socket.off('gamification:update', onUpdate);
      socket.off('gamification:started', onStarted);
      socket.off('gamification:visibility', onVisibility);
      socket.off('gamification:badges', onBadges);
    };
  }, [socket, sessionId, studentId]);

  useEffect(() => {
    if (!socket || !sessionId) return;
    socket.emit(
      'gamification:leaderboard',
      { sessionId },
      (res: {
        leaderboard?: EstudianteLeaderboard[];
        leaderboardVisible?: boolean;
        active?: boolean;
      }) => {
        if (!res || res.leaderboard === undefined) return;
        if (res.active) setActivo(true);
        setLeaderboard(res.leaderboard);
        if (typeof res.leaderboardVisible === 'boolean') {
          setLeaderboardVisible(res.leaderboardVisible);
        }
      },
    );
  }, [socket, sessionId]);

  const reportarActividad = useCallback(
    (evaluation: ActivityEvaluationResult) => {
      if (!socket || !sessionId || !classId || !isViewer || !studentId) return;
      if (evaluation.score === null || !Number.isFinite(evaluation.score)) return;
      socket.emit('activity:complete', {
        sessionId,
        classId,
        studentId,
        nombre: studentName ?? studentId,
        score: evaluation.score,
        correct: evaluation.correct,
      });
    },
    [socket, sessionId, classId, isViewer, studentId, studentName],
  );

  const iniciarGamificacion = useCallback(() => {
    if (!socket || !sessionId || !classId || isViewer) return;
    socket.emit('gamification:start', { sessionId, classId });
    setActivo(true);
    setLeaderboardVisible(true);
  }, [socket, sessionId, classId, isViewer]);

  const toggleLeaderboardVisible = useCallback(
    (visible: boolean) => {
      if (!socket || !sessionId || !classId || isViewer) return;
      socket.emit('gamification:toggle-visibility', {
        sessionId,
        classId,
        visible,
      });
      setLeaderboardVisible(visible);
    },
    [socket, sessionId, classId, isViewer],
  );

  return {
    leaderboard,
    miPosicion,
    badgesNuevos,
    ultimoEvento,
    activo,
    leaderboardVisible,
    reportarActividad,
    iniciarGamificacion,
    toggleLeaderboardVisible,
  };
}
