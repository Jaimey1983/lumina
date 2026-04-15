import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ClassesGateway {
  @WebSocketServer()
  server: Server;

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
  handleStudentResponse(
    @MessageBody() data: {
      classId: string;
      slideId: string;
      slideIndex: number;
      activityType: string;
      studentId: string;
      correct: boolean | null;
      response: unknown;
    },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`class-${data.classId}`).emit('response-update', data);
  }

  @SubscribeMessage('end-session')
  handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { classId: string },
  ) {
    this.server.to(`class-${payload.classId}`).emit('class-ended');
  }
}
