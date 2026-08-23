import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AutonomousSessionsController, ClassAutonomousSessionsController } from './autonomous-sessions.controller';
import { AutonomousSessionsService } from './autonomous-sessions.service';

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
export class AutonomousSessionsModule {}
