import { HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { LiveSessionsService } from './live-sessions.service';
import { TorneoService } from '../torneo/torneo.service';
import type { RankingEntry } from '../torneo/torneo.service';
import { EscapeRoomLiveService } from '../escape-room/escape-room-live.service';
import { QuizLiveService } from '../quiz-live/quiz-live.service';
import { EscapeRoomInitDto } from './dto/escape-room-init.dto';
import { JoinLiveDto } from './dto/join-live.dto';
import { SlideSyncDto } from './dto/slide-sync.dto';

/** Sala en namespace `/` donde están los viewers con `join-class` (no confundir con `live:${id}` en `/live`). */
function classJoinRoom(classId: string): string {
  return `class-${classId}`;
}

function wireTorneoRankingPayload(rows: RankingEntry[]): {
  ranking: {
    studentId: string;
    studentName: string;
    points: number;
    position: number;
  }[];
} {
  return {
    ranking: rows.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      points: r.total,
      position: r.position,
    })),
  };
}

function rethrowAsWs(e: unknown): never {
  if (e instanceof WsException) {
    throw e;
  }
  if (e instanceof HttpException) {
    const r = e.getResponse();
    const msg =
      typeof r === 'string'
        ? r
        : Array.isArray((r as { message?: string[] }).message)
          ? (r as { message: string[] }).message[0]
          : ((r as { message?: string }).message ?? e.message);
    throw new WsException(msg);
  }
  throw e;
}

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@WebSocketGateway({
  namespace: '/live',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class LiveSessionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly liveSessions: LiveSessionsService,
    private readonly torneoService: TorneoService,
    private readonly escapeRoom: EscapeRoomLiveService,
    private readonly quizLive: QuizLiveService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      await this.liveSessions.authenticateConnection(client);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    await this.liveSessions.onSocketDisconnect(client);
  }

  /**
   * Anfitrión: PUBLISHED → LIVE, limpia slide en memoria, une a la sala.
   * Emite a la sala `session:started`.
   */
  @SubscribeMessage('session:start')
  async handleSessionStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinLiveDto,
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      const { room, transitionedToLive } =
        await this.liveSessions.startLiveSession(client, body.classId);
      if (transitionedToLive) {
        this.server.to(room).emit('session:started', {
          classId: body.classId,
          startedBy: user.id,
        });
      }
      return {
        ok: true as const,
        classId: body.classId,
        room,
        transitionedToLive,
      };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /**
   * Anfitrión: LIVE → PUBLISHED, vacía estado. Emite `session:ended` y expulsa la sala.
   */
  @SubscribeMessage('session:end')
  async handleSessionEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinLiveDto,
  ) {
    try {
      const { room } = await this.liveSessions.endLiveSession(
        client,
        body.classId,
      );
      this.server.to(room).emit('session:ended', { classId: body.classId });
      this.server.in(room).socketsLeave(room);
      return { ok: true as const, classId: body.classId };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /** Entrar en sala; ack con `currentSlide` si hay estado (entrada tardía). */
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinLiveDto,
  ) {
    try {
      const result = await this.liveSessions.joinLiveClass(
        client,
        body.classId,
      );
      return {
        ok: true as const,
        classId: body.classId,
        room: result.room,
        currentSlide: result.currentSlide,
        isHost: result.isHost,
      };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /** Estado de diapositiva sin re-unirse (mismas reglas que join). */
  @SubscribeMessage('slide:state')
  async handleSlideState(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinLiveDto,
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      const currentSlide = await this.liveSessions.getSlideStateForClient(
        user,
        body.classId,
      );
      return { ok: true as const, classId: body.classId, currentSlide };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinLiveDto,
  ) {
    try {
      await this.liveSessions.leaveLiveClass(client, body.classId);
      return { ok: true as const, classId: body.classId };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /** Sincroniza diapositiva (solo clases LIVE). Persiste estado para nuevos joins. */
  @SubscribeMessage('slide:sync')
  async handleSlideSync(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SlideSyncDto,
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      const { slideId, order } = await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );
      const currentSlide = this.liveSessions.applySlideSync(
        body.classId,
        slideId,
        order,
        user.id,
      );
      const room = this.liveSessions.roomName(body.classId);
      client.to(room).emit('slide:current', {
        classId: body.classId,
        ...currentSlide,
      });
      return { ok: true as const, classId: body.classId, ...currentSlide };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('torneo:init')
  async handleTorneoInit(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { classId: string; sessionId: string; totalQuestions?: number },
  ) {
    try {
      const session = await this.torneoService.createSession(
        body.classId,
        body.sessionId,
      );
      const room = this.liveSessions.roomName(body.classId);
      const classRoom = classJoinRoom(body.classId);
      const startPayload = {
        torneoId: session.id,
        totalQuestions: body.totalQuestions || 0,
      };
      this.server.to(room).emit('torneo:start', startPayload);
      this.server.server.to(classRoom).emit('torneo:start', startPayload);
      return { ok: true };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('torneo:launch-question')
  async handleTorneoLaunch(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      torneoId: string;
      index: number;
      question: { options?: unknown; [key: string]: unknown };
      timeLimit: number;
    },
  ) {
    try {
      // `timeLimit` viene en segundos desde el panel; setTimeout y TorneoService usan ms.
      const timeLimitSec = Math.max(
        1,
        Math.floor(Number(body.timeLimit ?? 30) || 1),
      );
      const timeLimitMs = timeLimitSec * 1000;
      await this.torneoService.startQuestion(
        body.torneoId,
        body.index,
        body.question,
        timeLimitMs,
      );
      const session = await this.torneoService.getSession(body.torneoId);
      if (!session) throw new WsException('Torneo session not found');
      const room = this.liveSessions.roomName(session.classId);
      const classRoom = classJoinRoom(session.classId);

      const questionPayload = {
        index: body.index,
        questionIndex: body.index,
        question: body.question,
        options: body.question?.options,
        tiempoSegundos: timeLimitSec,
        timeLimit: timeLimitSec,
      };
      this.server.to(room).emit('torneo:question', questionPayload);
      this.server.server.to(classRoom).emit('torneo:question', questionPayload);

      setTimeout(() => {
        void (async () => {
          try {
            const ranking = await this.torneoService.getRanking(body.torneoId);
            const rankingPayload = wireTorneoRankingPayload(ranking);
            this.server.to(room).emit('torneo:ranking', rankingPayload);
            this.server.server
              .to(classRoom)
              .emit('torneo:ranking', rankingPayload);
          } catch {
            // ignore
          }
        })();
      }, timeLimitMs);

      return { ok: true };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('torneo:answer')
  async handleTorneoAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      torneoId: string;
      questionIndex: number;
      answer: string;
      correctAnswer: string;
      studentId: string;
      studentName: string;
    },
  ) {
    try {
      await this.torneoService.saveAnswer(
        body.torneoId,
        body.questionIndex,
        body.studentId,
        body.studentName,
        body.answer,
        body.correctAnswer,
      );
      return { ok: true };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('torneo:finish')
  async handleTorneoFinish(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { torneoId: string },
  ) {
    try {
      await this.torneoService.finishSession(body.torneoId);
      const session = await this.torneoService.getSession(body.torneoId);
      if (!session) throw new WsException('Torneo session not found');
      const room = this.liveSessions.roomName(session.classId);
      const classRoom = classJoinRoom(session.classId);

      const ranking = await this.torneoService.getRanking(body.torneoId);
      const rankingPayload = wireTorneoRankingPayload(ranking);
      const endPayload = {
        ...rankingPayload,
        podio: rankingPayload.ranking.slice(0, 3),
      };
      this.server.to(room).emit('torneo:end', endPayload);
      this.server.server.to(classRoom).emit('torneo:end', endPayload);

      return { ok: true };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /** Emite eventos de quiz synced a docente (`/live`) y estudiantes (`/`). */
  private broadcastQuiz(classId: string, event: string, payload: unknown) {
    const room = this.liveSessions.roomName(classId);
    const classRoom = classJoinRoom(classId);
    this.server.to(room).emit(event, payload);
    this.server.server.to(classRoom).emit(event, payload);
  }

  private wireQuizRankingPayload(
    rows: ReturnType<QuizLiveService['getRanking']>,
  ) {
    return {
      ranking: rows.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        points: r.points,
        correctCount: r.correctCount,
        position: r.position,
      })),
    };
  }

  @SubscribeMessage('quiz:launch')
  async handleQuizLaunch(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      classId: string;
      quizBlockId: string;
      slideId: string;
      questionIndex: number;
      question: {
        id: string;
        texto?: string;
        opciones?: { id: string; esCorrecta?: boolean }[];
      };
      totalQuestions: number;
      timePerQuestion?: number;
      layoutVariant?: string;
      shuffleOptions?: boolean;
      autoAdvanceOnAllAnswered?: boolean;
    },
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );

      this.quizLive.initSession({
        classId: body.classId,
        quizBlockId: body.quizBlockId,
        slideId: body.slideId,
        totalQuestions: body.totalQuestions,
        timePerQuestion: body.timePerQuestion,
        autoAdvanceOnAllAnswered: body.autoAdvanceOnAllAnswered,
      });

      const questionId = body.question?.id ?? `q-${body.questionIndex}`;
      const opciones = Array.isArray(body.question?.opciones)
        ? body.question.opciones
        : [];

      const session = this.quizLive.launchQuestion(
        body.classId,
        body.quizBlockId,
        body.questionIndex,
        questionId,
        opciones,
        body.timePerQuestion,
        {
          onTick: ({ quizBlockId, secondsLeft }) => {
            this.broadcastQuiz(body.classId, 'timer:tick', {
              quizBlockId,
              secondsLeft,
            });
          },
          onEnd: ({ quizBlockId, questionId: qid }) => {
            this.broadcastQuiz(body.classId, 'timer:end', {
              quizBlockId,
              questionId: qid,
            });
            const ranking = this.quizLive.getRanking(
              body.classId,
              body.quizBlockId,
            );
            this.broadcastQuiz(body.classId, 'quiz:ranking', {
              quizBlockId,
              ...this.wireQuizRankingPayload(ranking),
            });
          },
        },
      );

      if (!session)
        throw new WsException('No se pudo lanzar la pregunta del quiz');

      const launchPayload = {
        quizBlockId: body.quizBlockId,
        questionIndex: body.questionIndex,
        questionId,
        question: body.question,
        totalQuestions: body.totalQuestions,
        timePerQuestion: session.timePerQuestion,
        layoutVariant: body.layoutVariant,
        shuffleOptions: body.shuffleOptions,
      };
      this.broadcastQuiz(body.classId, 'quiz:launch', launchPayload);

      return { ok: true as const };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('quiz:pause')
  async handleQuizPause(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { classId: string; quizBlockId: string; slideId: string },
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );
      this.quizLive.pause(body.classId, body.quizBlockId);
      this.broadcastQuiz(body.classId, 'quiz:pause', {
        quizBlockId: body.quizBlockId,
      });
      return { ok: true as const };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('quiz:resume')
  async handleQuizResume(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { classId: string; quizBlockId: string; slideId: string },
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );
      this.quizLive.resume(body.classId, body.quizBlockId);
      this.broadcastQuiz(body.classId, 'quiz:resume', {
        quizBlockId: body.quizBlockId,
      });
      return { ok: true as const };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('quiz:skip')
  async handleQuizSkip(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { classId: string; quizBlockId: string; slideId: string },
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );
      this.quizLive.skip(body.classId, body.quizBlockId);
      this.broadcastQuiz(body.classId, 'quiz:skip', {
        quizBlockId: body.quizBlockId,
      });
      return { ok: true as const };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  @SubscribeMessage('quiz:finish')
  async handleQuizFinish(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { classId: string; quizBlockId: string; slideId: string },
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );
      this.quizLive.finish(body.classId, body.quizBlockId);
      const ranking = this.quizLive.getRanking(body.classId, body.quizBlockId);
      const payload = {
        quizBlockId: body.quizBlockId,
        ...this.wireQuizRankingPayload(ranking),
      };
      this.broadcastQuiz(body.classId, 'quiz:ranking', payload);
      return { ok: true as const };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /**
   * Idempotente — reabrir devuelve la partida existente sin perder progreso.
   */
  @SubscribeMessage('escape-room:init')
  async handleEscapeRoomInit(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: EscapeRoomInitDto,
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      // Misma guarda que `slide:sync`: staff del curso + clase LIVE + slide de la clase.
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );

      const state = await this.escapeRoom.initRun({
        classId: body.classId,
        slideId: body.slideId,
        teamCount: body.teamCount,
        teamNames: body.teamNames,
      });

      const payload = {
        classId: body.classId,
        slideId: body.slideId,
        runId: state.runId,
        totalSalas: state.totalSalas,
        tiempoLimiteMinutos: state.tiempoLimiteMinutos,
        startedAtMs: state.startedAtMs,
      };
      this.server
        .to(this.liveSessions.roomName(body.classId))
        .emit('escape-room:started', payload);
      this.server.server
        .to(classJoinRoom(body.classId))
        .emit('escape-room:started', payload);

      return { ok: true as const, ...state };
    } catch (e) {
      rethrowAsWs(e);
    }
  }

  /** Docente: matriz de equipos × salas para el panel en vivo. */
  @SubscribeMessage('escape-room:dashboard')
  async handleEscapeRoomDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SlideSyncDto,
  ) {
    try {
      const user = this.liveSessions.getUser(client);
      await this.liveSessions.assertSlideSyncAllowed(
        user,
        body.classId,
        body.slideId,
      );
      const dashboard = await this.escapeRoom.getDashboard({
        classId: body.classId,
        slideId: body.slideId,
      });
      return { ok: true as const, dashboard };
    } catch (e) {
      rethrowAsWs(e);
    }
  }
}
