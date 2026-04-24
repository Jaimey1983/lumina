import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AutonomousSessionsController, ClassAutonomousSessionsController } from './autonomous-sessions.controller';
import { AutonomousSessionsService } from './autonomous-sessions.service';

function autonomousLogger(req: any, _res: any, next: () => void) {
  const auth = req.headers.authorization ?? 'MISSING';
  const preview = auth.startsWith('Bearer ') ? `Bearer ${auth.slice(7, 20)}…` : auth;
  console.log(`[ROUTE-HIT] ${req.method} ${req.originalUrl}  | Authorization: ${preview}`);
  next();
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lumina_super_secret_key_2025_cambiar_en_produccion',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AutonomousSessionsController, ClassAutonomousSessionsController],
  providers: [AutonomousSessionsService, JwtStrategy],
})
export class AutonomousSessionsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(autonomousLogger)
      .forRoutes(
        { path: 'autonomous-sessions/:sessionId', method: RequestMethod.PATCH },
        { path: 'autonomous-sessions/:sessionId', method: RequestMethod.DELETE },
      );
  }
}
