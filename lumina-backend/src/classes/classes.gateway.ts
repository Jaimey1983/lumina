import { HttpException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TorneoService } from '../torneo/torneo.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';
import { EscapeRoomLiveService } from '../escape-room/escape-room-live.service';
import { QuizLiveService } from '../quiz-live/quiz-live.service';
import { ClassesService } from './classes.service';

function errorMessage(e: unknown): string {
  if (e instanceof HttpException) {
    const r = e.getResponse();
    if (typeof r === 'string') return r;
    const msg = (r as { message?: string | string[] }).message;
    if (Array.isArray(msg)) return msg[0] ?? e.message;
    return msg ?? e.message;
  }
  return e instanceof Error ? e.message : 'Error inesperado';
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ClassesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly torneoService: TorneoService,
    private readonly sessionGamification: SessionGamificationService,
    private readonly classesService: ClassesService,
    private readonly escapeRoom: EscapeRoomLiveService,
    private readonly quizLive: QuizLiveService,
  ) {}

  private classRoom(classId: string) {
    return `class-${classId}`;
  }

  /**
   * Los viewers viven en `class-${id}` (namespace `/`) y el docente en
   * `live:${id}` (namespace `/live`), así que el progreso se emite a ambos.
   */
  private broadcastToClass(classId: string, event: string, payload: unknown) {
    this.server.to(this.classRoom(classId)).emit(event, payload);
    this.server.of('/live').to(`live:${classId}`).emit(event, payload);
  }

  @SubscribeMessage('join-class')
  handleJoinClass(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string },
  ) {
    client.join(`class-${payload.classId}`);
    return { ok: true };
  }

  @SubscribeMessage('slide-change')
  handleSlideChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { slideIndex: number; classId: string },
  ) {
    client.to(`class-${payload.classId}`).emit('slide-change', payload);
  }

  @SubscribeMessage('timer-start')
  handleTimerStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string; slideId: string; duration: number },
  ) {
    if (!payload?.classId || !payload?.slideId) {
      return { ok: false as const };
    }
    const duration = Math.max(0, Math.floor(Number(payload.duration) || 0));
    client.to(this.classRoom(payload.classId)).emit('timer-start', {
      classId: payload.classId,
      slideId: payload.slideId,
      duration,
    });
    return { ok: true as const };
  }

  @SubscribeMessage('lock-responses')
  handleLockResponses(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string; slideId?: string },
  ) {
    if (!payload?.classId) {
      return { ok: false as const };
    }
    client.to(this.classRoom(payload.classId)).emit('lock-responses', payload);
    return { ok: true as const };
  }

  @SubscribeMessage('unlock-responses')
  handleUnlockResponses(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string; slideId?: string },
  ) {
    if (!payload?.classId) {
      return { ok: false as const };
    }
    client.to(this.classRoom(payload.classId)).emit('unlock-responses', payload);
    return { ok: true as const };
  }

  /** Estudiante (viewer autónomo): el docente recibe progreso por diapositiva. */
  @SubscribeMessage('student-progress')
  handleStudentProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { classId: string; studentId: string; slideIndex: number },
  ) {
    if (!payload?.classId || typeof payload.studentId !== 'string' || !payload.studentId.trim()) {
      return { ok: false as const };
    }
    const slideIndex = Math.max(0, Math.floor(Number(payload.slideIndex)));
    if (!Number.isFinite(slideIndex)) {
      return { ok: false as const };
    }
    client.to(`class-${payload.classId}`).emit('student-progress', {
      classId: payload.classId,
      studentId: payload.studentId.trim(),
      slideIndex,
    });
    return { ok: true as const };
  }

  @SubscribeMessage('student-response')
  async handleStudentResponse(
    @MessageBody()
    data: {
      classId: string;
      slideId: string;
      slideIndex: number;
      activityType: string;
      studentId: string;
      studentName?: string;
      correct: boolean | null;
      response: unknown;
    },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`class-${data.classId}`).emit('response-update', data);

    try {
      await this.classesService.upsertLiveStudentResponse(data);
    } catch {
      /* persistencia incremental no rompe el panel en vivo */
    }

    if (data.activityType !== 'torneo') {
      return { ok: true as const };
    }

    const raw = data.response;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: true as const };
    }
    const r = raw as Record<string, unknown>;
    const torneoId = typeof r.torneoId === 'string' ? r.torneoId.trim() : '';
    const questionIndexRaw = r.questionIndex;
    const questionIndex =
      typeof questionIndexRaw === 'number' && Number.isFinite(questionIndexRaw)
        ? Math.max(0, Math.floor(questionIndexRaw))
        : -1;
    const answer = typeof r.answer === 'string' ? r.answer : '';
    const correctAnswer = typeof r.correctAnswer === 'string' ? r.correctAnswer : '';
    const sid = typeof data.studentId === 'string' ? data.studentId.trim() : '';

    if (!torneoId || questionIndex < 0 || !sid) {
      return { ok: true as const };
    }

    try {
      const session = await this.torneoService.getSession(torneoId);
      if (!session || session.classId !== data.classId) {
        return { ok: true as const };
      }
      await this.torneoService.saveAnswer(
        torneoId,
        questionIndex,
        sid,
        (typeof data.studentName === 'string' ? data.studentName.trim() : '') || sid,
        answer,
        correctAnswer,
      );
    } catch {
      /* no-op: ya se notificó response-update al docente */
    }

    return { ok: true as const };
  }

  @SubscribeMessage('quiz:answer')
  async handleQuizAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      classId: string;
      quizBlockId: string;
      studentId: string;
      studentName?: string;
      questionId: string;
      optionIds: string[];
    },
  ) {
    const classId = typeof data.classId === 'string' ? data.classId.trim() : '';
    const quizBlockId = typeof data.quizBlockId === 'string' ? data.quizBlockId.trim() : '';
    const studentId = typeof data.studentId === 'string' ? data.studentId.trim() : '';
    const questionId = typeof data.questionId === 'string' ? data.questionId.trim() : '';
    const optionIds = Array.isArray(data.optionIds)
      ? data.optionIds.filter((id): id is string => typeof id === 'string')
      : [];

    if (!classId || !quizBlockId || !studentId || !questionId) {
      return { ok: false as const };
    }

    const result = this.quizLive.saveAnswer({
      classId,
      quizBlockId,
      studentId,
      studentName: typeof data.studentName === 'string' ? data.studentName : studentId,
      questionId,
      optionIds,
      opciones: [],
    });

    if (result) {
      client.to(this.classRoom(classId)).emit('response-update', {
        classId,
        activityType: 'quiz_multiple',
        studentId,
        studentName: data.studentName ?? studentId,
        correct: result.correct,
        response: { quizBlockId, questionId, optionIds },
      });

      const session = this.quizLive.getSession(classId, quizBlockId);
      if (
        session?.autoAdvanceOnAllAnswered &&
        session.questionId === questionId &&
        !result.alreadyAnswered
      ) {
        try {
          const sockets = await this.server.in(this.classRoom(classId)).fetchSockets();
          const expected = Math.max(1, sockets.length);
          if (result.answeredCount >= expected) {
            const advancePayload = {
              quizBlockId,
              questionId,
              answeredCount: result.answeredCount,
            };
            client.to(this.classRoom(classId)).emit('quiz:auto-advance-ready', advancePayload);
            this.server.of('/live').to(`live:${classId}`).emit('quiz:auto-advance-ready', advancePayload);
          }
        } catch {
          /* no-op */
        }
      }
    }

    return { ok: true as const, ...(result ?? {}) };
  }

  @SubscribeMessage('quiz:sync-state')
  handleQuizSyncState(
    @MessageBody()
    data: { classId: string; quizBlockId: string; studentId?: string },
  ) {
    const classId = typeof data.classId === 'string' ? data.classId.trim() : '';
    const quizBlockId = typeof data.quizBlockId === 'string' ? data.quizBlockId.trim() : '';
    const studentId = typeof data.studentId === 'string' ? data.studentId.trim() : '';

    if (!classId || !quizBlockId) {
      return { ok: false as const, state: null };
    }

    const state = this.quizLive.getClientSyncState(classId, quizBlockId, studentId);
    return { ok: true as const, state };
  }

  @SubscribeMessage('end-session')
  async handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string; sessionId?: string },
  ) {
    const sessionId =
      typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
    if (sessionId) {
      try {
        await this.sessionGamification.terminarSesion(sessionId);
      } catch {
        /* no-op */
      }
    }
    this.server.to(this.classRoom(payload.classId)).emit('class-ended');
  }

  @SubscribeMessage('activity:complete')
  async handleActivityComplete(
    @MessageBody()
    data: {
      sessionId: string;
      classId: string;
      studentId: string;
      nombre: string;
      score?: number | null;
      correct?: boolean | null;
      /** @deprecated alias de `score`; se acepta un despliegue mixto. */
      nota?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const sessionId = data.sessionId?.trim();
    const classId = data.classId?.trim();
    const studentId = data.studentId?.trim();
    if (!sessionId || !classId || !studentId) {
      return { ok: false as const };
    }

    const scoreRaw = data.score ?? data.nota;
    const score = typeof scoreRaw === 'number' ? scoreRaw : Number(scoreRaw);
    if (!Number.isFinite(score)) {
      return { ok: false as const };
    }

    await this.sessionGamification.registrarEstudiante(
      sessionId,
      studentId,
      data.nombre?.trim() || studentId,
    );

    const evaluation = {
      score,
      correct: data.correct ?? null,
      details: [],
    };

    const result = await this.sessionGamification.registrarActividad(
      sessionId,
      studentId,
      evaluation,
      data.nombre,
    );
    if (!result) {
      return { ok: false as const };
    }

    const { estudiante, badgesNuevos, xpGanado } = result;
    const leaderboard =
      await this.sessionGamification.getLeaderboard(sessionId);
    const leaderboardVisible =
      await this.sessionGamification.isLeaderboardVisible(sessionId);

    this.server.to(this.classRoom(classId)).emit('gamification:update', {
      leaderboard,
      leaderboardVisible,
      evento: {
        studentId,
        nombre: data.nombre?.trim() || studentId,
        xpGanado,
        racha: estudiante.racha,
        badgesNuevos,
      },
    });

    if (badgesNuevos.length > 0) {
      client.emit('gamification:badges', { badges: badgesNuevos });
    }

    return { ok: true as const };
  }

  @SubscribeMessage('gamification:start')
  async handleGamificationStart(
    @MessageBody() data: { sessionId: string; classId: string },
  ) {
    const sessionId = data.sessionId?.trim();
    const classId = data.classId?.trim();
    if (!sessionId || !classId) {
      return { ok: false as const };
    }

    await this.sessionGamification.iniciarSesion(sessionId);
    const leaderboard =
      await this.sessionGamification.getLeaderboard(sessionId);

    this.server.to(this.classRoom(classId)).emit('gamification:started', {
      sessionId,
      leaderboardVisible: true,
      leaderboard,
    });

    return { ok: true as const, leaderboard };
  }

  @SubscribeMessage('gamification:leaderboard')
  async handleGamificationLeaderboard(
    @MessageBody() data: { sessionId: string },
  ) {
    const sessionId = data.sessionId?.trim();
    if (!sessionId) {
      return { leaderboard: [] as const, leaderboardVisible: false, active: false };
    }
    const [leaderboard, leaderboardVisible, active] = await Promise.all([
      this.sessionGamification.getLeaderboard(sessionId),
      this.sessionGamification.isLeaderboardVisible(sessionId),
      this.sessionGamification.sesionActiva(sessionId),
    ]);
    return { leaderboard, leaderboardVisible, active };
  }

  @SubscribeMessage('gamification:toggle-visibility')
  async handleGamificationToggleVisibility(
    @MessageBody()
    data: { sessionId: string; classId: string; visible: boolean },
  ) {
    const sessionId = data.sessionId?.trim();
    const classId = data.classId?.trim();
    if (!sessionId || !classId) {
      return { ok: false as const };
    }

    const updated = await this.sessionGamification.setLeaderboardVisible(
      sessionId,
      Boolean(data.visible),
    );
    if (!updated) {
      return { ok: false as const };
    }

    this.server.to(this.classRoom(classId)).emit('gamification:visibility', {
      visible: Boolean(data.visible),
    });

    return { ok: true as const, visible: Boolean(data.visible) };
  }

  // ── Escape Room por equipos ───────────────────────────────────────────────
  // El `studentId` lo declara el cliente, igual que en `student-response`: este
  // namespace admite invitados sin JWT. Lo que sí es autoritativo del servidor
  // es la corrección de la respuesta, los intentos y el avance del equipo.

  private escapeRoomProgress(
    classId: string,
    slideId: string,
    state: {
      runId: string;
      totalSalas: number;
      team: {
        id: string;
        name: string;
        salaIndex: number;
        points: number;
        finished: boolean;
        rooms: unknown[];
      } | null;
    },
  ) {
    if (!state.team) return null;
    return {
      classId,
      slideId,
      runId: state.runId,
      totalSalas: state.totalSalas,
      teamId: state.team.id,
      teamName: state.team.name,
      salaIndex: state.team.salaIndex,
      points: state.team.points,
      finished: state.team.finished,
      rooms: state.team.rooms,
    };
  }

  @SubscribeMessage('escape-room:join-team')
  async handleEscapeRoomJoinTeam(
    @MessageBody()
    data: {
      classId: string;
      slideId: string;
      studentId: string;
      studentName?: string;
      teamName?: string;
    },
  ) {
    try {
      const state = await this.escapeRoom.joinTeam(data);
      const progress = this.escapeRoomProgress(
        data.classId,
        data.slideId,
        state,
      );
      if (state.team) {
        this.broadcastToClass(data.classId, 'escape-room:team-assigned', {
          ...progress,
          studentId: data.studentId,
          studentName: data.studentName ?? null,
          members: state.team.members,
        });
      }
      return { ok: true as const, state };
    } catch (e) {
      return { ok: false as const, error: errorMessage(e) };
    }
  }

  @SubscribeMessage('escape-room:answer')
  async handleEscapeRoomAnswer(
    @MessageBody()
    data: {
      classId: string;
      slideId: string;
      studentId: string;
      studentName?: string;
      salaId: string;
      answer: string;
    },
  ) {
    try {
      const result = await this.escapeRoom.answer(data);
      const progress = this.escapeRoomProgress(
        data.classId,
        data.slideId,
        result.state,
      );

      if (progress && result.outcome === 'correcto') {
        this.broadcastToClass(data.classId, 'escape-room:room-unlocked', {
          ...progress,
          salaId: data.salaId,
          intento: result.intento,
          puntos: result.puntos,
          solvedByStudentId: data.studentId,
          solvedByStudentName: data.studentName ?? null,
        });
      }
      if (progress) {
        this.broadcastToClass(data.classId, 'escape-room:team-progress', {
          ...progress,
          outcome: result.outcome,
        });
      }
      // Cierre de equipo por evento propio: los puntos del escape room no son
      // nota académica, así que nunca viajan por `activity:complete`.
      if (progress && result.state.team?.finished) {
        this.broadcastToClass(data.classId, 'escape-room:finished', {
          ...progress,
          finishedAtMs: Date.now(),
        });
      }

      return {
        ok: true as const,
        outcome: result.outcome,
        intento: result.intento,
        puntos: result.puntos,
        pistas: result.pistas,
        state: result.state,
      };
    } catch (e) {
      return { ok: false as const, error: errorMessage(e) };
    }
  }

  @SubscribeMessage('escape-room:hint-request')
  async handleEscapeRoomHint(
    @MessageBody()
    data: {
      classId: string;
      slideId: string;
      studentId: string;
      salaId: string;
    },
  ) {
    try {
      const result = await this.escapeRoom.requestHint(data);
      const progress = this.escapeRoomProgress(
        data.classId,
        data.slideId,
        result.state,
      );
      if (progress) {
        this.broadcastToClass(data.classId, 'escape-room:team-progress', {
          ...progress,
          outcome: 'pista' as const,
        });
      }
      return {
        ok: true as const,
        pistas: result.pistas,
        reveladas: result.reveladas,
        total: result.total,
      };
    } catch (e) {
      return { ok: false as const, error: errorMessage(e) };
    }
  }

  /** Hidratación tras recarga o reconexión: el estado vive en el servidor. */
  @SubscribeMessage('escape-room:state')
  async handleEscapeRoomState(
    @MessageBody()
    data: {
      classId: string;
      slideId: string;
      studentId: string;
    },
  ) {
    try {
      const state = await this.escapeRoom.getStateForStudent(data);
      return { ok: true as const, state };
    } catch (e) {
      return { ok: false as const, error: errorMessage(e) };
    }
  }

  /**
   * Podio de cierre. El servicio devuelve vacío si el equipo aún juega o si el
   * autor desactivó `mostrarRanking`.
   */
  @SubscribeMessage('escape-room:ranking')
  async handleEscapeRoomRanking(
    @MessageBody()
    data: {
      classId: string;
      slideId: string;
      studentId: string;
    },
  ) {
    try {
      const ranking = await this.escapeRoom.getRankingForStudent(data);
      return { ok: true as const, ranking };
    } catch (e) {
      return { ok: false as const, error: errorMessage(e) };
    }
  }
}
