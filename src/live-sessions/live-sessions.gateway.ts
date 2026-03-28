import { HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveSessionsService } from './live-sessions.service';
import { JoinLiveDto } from './dto/join-live.dto';
import { SlideSyncDto } from './dto/slide-sync.dto';

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
export class LiveSessionsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly liveSessions: LiveSessionsService) {}

  async handleConnection(client: Socket) {
    try {
      await this.liveSessions.authenticateConnection(client);
    } catch {
      client.disconnect(true);
    }
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
}
