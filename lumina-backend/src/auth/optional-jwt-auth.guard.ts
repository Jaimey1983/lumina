import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Adjunta `req.user` si hay un Bearer válido; nunca rechaza (usuario anónimo = `null`). */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: unknown, user: T | false): T | null {
    return user || null;
  }
}
