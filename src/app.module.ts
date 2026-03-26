import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ClassesModule } from './classes/classes.module';
import { PerformanceIndicatorsModule } from './performance-indicators/performance-indicators.module';
import { ActivitiesModule } from './activities/activities.module';
import { GradebookModule } from './gradebook/gradebook.module';
import { GradeCalculationModule } from './grade-calculation/grade-calculation.module';
import { SelfEvaluationModule } from './self-evaluation/self-evaluation.module';
import { PeerEvaluationModule } from './peer-evaluation/peer-evaluation.module';
import { LiveSessionsModule } from './live-sessions/live-sessions.module';
import { H5pActivitiesModule } from './h5p-activities/h5p-activities.module';
import { GamificationModule } from './gamification/gamification.module';
import { ClassEditorModule } from './class-editor/class-editor.module';
import { MessagingModule } from './messaging/messaging.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GradebookReportsModule } from './gradebook-reports/gradebook-reports.module';
import { PerformanceTrackingModule } from './performance-tracking/performance-tracking.module';

@Module({
  imports: [
    // Config global — disponible en todos los módulos sin reimportar
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — ttl en MILISEGUNDOS (v5+): 60_000 = 60 segundos
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),

    // Infraestructura
    PrismaModule,
    CommonModule,

    // ── Fase 1 MVP Core — COMPLETA ────────────────────────────────────────
    AuthModule,
    UsersModule,
    CoursesModule,
    ClassesModule,
    PerformanceIndicatorsModule,
    ActivitiesModule,
    GradebookModule,
    GradeCalculationModule,
    SelfEvaluationModule,
    PeerEvaluationModule,
    LiveSessionsModule,

    // ── Fase 2 — H5P Activities + Gamification + Class Editor ────────────
    H5pActivitiesModule,
    GamificationModule,
    ClassEditorModule,
    MessagingModule,
    AnalyticsModule,
    GradebookReportsModule,
    PerformanceTrackingModule,
  ],
})
export class AppModule {}
