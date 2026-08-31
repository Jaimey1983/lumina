/**
 * Contratos de socket Escape Room en vivo (capa 2).
 * Espejo de los payloads de `EscapeRoomLiveService` / `ClassesGateway`.
 */

export type EscapeRoomRoomStatus = 'abierta' | 'superada' | 'agotada';

export type EscapeRoomAnswerOutcome =
  | 'correcto'
  | 'incorrecto'
  | 'bloqueada'
  | 'ya_resuelta'
  | 'sala_no_activa';

export interface EscapeRoomTeamRoomPublic {
  salaId: string;
  salaIndex: number;
  status: EscapeRoomRoomStatus;
  intentos: number;
  pistasReveladas: number;
  points: number;
  solvedByStudentName: string | null;
}

export interface EscapeRoomTeamPublic {
  id: string;
  name: string;
  salaIndex: number;
  points: number;
  finished: boolean;
  members: { studentId: string; studentName: string }[];
  rooms: EscapeRoomTeamRoomPublic[];
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

/** Fila del podio de cierre (`escape-room:ranking`). */
export interface EscapeRoomRankingRow {
  teamId: string;
  name: string;
  points: number;
  finished: boolean;
  salaIndex: number;
  position: number;
}

/** Estado agregado que el docente pide con `escape-room:dashboard`. */
export interface EscapeRoomDashboardPublic {
  runId: string;
  totalSalas: number;
  salas: { id: string; nombre: string }[];
  startedAtMs: number;
  teams: EscapeRoomTeamPublic[];
}

export interface EscapeRoomTeamProgressEvent {
  classId: string;
  slideId: string;
  runId: string;
  totalSalas: number;
  teamId: string;
  teamName: string;
  salaIndex: number;
  points: number;
  finished: boolean;
  rooms: EscapeRoomTeamRoomPublic[];
  members?: { studentId: string; studentName: string }[];
  outcome?: EscapeRoomAnswerOutcome | 'pista';
  studentId?: string;
  studentName?: string | null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function readTeamRoom(raw: unknown): EscapeRoomTeamRoomPublic | null {
  const o = asRecord(raw);
  if (!o || typeof o.salaId !== 'string') return null;
  return {
    salaId: o.salaId,
    salaIndex: typeof o.salaIndex === 'number' ? Math.floor(o.salaIndex) : 0,
    status: (typeof o.status === 'string' ? o.status : 'abierta') as EscapeRoomRoomStatus,
    intentos: typeof o.intentos === 'number' ? o.intentos : 0,
    pistasReveladas: typeof o.pistasReveladas === 'number' ? o.pistasReveladas : 0,
    points: typeof o.points === 'number' ? o.points : 0,
    solvedByStudentName:
      typeof o.solvedByStudentName === 'string' ? o.solvedByStudentName : null,
  };
}

function readTeam(raw: unknown): EscapeRoomTeamPublic | null {
  const o = asRecord(raw);
  if (!o || typeof o.id !== 'string' || typeof o.name !== 'string') return null;
  const membersRaw = Array.isArray(o.members) ? o.members : [];
  const roomsRaw = Array.isArray(o.rooms) ? o.rooms : [];
  return {
    id: o.id,
    name: o.name,
    salaIndex: typeof o.salaIndex === 'number' ? Math.floor(o.salaIndex) : 0,
    points: typeof o.points === 'number' ? o.points : 0,
    finished: o.finished === true,
    members: membersRaw
      .map((m) => {
        const row = asRecord(m);
        if (!row || typeof row.studentId !== 'string') return null;
        return {
          studentId: row.studentId,
          studentName:
            typeof row.studentName === 'string' ? row.studentName : row.studentId,
        };
      })
      .filter((m): m is { studentId: string; studentName: string } => m !== null),
    rooms: roomsRaw
      .map(readTeamRoom)
      .filter((r): r is EscapeRoomTeamRoomPublic => r !== null),
  };
}

export function parseEscapeRoomState(raw: unknown): EscapeRoomStatePublic | null {
  const o = asRecord(raw);
  if (!o || typeof o.runId !== 'string') return null;
  return {
    runId: o.runId,
    classId: typeof o.classId === 'string' ? o.classId : '',
    slideId: typeof o.slideId === 'string' ? o.slideId : '',
    sessionId: typeof o.sessionId === 'string' ? o.sessionId : '',
    status: typeof o.status === 'string' ? o.status : 'running',
    startedAtMs: typeof o.startedAtMs === 'number' ? o.startedAtMs : Date.now(),
    totalSalas: typeof o.totalSalas === 'number' ? o.totalSalas : 0,
    tiempoLimiteMinutos:
      typeof o.tiempoLimiteMinutos === 'number' ? o.tiempoLimiteMinutos : 0,
    mostrarRanking: o.mostrarRanking !== false,
    team: o.team != null ? readTeam(o.team) : null,
  };
}

export function parseEscapeRoomProgress(
  raw: unknown,
): EscapeRoomTeamProgressEvent | null {
  const o = asRecord(raw);
  if (!o || typeof o.teamId !== 'string') return null;
  const roomsRaw = Array.isArray(o.rooms) ? o.rooms : [];
  const membersRaw = Array.isArray(o.members) ? o.members : [];
  return {
    classId: typeof o.classId === 'string' ? o.classId : '',
    slideId: typeof o.slideId === 'string' ? o.slideId : '',
    runId: typeof o.runId === 'string' ? o.runId : '',
    totalSalas: typeof o.totalSalas === 'number' ? o.totalSalas : 0,
    teamId: o.teamId,
    teamName: typeof o.teamName === 'string' ? o.teamName : '',
    salaIndex: typeof o.salaIndex === 'number' ? Math.floor(o.salaIndex) : 0,
    points: typeof o.points === 'number' ? o.points : 0,
    finished: o.finished === true,
    rooms: roomsRaw
      .map(readTeamRoom)
      .filter((r): r is EscapeRoomTeamRoomPublic => r !== null),
    members: membersRaw
      .map((m) => {
        const row = asRecord(m);
        if (!row || typeof row.studentId !== 'string') return null;
        return {
          studentId: row.studentId,
          studentName:
            typeof row.studentName === 'string' ? row.studentName : row.studentId,
        };
      })
      .filter((m): m is { studentId: string; studentName: string } => m !== null),
    outcome:
      typeof o.outcome === 'string'
        ? (o.outcome as EscapeRoomAnswerOutcome | 'pista')
        : undefined,
    studentId: typeof o.studentId === 'string' ? o.studentId : undefined,
    studentName:
      o.studentName === null || typeof o.studentName === 'string'
        ? o.studentName
        : undefined,
  };
}

export function parseEscapeRoomRanking(raw: unknown): EscapeRoomRankingRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row, i) => {
      const o = asRecord(row);
      if (!o || typeof o.teamId !== 'string') return null;
      return {
        teamId: o.teamId,
        name: typeof o.name === 'string' && o.name.trim() ? o.name : `Equipo ${i + 1}`,
        points: typeof o.points === 'number' ? o.points : 0,
        finished: o.finished === true,
        salaIndex: typeof o.salaIndex === 'number' ? Math.floor(o.salaIndex) : 0,
        position: typeof o.position === 'number' ? Math.floor(o.position) : i + 1,
      };
    })
    .filter((r): r is EscapeRoomRankingRow => r !== null)
    .sort((a, b) => a.position - b.position);
}

export function parseEscapeRoomDashboard(
  raw: unknown,
): EscapeRoomDashboardPublic | null {
  const o = asRecord(raw);
  if (!o || typeof o.runId !== 'string') return null;
  const salasRaw = Array.isArray(o.salas) ? o.salas : [];
  const teamsRaw = Array.isArray(o.teams) ? o.teams : [];
  const salas = salasRaw
    .map((s, i) => {
      const row = asRecord(s);
      if (!row || typeof row.id !== 'string') return null;
      return {
        id: row.id,
        nombre: typeof row.nombre === 'string' && row.nombre.trim()
          ? row.nombre
          : `Sala ${i + 1}`,
      };
    })
    .filter((s): s is { id: string; nombre: string } => s !== null);
  return {
    runId: o.runId,
    totalSalas:
      typeof o.totalSalas === 'number' ? o.totalSalas : salas.length,
    salas,
    startedAtMs: typeof o.startedAtMs === 'number' ? o.startedAtMs : Date.now(),
    teams: teamsRaw
      .map(readTeam)
      .filter((t): t is EscapeRoomTeamPublic => t !== null),
  };
}

export function parseEscapeRoomStarted(raw: unknown): {
  classId: string;
  slideId: string;
  runId: string;
  startedAtMs: number;
} | null {
  const o = asRecord(raw);
  if (!o || typeof o.slideId !== 'string') return null;
  return {
    classId: typeof o.classId === 'string' ? o.classId : '',
    slideId: o.slideId,
    runId: typeof o.runId === 'string' ? o.runId : '',
    startedAtMs: typeof o.startedAtMs === 'number' ? o.startedAtMs : Date.now(),
  };
}
