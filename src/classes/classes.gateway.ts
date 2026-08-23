import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TorneoService } from '../torneo/torneo.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ClassesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly torneoService: TorneoService) {}

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
  handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string },
  ) {
    this.server.to(`class-${payload.classId}`).emit('class-ended');
  }
}
