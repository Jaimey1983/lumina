import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import {
  xpFromEvaluation,
  type ActivityEvaluationResult,
} from '../classes/activity-scoring';

export interface EstudianteGamificacion {
  studentId: string;
  nombre: string;
  xp: number;
  racha: number;
  maxRacha: number;
  actividades: number;
  badges: string[];
  ultimaNota: number | null;
}

export interface SesionGamificacion {
  sessionId: string;
  estudiantes: Record<string, EstudianteGamificacion>;
  iniciada: number;
  leaderboardVisible: boolean;
}

const BADGES_AUTO = [
  {
    id: 'racha_3',
    nombre: '🔥 Racha x3',
    condicion: (e: EstudianteGamificacion) => e.racha >= 3,
  },
  {
    id: 'racha_5',
    nombre: '🔥 Racha x5',
    condicion: (e: EstudianteGamificacion) => e.racha >= 5,
  },
  {
    id: 'perfecto',
    nombre: '⭐ Perfecto',
    condicion: (e: EstudianteGamificacion) => e.ultimaNota === 5,
  },
  {
    id: 'xp_100',
    nombre: '💯 100 XP',
    condicion: (e: EstudianteGamificacion) => e.xp >= 100,
  },
  {
    id: 'xp_300',
    nombre: '🚀 300 XP',
    condicion: (e: EstudianteGamificacion) => e.xp >= 300,
  },
  {
    id: 'activo_5',
    nombre: '🎯 5 actividades',
    condicion: (e: EstudianteGamificacion) => e.actividades >= 5,
  },
  {
    id: 'activo_10',
    nombre: '🏆 10 actividades',
    condicion: (e: EstudianteGamificacion) => e.actividades >= 10,
  },
];

@Injectable()
export class SessionGamificationService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private key(sessionId: string) {
    return `gamif:${sessionId}`;
  }

  async iniciarSesion(sessionId: string): Promise<void> {
    const sesion: SesionGamificacion = {
      sessionId,
      estudiantes: {},
      iniciada: Date.now(),
      leaderboardVisible: true,
    };
    await this.redis.set(this.key(sessionId), JSON.stringify(sesion), 'EX', 86400);
  }

  async registrarEstudiante(
    sessionId: string,
    studentId: string,
    nombre: string,
  ): Promise<void> {
    const sesion = await this.getSesion(sessionId);
    if (!sesion) return;
    if (!sesion.estudiantes[studentId]) {
      sesion.estudiantes[studentId] = {
        studentId,
        nombre,
        xp: 0,
        racha: 0,
        maxRacha: 0,
        actividades: 0,
        badges: [],
        ultimaNota: null,
      };
      await this.saveSesion(sessionId, sesion);
    }
  }

  async registrarActividad(
    sessionId: string,
    studentId: string,
    evaluation: ActivityEvaluationResult,
    nombre?: string,
  ): Promise<{
    estudiante: EstudianteGamificacion;
    badgesNuevos: string[];
    xpGanado: number;
  } | null> {
    const sesion = await this.getSesion(sessionId);
    if (!sesion) return null;

    let e = sesion.estudiantes[studentId];
    if (!e) {
      e = {
        studentId,
        nombre: nombre?.trim() || studentId,
        xp: 0,
        racha: 0,
        maxRacha: 0,
        actividades: 0,
        badges: [],
        ultimaNota: null,
      };
    } else if (nombre?.trim()) {
      e.nombre = nombre.trim();
    }

    const xpGanado = xpFromEvaluation(evaluation);
    const notaClamped =
      evaluation.score !== null && Number.isFinite(evaluation.score)
        ? Math.min(5, Math.max(1, evaluation.score))
        : null;
    const aprobado = notaClamped !== null && notaClamped >= 3.0;

    e.xp += xpGanado;
    e.actividades += 1;
    e.ultimaNota = notaClamped;
    e.racha = aprobado ? e.racha + 1 : 0;
    e.maxRacha = Math.max(e.maxRacha, e.racha);

    const badgesNuevos: string[] = [];
    for (const badge of BADGES_AUTO) {
      if (!e.badges.includes(badge.id) && badge.condicion(e)) {
        e.badges.push(badge.id);
        badgesNuevos.push(badge.nombre);
      }
    }

    sesion.estudiantes[studentId] = e;
    await this.saveSesion(sessionId, sesion);

    return { estudiante: e, badgesNuevos, xpGanado };
  }

  async getLeaderboard(sessionId: string): Promise<EstudianteGamificacion[]> {
    const sesion = await this.getSesion(sessionId);
    if (!sesion) return [];
    return Object.values(sesion.estudiantes).sort((a, b) => b.xp - a.xp);
  }

  async isLeaderboardVisible(sessionId: string): Promise<boolean> {
    const sesion = await this.getSesion(sessionId);
    return sesion?.leaderboardVisible ?? false;
  }

  async setLeaderboardVisible(
    sessionId: string,
    visible: boolean,
  ): Promise<boolean> {
    const sesion = await this.getSesion(sessionId);
    if (!sesion) return false;
    sesion.leaderboardVisible = visible;
    await this.saveSesion(sessionId, sesion);
    return true;
  }

  async sesionActiva(sessionId: string): Promise<boolean> {
    return (await this.getSesion(sessionId)) !== null;
  }

  async terminarSesion(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  private async saveSesion(
    sessionId: string,
    sesion: SesionGamificacion,
  ): Promise<void> {
    await this.redis.set(this.key(sessionId), JSON.stringify(sesion), 'EX', 86400);
  }

  private async getSesion(
    sessionId: string,
  ): Promise<SesionGamificacion | null> {
    const raw = await this.redis.get(this.key(sessionId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SesionGamificacion;
      if (parsed.leaderboardVisible === undefined) {
        parsed.leaderboardVisible = true;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
