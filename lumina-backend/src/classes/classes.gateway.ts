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
import { ClassesService } from './classes.service';

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
  ) {}

  private classRoom(classId: string) {
    return `class-${classId}`;
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
}
