import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  findEscapeRoomActivity,
  type EscapeRoomActivityServer,
  type EscapeRoomSalaServer,
} from './escape-room-activity';
import {
  calcularPuntos,
  esCorrecta,
  intentosMaximosDeSala,
  pistasDeSala,
} from './escape-room-logic';

/**
 * Motor en vivo de Escape Room por equipos (Fase 5, capa 1).
 *
 * Reparto de responsabilidades (decisión D4 del plan de acción):
 *  - El DISEÑO de la actividad sigue en `Slide.content` (contenido de autoría).
 *  - Postgres es la ÚNICA verdad del progreso: equipo, sala, intentos y pistas.
 *  - El reloj compartido de la partida es `run.startedAt`. No se usa Redis: a
 *    diferencia del reloj por pregunta de Torneo (alta rotación, `EX 60`), aquí
 *    es un valor que se escribe una vez, así que duplicarlo en Redis no aporta.
 *
 * La autoridad de validación es el servidor: nunca se confía en el `correct`
 * que envíe el cliente. Las transiciones de sala se serializan con `updateMany`
 * guardado por estado, que en Postgres es atómico a nivel de fila y por tanto
 * también protege con varias réplicas de Node.
 */

export type EscapeRoomRoomStatus = 'abierta' | 'superada' | 'agotada';

export type EscapeRoomAnswerOutcome =
  | 'correcto'
  | 'incorrecto'
  | 'bloqueada'
  | 'ya_resuelta'
  | 'sala_no_activa';

export interface EscapeRoomTeamPublic {
  id: string;
  name: string;
  salaIndex: number;
  points: number;
  finished: boolean;
  members: { studentId: string; studentName: string }[];
  rooms: {
    salaId: string;
    salaIndex: number;
    status: EscapeRoomRoomStatus;
    intentos: number;
    pistasReveladas: number;
    points: number;
    solvedByStudentName: string | null;
  }[];
}

export interface EscapeRoomStatePublic {
  runId: string;
  classId: string;
  slideId: string;
  sessionId: string;
  status: string;
  startedAtMs: number;
  totalSalas: number;
  tiempoLimiteMinutos: number;
  mostrarRanking: boolean;
  team: EscapeRoomTeamPublic | null;
}

interface RunRow {
  id: string;
  classId: string;
  sessionId: string;
  slideId: string;
  status: string;
  startedAt: Date;
}

export interface EscapeRoomRankingRow {
  teamId: string;
  name: string;
  points: number;
  finished: boolean;
  salaIndex: number;
  position: number;
}

/** Terminados primero, luego más puntos, luego más salas superadas. */
export function rankTeams(
  teams: EscapeRoomTeamPublic[],
): EscapeRoomRankingRow[] {
  return [...teams]
    .sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (b.points !== a.points) return b.points - a.points;
      return b.salaIndex - a.salaIndex;
    })
    .map((t, i) => ({
      teamId: t.id,
      name: t.name,
      points: t.points,
      finished: t.finished,
      salaIndex: t.salaIndex,
      position: i + 1,
    }));
}

const DEFAULT_TEAM_COUNT = 2;
const MAX_TEAM_COUNT = 12;

function teamNameFor(index: number): string {
  return `Equipo ${index + 1}`;
}

@Injectable()
export class EscapeRoomLiveService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Lectura de la actividad (autoría en JSON) ──────────────────────────────

  private async loadActivity(
    classId: string,
    slideId: string,
  ): Promise<EscapeRoomActivityServer> {
    const slide = await this.prisma.slide.findFirst({
      where: { id: slideId, classId },
      select: { content: true },
    });
    if (!slide) {
      throw new NotFoundException('Diapositiva no encontrada en esta clase');
    }
    const activity = findEscapeRoomActivity(slide.content);
    if (!activity) {
      throw new BadRequestException('Esta diapositiva no tiene un Escape Room');
    }
    if (activity.salas.length === 0) {
      throw new BadRequestException(
        'El Escape Room no tiene salas configuradas',
      );
    }
    return activity;
  }

  private async resolveSessionId(classId: string): Promise<string> {
    const session = await this.prisma.classSession.findFirst({
      where: { classId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });
    if (!session) {
      throw new BadRequestException(
        'No hay una sesión en vivo activa para esta clase',
      );
    }
    return session.id;
  }

  private async findRun(
    sessionId: string,
    slideId: string,
  ): Promise<RunRow | null> {
    return this.prisma.escapeRoomRun.findFirst({
      where: { sessionId, slideId },
      select: {
        id: true,
        classId: true,
        sessionId: true,
        slideId: true,
        status: true,
        startedAt: true,
      },
    });
  }

  // ── Docente: abrir la partida y crear equipos ────────────────────────────

  /**
   * Idempotente: si ya hay partida para (sesión, slide) la reutiliza.
   * `teamNames` permite reparto manual; si no, crea `teamCount` equipos vacíos.
   */
  async initRun(params: {
    classId: string;
    slideId: string;
    sessionId?: string;
    teamCount?: number;
    teamNames?: string[];
  }): Promise<EscapeRoomStatePublic & { created: boolean }> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    if (!classId || !slideId) {
      throw new BadRequestException('classId y slideId son obligatorios');
    }

    const activity = await this.loadActivity(classId, slideId);
    const sessionId =
      params.sessionId?.trim() || (await this.resolveSessionId(classId));

    let run = await this.findRun(sessionId, slideId);
    const created = !run;
    if (!run) {
      run = await this.prisma.escapeRoomRun.create({
        data: { classId, sessionId, slideId },
        select: {
          id: true,
          classId: true,
          sessionId: true,
          slideId: true,
          status: true,
          startedAt: true,
        },
      });
    }

    const names = this.resolveTeamNames(params);
    for (const name of names) {
      await this.ensureTeam(run.id, name);
    }

    const state = await this.buildState(run, activity, null);
    return { ...state, created };
  }

  private resolveTeamNames(params: {
    teamCount?: number;
    teamNames?: string[];
  }): string[] {
    const explicit = (params.teamNames ?? [])
      .map((n) => String(n ?? '').trim())
      .filter((n) => n.length > 0);
    if (explicit.length > 0) return explicit.slice(0, MAX_TEAM_COUNT);

    const raw = Number(params.teamCount);
    const count =
      Number.isFinite(raw) && raw >= 1
        ? Math.min(Math.floor(raw), MAX_TEAM_COUNT)
        : DEFAULT_TEAM_COUNT;
    return Array.from({ length: count }, (_, i) => teamNameFor(i));
  }

  private async ensureTeam(runId: string, name: string) {
    const existing = await this.prisma.escapeRoomTeam.findFirst({
      where: { runId, name },
      select: { id: true },
    });
    if (existing) return existing.id;
    try {
      const team = await this.prisma.escapeRoomTeam.create({
        data: { runId, name },
        select: { id: true },
      });
      return team.id;
    } catch {
      // Carrera con otro docente/pestaña creando el mismo equipo.
      const again = await this.prisma.escapeRoomTeam.findFirst({
        where: { runId, name },
        select: { id: true },
      });
      if (!again) throw new BadRequestException('No se pudo crear el equipo');
      return again.id;
    }
  }

  // ── Estudiante: entrar a un equipo ────────────────────────────────────────

  /**
   * Un estudiante = un equipo por partida. Si ya pertenece a uno, devuelve ese
   * (esto es también el camino de reconexión con cambio de dispositivo).
   * Sin `teamName`, entra al equipo con menos miembros (reparto automático).
   */
  async joinTeam(params: {
    classId: string;
    slideId: string;
    studentId: string;
    studentName?: string;
    teamName?: string;
  }): Promise<EscapeRoomStatePublic> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    const studentId = params.studentId?.trim();
    if (!classId || !slideId || !studentId) {
      throw new BadRequestException(
        'classId, slideId y studentId son obligatorios',
      );
    }

    const activity = await this.loadActivity(classId, slideId);
    const sessionId = await this.resolveSessionId(classId);
    const run = await this.findRun(sessionId, slideId);
    if (!run) {
      throw new BadRequestException(
        'El docente aún no ha abierto el Escape Room por equipos',
      );
    }

    const existing = await this.prisma.escapeRoomTeamMember.findFirst({
      where: { runId: run.id, studentId },
      select: { teamId: true },
    });
    if (existing) {
      return this.buildState(run, activity, existing.teamId);
    }

    const teamId = await this.pickTeam(run.id, params.teamName);
    const studentName = params.studentName?.trim() || studentId;
    try {
      await this.prisma.escapeRoomTeamMember.create({
        data: { teamId, runId: run.id, studentId, studentName },
      });
    } catch {
      // Unique (runId, studentId): otra pestaña del mismo alumno ganó la carrera.
      const again = await this.prisma.escapeRoomTeamMember.findFirst({
        where: { runId: run.id, studentId },
        select: { teamId: true },
      });
      if (again) return this.buildState(run, activity, again.teamId);
      throw new BadRequestException('No se pudo asignar el equipo');
    }

    await this.ensureRoomRow(teamId, activity, 0);
    return this.buildState(run, activity, teamId);
  }

  private async pickTeam(runId: string, teamName?: string): Promise<string> {
    const wanted = teamName?.trim();
    if (wanted) return this.ensureTeam(runId, wanted);

    const teams = await this.prisma.escapeRoomTeam.findMany({
      where: { runId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
    if (teams.length === 0) {
      return this.ensureTeam(runId, teamNameFor(0));
    }

    const counts = await this.prisma.escapeRoomTeamMember.findMany({
      where: { runId },
      select: { teamId: true },
    });
    const porEquipo = new Map<string, number>();
    for (const t of teams) porEquipo.set(t.id, 0);
    for (const m of counts) {
      porEquipo.set(m.teamId, (porEquipo.get(m.teamId) ?? 0) + 1);
    }

    let elegido = teams[0].id;
    let minimo = Number.POSITIVE_INFINITY;
    for (const t of teams) {
      const n = porEquipo.get(t.id) ?? 0;
      if (n < minimo) {
        minimo = n;
        elegido = t.id;
      }
    }
    return elegido;
  }

  private async ensureRoomRow(
    teamId: string,
    activity: EscapeRoomActivityServer,
    salaIndex: number,
  ) {
    const sala = activity.salas[salaIndex];
    if (!sala) return;
    const existing = await this.prisma.escapeRoomTeamRoom.findFirst({
      where: { teamId, salaId: sala.id },
      select: { id: true },
    });
    if (existing) return;
    try {
      await this.prisma.escapeRoomTeamRoom.create({
        data: { teamId, salaId: sala.id, salaIndex },
      });
    } catch {
      /* unique (teamId, salaId): otro miembro la creó primero */
    }
  }

  // ── Estudiante: responder ────────────────────────────────────────────────

  /**
   * El servidor valida contra el JSON de la sala. `correct` del cliente se
   * ignora por diseño. La primera respuesta correcta del equipo gana; las
   * simultáneas caen en `ya_resuelta` sin volver a avanzar.
   */
  async answer(params: {
    classId: string;
    slideId: string;
    studentId: string;
    studentName?: string;
    salaId: string;
    answer: string;
  }): Promise<{
    outcome: EscapeRoomAnswerOutcome;
    intento: number;
    puntos: number;
    pistas: string[];
    state: EscapeRoomStatePublic;
  }> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    const studentId = params.studentId?.trim();
    const salaId = params.salaId?.trim();
    if (!classId || !slideId || !studentId || !salaId) {
      throw new BadRequestException('Faltan datos para registrar la respuesta');
    }

    const activity = await this.loadActivity(classId, slideId);
    const { run, team } = await this.requireTeam(classId, slideId, studentId);

    const salaIndex = activity.salas.findIndex((s) => s.id === salaId);
    const sala = salaIndex >= 0 ? activity.salas[salaIndex] : null;
    if (!sala) {
      throw new NotFoundException('Sala no encontrada en este Escape Room');
    }

    const vacio = { puntos: 0, pistas: [] as string[] };
    if (salaIndex !== team.salaIndex) {
      return {
        outcome: 'sala_no_activa',
        intento: 0,
        ...vacio,
        state: await this.buildState(run, activity, team.id),
      };
    }

    await this.ensureRoomRow(team.id, activity, salaIndex);
    const room = await this.prisma.escapeRoomTeamRoom.findFirst({
      where: { teamId: team.id, salaId },
      select: { id: true, status: true, intentos: true },
    });
    if (!room || room.status !== 'abierta') {
      return {
        outcome: 'ya_resuelta',
        intento: room?.intentos ?? 0,
        ...vacio,
        state: await this.buildState(run, activity, team.id),
      };
    }

    const respuesta = String(params.answer ?? '');
    const intento = room.intentos + 1;
    const acierto = esCorrecta(sala, respuesta);

    if (acierto) {
      const puntos = calcularPuntos(intento, activity.puntosBase);
      const claimed = await this.prisma.escapeRoomTeamRoom.updateMany({
        where: { teamId: team.id, salaId, status: 'abierta' },
        data: {
          status: 'superada',
          intentos: intento,
          points: puntos,
          solvedByStudentId: studentId,
          solvedByStudentName: params.studentName?.trim() || studentId,
        },
      });
      if (claimed.count === 0) {
        return {
          outcome: 'ya_resuelta',
          intento,
          ...vacio,
          state: await this.buildState(run, activity, team.id),
        };
      }
      await this.advanceTeam(team.id, salaIndex, puntos, activity);
      return {
        outcome: 'correcto',
        intento,
        puntos,
        pistas: [],
        state: await this.buildState(run, activity, team.id),
      };
    }

    const maxIntentos = intentosMaximosDeSala(sala);
    const agotada = intento >= maxIntentos;

    const applied = await this.prisma.escapeRoomTeamRoom.updateMany({
      where: { teamId: team.id, salaId, status: 'abierta' },
      data: agotada
        ? { status: 'agotada', intentos: intento, points: 0 }
        : { intentos: intento },
    });
    if (applied.count === 0) {
      return {
        outcome: 'ya_resuelta',
        intento,
        ...vacio,
        state: await this.buildState(run, activity, team.id),
      };
    }

    if (agotada) {
      // D2: la sala queda bloqueada con 0 puntos y el equipo avanza igual.
      await this.advanceTeam(team.id, salaIndex, 0, activity);
      return {
        outcome: 'bloqueada',
        intento,
        puntos: 0,
        pistas: this.pistasVisibles(sala, intento),
        state: await this.buildState(run, activity, team.id),
      };
    }

    return {
      outcome: 'incorrecto',
      intento,
      puntos: 0,
      pistas: this.pistasVisibles(sala, intento),
      state: await this.buildState(run, activity, team.id),
    };
  }

  /** Guardado por `salaIndex`: dos avances simultáneos no saltan dos salas. */
  private async advanceTeam(
    teamId: string,
    fromIndex: number,
    puntos: number,
    activity: EscapeRoomActivityServer,
  ) {
    const next = fromIndex + 1;
    const termina = next >= activity.salas.length;
    const moved = await this.prisma.escapeRoomTeam.updateMany({
      where: { id: teamId, salaIndex: fromIndex },
      data: {
        salaIndex: next,
        points: { increment: puntos },
        ...(termina ? { finishedAt: new Date() } : {}),
      },
    });
    if (moved.count === 0) return;
    if (!termina) {
      await this.ensureRoomRow(teamId, activity, next);
    }
  }

  // ── Estudiante: pedir pista ──────────────────────────────────────────────

  /** D3: revelado progresivo, sin penalización de puntos ni cooldown. */
  async requestHint(params: {
    classId: string;
    slideId: string;
    studentId: string;
    salaId: string;
  }): Promise<{
    pistas: string[];
    reveladas: number;
    total: number;
    state: EscapeRoomStatePublic;
  }> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    const studentId = params.studentId?.trim();
    const salaId = params.salaId?.trim();
    if (!classId || !slideId || !studentId || !salaId) {
      throw new BadRequestException('Faltan datos para pedir la pista');
    }

    const activity = await this.loadActivity(classId, slideId);
    const { run, team } = await this.requireTeam(classId, slideId, studentId);

    const sala = activity.salas.find((s) => s.id === salaId);
    if (!sala) {
      throw new NotFoundException('Sala no encontrada en este Escape Room');
    }
    const todas = pistasDeSala(sala);

    await this.ensureRoomRow(team.id, activity, team.salaIndex);
    const room = await this.prisma.escapeRoomTeamRoom.findFirst({
      where: { teamId: team.id, salaId },
      select: { pistasReveladas: true },
    });
    const reveladas = Math.min((room?.pistasReveladas ?? 0) + 1, todas.length);
    if (todas.length > 0) {
      await this.prisma.escapeRoomTeamRoom.updateMany({
        where: { teamId: team.id, salaId, pistasReveladas: { lt: reveladas } },
        data: { pistasReveladas: reveladas },
      });
    }

    return {
      pistas: todas.slice(0, reveladas),
      reveladas,
      total: todas.length,
      state: await this.buildState(run, activity, team.id),
    };
  }

  // ── Reconexión y panel docente ───────────────────────────────────────────

  /** Hidratación tras recarga o reconexión. `null` si no hay partida abierta. */
  async getStateForStudent(params: {
    classId: string;
    slideId: string;
    studentId: string;
  }): Promise<EscapeRoomStatePublic | null> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    const studentId = params.studentId?.trim();
    if (!classId || !slideId || !studentId) return null;

    const activity = await this.loadActivity(classId, slideId);
    const sessionId = await this.resolveSessionId(classId);
    const run = await this.findRun(sessionId, slideId);
    if (!run) return null;

    const member = await this.prisma.escapeRoomTeamMember.findFirst({
      where: { runId: run.id, studentId },
      select: { teamId: true },
    });
    return this.buildState(run, activity, member?.teamId ?? null);
  }

  /** Estado agregado de todos los equipos (lo consume el dashboard de capa 4). */
  async getDashboard(params: { classId: string; slideId: string }): Promise<{
    runId: string;
    totalSalas: number;
    salas: { id: string; nombre: string }[];
    startedAtMs: number;
    teams: EscapeRoomTeamPublic[];
  } | null> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    if (!classId || !slideId) return null;

    const activity = await this.loadActivity(classId, slideId);
    const sessionId = await this.resolveSessionId(classId);
    const run = await this.findRun(sessionId, slideId);
    if (!run) return null;

    const teams = await this.loadTeams(run.id);
    return {
      runId: run.id,
      totalSalas: activity.salas.length,
      salas: activity.salas.map((s) => ({ id: s.id, nombre: s.nombre })),
      startedAtMs: run.startedAt.getTime(),
      teams,
    };
  }

  /**
   * Podio de cierre para el estudiante. Devuelve vacío mientras su equipo siga
   * jugando: el ranking en vivo es del panel docente, no de la pantalla del
   * estudiante.
   */
  async getRankingForStudent(params: {
    classId: string;
    slideId: string;
    studentId: string;
  }): Promise<EscapeRoomRankingRow[]> {
    const classId = params.classId?.trim();
    const slideId = params.slideId?.trim();
    const studentId = params.studentId?.trim();
    if (!classId || !slideId || !studentId) return [];

    const activity = await this.loadActivity(classId, slideId);
    if (!activity.mostrarRanking) return [];

    const { run, team } = await this.requireTeam(classId, slideId, studentId);
    const teams = await this.loadTeams(run.id);
    const propio = teams.find((t) => t.id === team.id);
    if (!propio?.finished) return [];

    return rankTeams(teams);
  }

  // ── Internos ─────────────────────────────────────────────────────────────

  private async requireTeam(
    classId: string,
    slideId: string,
    studentId: string,
  ): Promise<{ run: RunRow; team: { id: string; salaIndex: number } }> {
    const sessionId = await this.resolveSessionId(classId);
    const run = await this.findRun(sessionId, slideId);
    if (!run) {
      throw new BadRequestException(
        'No hay una partida de Escape Room abierta',
      );
    }
    const member = await this.prisma.escapeRoomTeamMember.findFirst({
      where: { runId: run.id, studentId },
      select: { teamId: true },
    });
    if (!member) {
      throw new BadRequestException('Este estudiante no tiene equipo asignado');
    }
    const team = await this.prisma.escapeRoomTeam.findFirst({
      where: { id: member.teamId },
      select: { id: true, salaIndex: true },
    });
    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }
    return { run, team };
  }

  private pistasVisibles(
    sala: EscapeRoomSalaServer,
    intentos: number,
  ): string[] {
    const todas = pistasDeSala(sala);
    if (todas.length === 0 || intentos < 1) return [];
    return todas.slice(0, Math.min(intentos, todas.length));
  }

  private async loadTeams(runId: string): Promise<EscapeRoomTeamPublic[]> {
    const teams = await this.prisma.escapeRoomTeam.findMany({
      where: { runId },
      select: {
        id: true,
        name: true,
        salaIndex: true,
        points: true,
        finishedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    if (teams.length === 0) return [];

    const teamIds = teams.map((t) => t.id);
    const [members, rooms] = await Promise.all([
      this.prisma.escapeRoomTeamMember.findMany({
        where: { teamId: { in: teamIds } },
        select: { teamId: true, studentId: true, studentName: true },
      }),
      this.prisma.escapeRoomTeamRoom.findMany({
        where: { teamId: { in: teamIds } },
        select: {
          teamId: true,
          salaId: true,
          salaIndex: true,
          status: true,
          intentos: true,
          pistasReveladas: true,
          points: true,
          solvedByStudentName: true,
        },
      }),
    ]);

    return teams.map((t) => ({
      id: t.id,
      name: t.name,
      salaIndex: t.salaIndex,
      points: t.points,
      finished: t.finishedAt !== null,
      members: members
        .filter((m) => m.teamId === t.id)
        .map((m) => ({ studentId: m.studentId, studentName: m.studentName })),
      rooms: rooms
        .filter((r) => r.teamId === t.id)
        .sort((a, b) => a.salaIndex - b.salaIndex)
        .map((r) => ({
          salaId: r.salaId,
          salaIndex: r.salaIndex,
          status: r.status as EscapeRoomRoomStatus,
          intentos: r.intentos,
          pistasReveladas: r.pistasReveladas,
          points: r.points,
          solvedByStudentName: r.solvedByStudentName ?? null,
        })),
    }));
  }

  private async buildState(
    run: RunRow,
    activity: EscapeRoomActivityServer,
    teamId: string | null,
  ): Promise<EscapeRoomStatePublic> {
    const teams = await this.loadTeams(run.id);
    return {
      runId: run.id,
      classId: run.classId,
      slideId: run.slideId,
      sessionId: run.sessionId,
      status: run.status,
      startedAtMs: run.startedAt.getTime(),
      totalSalas: activity.salas.length,
      tiempoLimiteMinutos: activity.tiempoLimiteMinutos,
      mostrarRanking: activity.mostrarRanking,
      team: teamId ? (teams.find((t) => t.id === teamId) ?? null) : null,
    };
  }
}
