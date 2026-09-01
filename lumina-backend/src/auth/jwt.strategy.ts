import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtAuthUser } from './jwt-auth-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    /** Sesión de soporte. */
    imp?: boolean;
    /** Admin que impersona. */
    act?: string;
    /** `jti` de `AdminImpersonationSession`. */
    jti?: string;
  }): Promise<JwtAuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        verificationStatus: true,
        verificationMethod: true,
        verificationExpiresAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Token inválido');
    }

    let impersonatedBy: string | null = null;
    let impersonationJti: string | null = null;

    if (payload.imp) {
      if (!payload.jti || !payload.act) {
        throw new UnauthorizedException('Token de soporte inválido');
      }
      const session = await this.prisma.adminImpersonationSession.findUnique({
        where: { jti: payload.jti },
      });
      if (
        !session ||
        session.endedAt !== null ||
        session.targetUserId !== payload.sub
      ) {
        throw new UnauthorizedException('Sesión de soporte finalizada');
      }
      impersonatedBy = payload.act;
      impersonationJti = payload.jti;
    }

    return { ...user, impersonatedBy, impersonationJti };
  }
}
