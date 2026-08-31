import { describe, expect, it } from 'vitest';

import {
  historialFromTeam,
  tiempoRestanteLive,
} from '@/hooks/use-escape-room-session';
import {
  parseEscapeRoomProgress,
  parseEscapeRoomRanking,
  parseEscapeRoomState,
} from '@/lib/escape-room-live.types';

describe('escape-room-live.types', () => {
  it('parsea estado del servidor con equipo', () => {
    const state = parseEscapeRoomState({
      runId: 'run-1',
      classId: 'class-1',
      slideId: 'slide-1',
      sessionId: 'sess-1',
      status: 'running',
      startedAtMs: 1_000,
      totalSalas: 2,
      tiempoLimiteMinutos: 10,
      team: {
        id: 'team-1',
        name: 'Equipo 1',
        salaIndex: 1,
        points: 300,
        finished: false,
        members: [{ studentId: 's1', studentName: 'Ana' }],
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
    });

    expect(state?.team?.name).toBe('Equipo 1');
    expect(state?.team?.salaIndex).toBe(1);
  });

  it('parsea progreso con miembros del equipo', () => {
    const progress = parseEscapeRoomProgress({
      classId: 'class-1',
      slideId: 'slide-1',
      runId: 'run-1',
      teamId: 'team-1',
      teamName: 'Equipo 2',
      salaIndex: 0,
      points: 0,
      finished: false,
      members: [
        { studentId: 'a', studentName: 'A' },
        { studentId: 'b', studentName: 'B' },
      ],
      rooms: [],
    });

    expect(progress?.members).toHaveLength(2);
  });

  it('parsea el podio de cierre y lo ordena por posición', () => {
    const ranking = parseEscapeRoomRanking([
      { teamId: 'b', name: 'Equipo B', points: 300, finished: false, salaIndex: 1, position: 2 },
      { teamId: 'a', name: 'Equipo A', points: 900, finished: true, salaIndex: 2, position: 1 },
    ]);

    expect(ranking.map((r) => r.teamId)).toEqual(['a', 'b']);
    expect(ranking[0]?.finished).toBe(true);
  });

  it('descarta filas de podio sin equipo y tolera payload vacío', () => {
    expect(parseEscapeRoomRanking([{ name: 'sin id' }, null])).toEqual([]);
    expect(parseEscapeRoomRanking(undefined)).toEqual([]);
  });
});

describe('historialFromTeam', () => {
  it('ordena salas superadas y agotadas', () => {
    const historial = historialFromTeam(
      {
        id: 't1',
        name: 'Eq',
        salaIndex: 2,
        points: 450,
        finished: false,
        members: [],
        rooms: [
          {
            salaId: 's2',
            salaIndex: 1,
            status: 'superada',
            intentos: 2,
            pistasReveladas: 0,
            points: 150,
            solvedByStudentName: null,
          },
          {
            salaId: 's1',
            salaIndex: 0,
            status: 'agotada',
            intentos: 3,
            pistasReveladas: 1,
            points: 0,
            solvedByStudentName: null,
          },
        ],
      },
      [
        { id: 's1', nombre: 'Primera' },
        { id: 's2', nombre: 'Segunda' },
      ],
    );

    expect(historial.map((h) => h.salaId)).toEqual(['s1', 's2']);
    expect(historial[0]?.puntos).toBe(0);
    expect(historial[1]?.puntos).toBe(150);
  });
});

describe('tiempoRestanteLive', () => {
  it('calcula segundos restantes desde startedAtMs', () => {
    const started = Date.now() - 30_000;
    const rest = tiempoRestanteLive(started, 120);
    expect(rest).toBeGreaterThanOrEqual(89);
    expect(rest).toBeLessThanOrEqual(90);
  });

  it('devuelve null sin límite de tiempo', () => {
    expect(tiempoRestanteLive(Date.now(), 0)).toBeNull();
  });
});
