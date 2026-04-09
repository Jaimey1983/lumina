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

  @SubscribeMessage('student-response')
  handleStudentResponse(
    @MessageBody() data: { classId: string; slideIndex: number; activityType: string; response: unknown; studentId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`class-${data.classId}`).emit('response-update', data);
  }
}
