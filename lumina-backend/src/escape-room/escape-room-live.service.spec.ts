import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EscapeRoomLiveService, rankTeams } from './escape-room-live.service';
import { esCorrecta, pistasDeSala } from './escape-room-logic';

const CLASS_ID = 'class-er-1';
const SESSION_ID = 'session-er-1';
const SLIDE_ID = 'slide-er-1';

// ─── Fake de Prisma en memoria ───────────────────────────────────────────────
// Se prefiere a `jest.fn()` suelto porque estas pruebas verifican contratos de
// concurrencia: hacen falta constraints únicos reales y guardas de `updateMany`.

type Row = Record<string, unknown>;

interface TableSpec {
  defaults?: () => Row;
  unique?: string[][];
}

function asFilter(cond: unknown): { in?: unknown[]; lt?: number } | null {
  if (!cond || typeof cond !== 'object' || Array.isArray(cond)) return null;
  return cond as { in?: unknown[]; lt?: number };
}

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond === null) return value === null || value === undefined;
    const filter = asFilter(cond);
    if (filter) {
      if (Array.isArray(filter.in)) return filter.in.includes(value);
      if (typeof filter.lt === 'number') return Number(value) < filter.lt;
      return false;
    }
    return value === cond;
  });
}

function applyData(row: Row, data: Row): void {
  for (const [key, val] of Object.entries(data)) {
    const filter = asFilter(val);
    if (filter && 'increment' in filter) {
      const inc = Number((filter as { increment: number }).increment);
      row[key] = Number(row[key] ?? 0) + inc;
    } else {
      row[key] = val;
    }
  }
}

function createTable(name: string, spec: TableSpec = {}) {
  const rows: Row[] = [];
  let seq = 0;

  const assertUnique = (candidate: Row) => {
    for (const keys of spec.unique ?? []) {
      const clash = rows.some((r) => keys.every((k) => r[k] === candidate[k]));
      if (clash) {
        const err = new Error(
          `Unique constraint failed on ${name}(${keys.join(',')})`,
        ) as Error & { code?: string };
        err.code = 'P2002';
        throw err;
      }
    }
  };

  return {
    rows,
    findFirst: ({ where }: { where: Row }): Promise<Row | null> =>
      Promise.resolve(rows.find((r) => matches(r, where)) ?? null),
    findMany: ({ where }: { where?: Row } = {}): Promise<Row[]> =>
      Promise.resolve(rows.filter((r) => (where ? matches(r, where) : true))),
    create: ({ data }: { data: Row }): Promise<Row> => {
      seq += 1;
      const row: Row = {
        id: `${name}-${seq}`,
        createdAt: new Date(Date.now() + seq),
        ...(spec.defaults?.() ?? {}),
        ...data,
      };
      assertUnique(row);
      rows.push(row);
      return Promise.resolve({ ...row });
    },
    updateMany: ({
      where,
      data,
    }: {
      where: Row;
      data: Row;
    }): Promise<{ count: number }> => {
      const target = rows.filter((r) => matches(r, where));
      for (const row of target) applyData(row, data);
      return Promise.resolve({ count: target.length });
    },
  };
}

function salasFixture() {
  return [
    {
      id: 'sala-1',
      nombre: 'Primera',
      respuestaCorrecta: 'llave',
      ignorarMayusculas: true,
      intentosMaximos: 3,
      pistas: ['Pista A', 'Pista B'],
    },
    {
      id: 'sala-2',
      nombre: 'Segunda',
      respuestaCorrecta: 'CODIGO',
      ignorarMayusculas: false,
      intentosMaximos: 1,
      pista: 'Pista legada',
    },
  ];
}

function slideContent(salas: unknown[] = salasFixture(), extra: Row = {}) {
  return {
    bloques: [
      {
        tipo: 'actividad',
        actividad: {
          tipo: 'escape_room',
          titulo: 'Misión',
          puntosBase: 300,
          tiempoLimiteMinutos: 10,
          salas,
          ...extra,
        },
      },
    ],
  };
}

function createPrismaMock(content: unknown) {
  const escapeRoomRun = createTable('run', {
    defaults: () => ({
      status: 'running',
      startedAt: new Date(),
      endedAt: null,
    }),
    unique: [['sessionId', 'slideId']],
  });
  const escapeRoomTeam = createTable('team', {
    defaults: () => ({ salaIndex: 0, points: 0, finishedAt: null }),
    unique: [['runId', 'name']],
  });
  const escapeRoomTeamMember = createTable('member', {
    unique: [['runId', 'studentId']],
  });
  const escapeRoomTeamRoom = createTable('room', {
    defaults: () => ({
      status: 'abierta',
      intentos: 0,
      pistasReveladas: 0,
      points: 0,
      solvedByStudentId: null,
      solvedByStudentName: null,
    }),
    unique: [['teamId', 'salaId']],
  });

  return {
    slide: { findFirst: jest.fn().mockResolvedValue({ content }) },
    classSession: {
      findFirst: jest.fn().mockResolvedValue({ id: SESSION_ID }),
    },
    escapeRoomRun,
    escapeRoomTeam,
    escapeRoomTeamMember,
    escapeRoomTeamRoom,
  };
}

async function buildService(content: unknown = slideContent()) {
  const prisma = createPrismaMock(content);
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EscapeRoomLiveService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return { service: module.get(EscapeRoomLiveService), prisma };
}

const base = { classId: CLASS_ID, slideId: SLIDE_ID };

describe('EscapeRoomLiveService — motor de equipos', () => {
  describe('apertura de partida y reparto', () => {
    it('crea la partida con los equipos pedidos y reabrir es idempotente', async () => {
      const { service, prisma } = await buildService();

      const first = await service.initRun({ ...base, teamCount: 3 });
      expect(first.created).toBe(true);
      expect(prisma.escapeRoomTeam.rows).toHaveLength(3);

      const second = await service.initRun({ ...base, teamCount: 3 });
      expect(second.created).toBe(false);
      expect(second.runId).toBe(first.runId);
      expect(prisma.escapeRoomRun.rows).toHaveLength(1);
      expect(prisma.escapeRoomTeam.rows).toHaveLength(3);
    });

    it('reparte automáticamente en los equipos con menos miembros', async () => {
      const { service, prisma } = await buildService();
      await service.initRun({ ...base, teamCount: 2 });

      for (const n of [1, 2, 3, 4]) {
        await service.joinTeam({
          ...base,
          studentId: `alu-${n}`,
          studentName: `Alu ${n}`,
        });
      }

      const porEquipo = new Map<string, number>();
      for (const m of prisma.escapeRoomTeamMember.rows) {
        const teamId = m.teamId as string;
        porEquipo.set(teamId, (porEquipo.get(teamId) ?? 0) + 1);
      }
      expect([...porEquipo.values()].sort()).toEqual([2, 2]);
    });

    it('un estudiante pertenece a un solo equipo por partida', async () => {
      const { service, prisma } = await buildService();
      await service.initRun({ ...base, teamCount: 2 });

      const primero = await service.joinTeam({ ...base, studentId: 'alu-1' });
      const repetido = await service.joinTeam({
        ...base,
        studentId: 'alu-1',
        teamName: 'Equipo 2',
      });

      expect(repetido.team?.id).toBe(primero.team?.id);
      expect(prisma.escapeRoomTeamMember.rows).toHaveLength(1);
    });

    it('acepta invitados: `studentId` sin usuario en BD', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });

      const state = await service.joinTeam({
        ...base,
        studentId: 'guest-abc123',
        studentName: 'Invitado',
      });

      expect(state.team?.members).toEqual([
        { studentId: 'guest-abc123', studentName: 'Invitado' },
      ]);
    });

    it('el estudiante no puede jugar si el docente no abrió la partida', async () => {
      const { service } = await buildService();
      await expect(
        service.joinTeam({ ...base, studentId: 'alu-1' }),
      ).rejects.toThrow(/no ha abierto/i);
    });
  });

  describe('respuesta validada en servidor', () => {
    it('acepta la respuesta correcta, puntúa por intento y avanza al equipo', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
      });

      const res = await service.answer({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
        salaId: 'sala-1',
        answer: '  LLAVE ',
      });

      expect(res.outcome).toBe('correcto');
      expect(res.puntos).toBe(300);
      expect(res.state.team?.salaIndex).toBe(1);
      expect(res.state.team?.points).toBe(300);
    });

    it('ignora lo que el cliente crea: una respuesta falsa no desbloquea', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      const res = await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'cualquier cosa',
      });

      expect(res.outcome).toBe('incorrecto');
      expect(res.puntos).toBe(0);
      expect(res.state.team?.salaIndex).toBe(0);
      expect(res.state.team?.points).toBe(0);
    });

    it('respeta `ignorarMayusculas: false` de la sala', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });
      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });

      const minusculas = await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-2',
        answer: 'codigo',
      });
      expect(minusculas.outcome).toBe('bloqueada');
    });

    it('descuenta puntos por intento igual que el reproductor 1.0', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'no',
      });
      const segundo = await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });

      expect(segundo.outcome).toBe('correcto');
      expect(segundo.puntos).toBe(150);
    });

    it('agotar intentos bloquea la sala con 0 puntos y avanza (D2)', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'a',
      });
      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'b',
      });
      const tercero = await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'c',
      });

      expect(tercero.outcome).toBe('bloqueada');
      expect(tercero.state.team?.salaIndex).toBe(1);
      expect(tercero.state.team?.points).toBe(0);
      const sala1 = tercero.state.team?.rooms.find(
        (r) => r.salaId === 'sala-1',
      );
      expect(sala1?.status).toBe('agotada');
    });

    it('con `intentosMaximos: -1` la sala nunca se bloquea', async () => {
      const salas = salasFixture();
      salas[0].intentosMaximos = -1;
      const { service } = await buildService(slideContent(salas));
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      for (let i = 0; i < 5; i += 1) {
        const res = await service.answer({
          ...base,
          studentId: 'alu-1',
          salaId: 'sala-1',
          answer: `fallo-${i}`,
        });
        expect(res.outcome).toBe('incorrecto');
      }
    });

    it('responder a una sala que no es la activa no tiene efectos', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      const res = await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-2',
        answer: 'CODIGO',
      });

      expect(res.outcome).toBe('sala_no_activa');
      expect(res.state.team?.salaIndex).toBe(0);
      expect(res.state.team?.points).toBe(0);
    });

    it('un estudiante sin equipo no puede responder', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });

      await expect(
        service.answer({
          ...base,
          studentId: 'colado',
          salaId: 'sala-1',
          answer: 'llave',
        }),
      ).rejects.toThrow(/equipo/i);
    });
  });

  describe('carrera entre miembros del mismo equipo', () => {
    it('dos aciertos simultáneos avanzan una sola sala y puntúan una vez', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamNames: ['Equipo 1'] });
      await service.joinTeam({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
      });
      await service.joinTeam({
        ...base,
        studentId: 'alu-2',
        studentName: 'Alu 2',
      });

      const [a, b] = await Promise.all([
        service.answer({
          ...base,
          studentId: 'alu-1',
          studentName: 'Alu 1',
          salaId: 'sala-1',
          answer: 'llave',
        }),
        service.answer({
          ...base,
          studentId: 'alu-2',
          studentName: 'Alu 2',
          salaId: 'sala-1',
          answer: 'llave',
        }),
      ]);

      const resultados = [a.outcome, b.outcome].sort();
      expect(resultados).toEqual(['correcto', 'ya_resuelta']);

      const estado = await service.getStateForStudent({
        ...base,
        studentId: 'alu-1',
      });
      expect(estado?.team?.salaIndex).toBe(1);
      expect(estado?.team?.points).toBe(300);
    });

    it('el segundo acierto secuencial no vuelve a abrir la sala', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamNames: ['Equipo 1'] });
      await service.joinTeam({ ...base, studentId: 'alu-1' });
      await service.joinTeam({ ...base, studentId: 'alu-2' });

      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });
      const tarde = await service.answer({
        ...base,
        studentId: 'alu-2',
        salaId: 'sala-1',
        answer: 'llave',
      });

      expect(tarde.outcome).toBe('sala_no_activa');
      expect(tarde.state.team?.salaIndex).toBe(1);
      expect(tarde.state.team?.points).toBe(300);
    });

    it('el progreso es del equipo: lo que resuelve uno lo ve el otro', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamNames: ['Equipo 1'] });
      await service.joinTeam({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
      });
      await service.joinTeam({
        ...base,
        studentId: 'alu-2',
        studentName: 'Alu 2',
      });

      await service.answer({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
        salaId: 'sala-1',
        answer: 'llave',
      });

      const visto = await service.getStateForStudent({
        ...base,
        studentId: 'alu-2',
      });
      expect(visto?.team?.salaIndex).toBe(1);
      const sala1 = visto?.team?.rooms.find((r) => r.salaId === 'sala-1');
      expect(sala1?.status).toBe('superada');
      expect(sala1?.solvedByStudentName).toBe('Alu 1');
    });
  });

  describe('pistas (D3: sin penalización)', () => {
    it('revela una pista más en cada petición y no toca los puntos', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      const primera = await service.requestHint({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
      });
      expect(primera.pistas).toEqual(['Pista A']);
      expect(primera.total).toBe(2);

      const segunda = await service.requestHint({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
      });
      expect(segunda.pistas).toEqual(['Pista A', 'Pista B']);

      const tercera = await service.requestHint({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
      });
      expect(tercera.pistas).toEqual(['Pista A', 'Pista B']);
      expect(tercera.reveladas).toBe(2);

      const acierto = await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });
      expect(acierto.puntos).toBe(300);
    });

    it('las pistas reveladas son compartidas por el equipo', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamNames: ['Equipo 1'] });
      await service.joinTeam({ ...base, studentId: 'alu-1' });
      await service.joinTeam({ ...base, studentId: 'alu-2' });

      await service.requestHint({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
      });
      const desdeOtro = await service.requestHint({
        ...base,
        studentId: 'alu-2',
        salaId: 'sala-1',
      });

      expect(desdeOtro.reveladas).toBe(2);
    });
  });

  describe('reconexión y panel docente', () => {
    it('rehidrata equipo, sala e intentos tras recargar', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamNames: ['Equipo 1'] });
      await service.joinTeam({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
      });
      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'fallo',
      });

      const state = await service.getStateForStudent({
        ...base,
        studentId: 'alu-1',
      });

      expect(state?.team?.name).toBe('Equipo 1');
      expect(state?.team?.salaIndex).toBe(0);
      expect(state?.totalSalas).toBe(2);
      const sala1 = state?.team?.rooms.find((r) => r.salaId === 'sala-1');
      expect(sala1?.intentos).toBe(1);
      expect(sala1?.status).toBe('abierta');
    });

    it('volver a entrar al equipo no reinicia el progreso', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamNames: ['Equipo 1'] });
      await service.joinTeam({ ...base, studentId: 'alu-1' });
      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });

      const rejoin = await service.joinTeam({ ...base, studentId: 'alu-1' });
      expect(rejoin.team?.salaIndex).toBe(1);
      expect(rejoin.team?.points).toBe(300);
    });

    it('el dashboard expone la matriz de equipos y salas', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 2 });
      await service.joinTeam({
        ...base,
        studentId: 'alu-1',
        studentName: 'Alu 1',
      });
      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });

      const dashboard = await service.getDashboard(base);

      expect(dashboard?.salas.map((s) => s.id)).toEqual(['sala-1', 'sala-2']);
      expect(dashboard?.teams).toHaveLength(2);
      const conProgreso = dashboard?.teams.find((t) => t.points === 300);
      expect(conProgreso?.salaIndex).toBe(1);
    });

    it('sin partida abierta el estado es null en lugar de error', async () => {
      const { service } = await buildService();
      await expect(
        service.getStateForStudent({ ...base, studentId: 'alu-1' }),
      ).resolves.toBeNull();
    });
  });

  describe('cierre y podio', () => {
    /** Resuelve las dos salas del fixture con el equipo del estudiante dado. */
    async function terminar(
      service: EscapeRoomLiveService,
      studentId: string,
    ) {
      await service.answer({
        ...base,
        studentId,
        salaId: 'sala-1',
        answer: 'llave',
      });
      return service.answer({
        ...base,
        studentId,
        salaId: 'sala-2',
        answer: 'CODIGO',
      });
    }

    it('resolver la última sala marca al equipo como terminado', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      const res = await terminar(service, 'alu-1');

      expect(res.outcome).toBe('correcto');
      expect(res.state.team?.finished).toBe(true);
    });

    it('no revela el podio mientras el equipo sigue jugando', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 2 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });

      await service.answer({
        ...base,
        studentId: 'alu-1',
        salaId: 'sala-1',
        answer: 'llave',
      });

      await expect(
        service.getRankingForStudent({ ...base, studentId: 'alu-1' }),
      ).resolves.toEqual([]);
    });

    it('al terminar devuelve el podio con todos los equipos y su posición', async () => {
      const { service } = await buildService();
      await service.initRun({ ...base, teamCount: 2 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });
      await service.joinTeam({ ...base, studentId: 'alu-2' });

      await terminar(service, 'alu-1');

      const ranking = await service.getRankingForStudent({
        ...base,
        studentId: 'alu-1',
      });

      expect(ranking).toHaveLength(2);
      expect(ranking[0].position).toBe(1);
      expect(ranking[0].finished).toBe(true);
      expect(ranking[0].points).toBeGreaterThan(0);
      expect(ranking[1].position).toBe(2);
      expect(ranking[1].finished).toBe(false);
    });

    it('respeta `mostrarRanking: false` del autor', async () => {
      const { service } = await buildService(
        slideContent(salasFixture(), { mostrarRanking: false }),
      );
      await service.initRun({ ...base, teamCount: 1 });
      await service.joinTeam({ ...base, studentId: 'alu-1' });
      await terminar(service, 'alu-1');

      await expect(
        service.getRankingForStudent({ ...base, studentId: 'alu-1' }),
      ).resolves.toEqual([]);
    });

    it('ordena terminados primero y luego por puntos', () => {
      const teams = [
        { id: 'c', name: 'C', points: 500, salaIndex: 1, finished: false },
        { id: 'a', name: 'A', points: 100, salaIndex: 2, finished: true },
        { id: 'b', name: 'B', points: 900, salaIndex: 2, finished: true },
      ].map((t) => ({ ...t, members: [], rooms: [] }));

      expect(rankTeams(teams).map((r) => r.name)).toEqual(['B', 'A', 'C']);
    });
  });

  describe('validación del contenido de autoría', () => {
    it('rechaza un slide sin Escape Room', async () => {
      const { service } = await buildService({ bloques: [{ tipo: 'texto' }] });
      await expect(service.initRun({ ...base, teamCount: 1 })).rejects.toThrow(
        /no tiene un Escape Room/i,
      );
    });

    it('rechaza un Escape Room sin salas', async () => {
      const { service } = await buildService(slideContent([]));
      await expect(service.initRun({ ...base, teamCount: 1 })).rejects.toThrow(
        /sin salas|no tiene salas/i,
      );
    });
  });
});

describe('escape-room-logic — espejo de las reglas del reproductor', () => {
  const sala = {
    respuestaCorrecta: 'Llave',
    ignorarMayusculas: true,
  };

  it('compara sin distinguir mayúsculas cuando la sala lo pide', () => {
    expect(esCorrecta(sala, ' llave ')).toBe(true);
    expect(esCorrecta({ ...sala, ignorarMayusculas: false }, 'llave')).toBe(
      false,
    );
  });

  it('una respuesta vacía nunca es correcta', () => {
    expect(esCorrecta({ ...sala, respuestaCorrecta: '' }, '   ')).toBe(false);
  });

  it('lee el formato legado `pista` como lista de una sola pista', () => {
    expect(pistasDeSala({ ...sala, pista: 'única' })).toEqual(['única']);
    expect(pistasDeSala({ ...sala, pistas: ['a', '', 'b'] })).toEqual([
      'a',
      'b',
    ]);
  });
});
