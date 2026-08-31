import { describe, expect, it } from 'vitest';

import {
  estadoDeCelda,
  formatTiempo,
  mergeTeamProgress,
} from '@/components/editor/panels/escape-room-live-dashboard';
import {
  parseEscapeRoomDashboard,
  type EscapeRoomDashboardPublic,
  type EscapeRoomTeamPublic,
} from '@/lib/escape-room-live.types';

function team(over: Partial<EscapeRoomTeamPublic> = {}): EscapeRoomTeamPublic {
  return {
    id: 'team-1',
    name: 'Equipo 1',
    salaIndex: 0,
    points: 0,
    finished: false,
    members: [{ studentId: 'a', studentName: 'Ana' }],
    rooms: [],
    ...over,
  };
}

function dashboard(over: Partial<EscapeRoomDashboardPublic> = {}): EscapeRoomDashboardPublic {
  return {
    runId: 'run-1',
    totalSalas: 2,
    salas: [
      { id: 'sala-1', nombre: 'Química' },
      { id: 'sala-2', nombre: 'Física' },
    ],
    startedAtMs: 1_000,
    teams: [team()],
    ...over,
  };
}

describe('parseEscapeRoomDashboard', () => {
  it('lee la matriz completa del servidor', () => {
    const parsed = parseEscapeRoomDashboard({
      runId: 'run-1',
      totalSalas: 2,
      salas: [
        { id: 'sala-1', nombre: 'Química' },
        { id: 'sala-2', nombre: '' },
      ],
      startedAtMs: 5_000,
      teams: [
        {
          id: 'team-1',
          name: 'Equipo 1',
          salaIndex: 1,
          points: 300,
          finished: false,
          members: [{ studentId: 'a', studentName: 'Ana' }],
          rooms: [
            {
              salaId: 'sala-1',
              salaIndex: 0,
              status: 'superada',
              intentos: 1,
              pistasReveladas: 0,
              points: 300,
              solvedByStudentName: 'Ana',
            },
          ],
        },
      ],
    });

    expect(parsed?.runId).toBe('run-1');
    expect(parsed?.salas[1]?.nombre).toBe('Sala 2');
    expect(parsed?.teams).toHaveLength(1);
    expect(parsed?.teams[0]?.rooms[0]?.status).toBe('superada');
  });

  it('sin partida devuelve null', () => {
    expect(parseEscapeRoomDashboard(null)).toBeNull();
    expect(parseEscapeRoomDashboard({ teams: [] })).toBeNull();
  });
});

describe('mergeTeamProgress', () => {
  const progressBase = {
    runId: 'run-1',
    teamId: 'team-1',
    teamName: 'Equipo 1',
    salaIndex: 1,
    points: 300,
    finished: false,
    rooms: [
      {
        salaId: 'sala-1',
        salaIndex: 0,
        status: 'superada' as const,
        intentos: 2,
        pistasReveladas: 1,
        points: 150,
        solvedByStudentName: 'Ana',
      },
    ],
  };

  it('actualiza solo la fila del equipo que se movió', () => {
    const base = dashboard({ teams: [team(), team({ id: 'team-2', name: 'Equipo 2' })] });

    const next = mergeTeamProgress(base, progressBase);

    expect(next.teams[0]?.salaIndex).toBe(1);
    expect(next.teams[0]?.points).toBe(300);
    expect(next.teams[1]).toBe(base.teams[1]);
  });

  it('conserva los miembros si el evento no los trae', () => {
    const next = mergeTeamProgress(dashboard(), progressBase);

    expect(next.teams[0]?.members).toEqual([{ studentId: 'a', studentName: 'Ana' }]);
  });

  it('añade el equipo si aún no estaba en la matriz', () => {
    const next = mergeTeamProgress(dashboard({ teams: [] }), {
      ...progressBase,
      teamId: 'team-9',
      teamName: 'Equipo 9',
      members: [{ studentId: 'z', studentName: 'Zoe' }],
    });

    expect(next.teams).toHaveLength(1);
    expect(next.teams[0]?.name).toBe('Equipo 9');
  });

  it('ignora eventos de otra partida', () => {
    const base = dashboard();

    expect(mergeTeamProgress(base, { ...progressBase, runId: 'run-otro' })).toBe(base);
  });
});

describe('estadoDeCelda', () => {
  it('marca en curso la sala en la que está el equipo', () => {
    expect(estadoDeCelda(team({ salaIndex: 0 }), 'sala-1', 0).status).toBe('en_curso');
  });

  it('las salas posteriores quedan sin empezar', () => {
    expect(estadoDeCelda(team({ salaIndex: 0 }), 'sala-2', 1).status).toBe('pendiente');
  });

  it('una sala resuelta manda sobre la posición del equipo', () => {
    const t = team({
      salaIndex: 0,
      rooms: [
        {
          salaId: 'sala-1',
          salaIndex: 0,
          status: 'superada',
          intentos: 1,
          pistasReveladas: 2,
          points: 300,
          solvedByStudentName: 'Ana',
        },
      ],
    });

    expect(estadoDeCelda(t, 'sala-1', 0)).toEqual({
      status: 'superada',
      intentos: 1,
      pistas: 2,
    });
  });

  it('un equipo que terminó no deja ninguna sala en curso', () => {
    expect(estadoDeCelda(team({ finished: true, salaIndex: 1 }), 'sala-2', 1).status).toBe(
      'pendiente',
    );
  });
});

describe('formatTiempo', () => {
  it('formatea mm:ss y nunca va en negativo', () => {
    expect(formatTiempo(0)).toBe('00:00');
    expect(formatTiempo(65_000)).toBe('01:05');
    expect(formatTiempo(-5_000)).toBe('00:00');
  });
});
