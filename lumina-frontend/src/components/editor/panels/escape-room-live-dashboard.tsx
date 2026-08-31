'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { DoorOpen, Play, RefreshCw, Users } from 'lucide-react';

import {
  parseEscapeRoomDashboard,
  parseEscapeRoomProgress,
  type EscapeRoomDashboardPublic,
  type EscapeRoomRoomStatus,
  type EscapeRoomTeamPublic,
} from '@/lib/escape-room-live.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { EscapeRoomActivity } from '@/types/slide.types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EscapeRoomLiveDashboardProps {
  classId: string;
  slideId: string;
  activity: EscapeRoomActivity;
  /** Socket del namespace `/live` (el mismo que usa `TorneoPanel`). */
  socket: Socket;
}

const MIN_TEAMS = 2;
const MAX_TEAMS = 12;

// ─── Helpers puros (exportados para test) ─────────────────────────────────────

/**
 * Aplica un evento `team-progress` / `room-unlocked` / `team-assigned` sobre la
 * matriz. Solo reemplaza la fila del equipo afectado: el resto no se toca, y un
 * equipo desconocido (recién creado) se añade al final.
 */
export function mergeTeamProgress(
  dashboard: EscapeRoomDashboardPublic,
  progress: {
    runId: string;
    teamId: string;
    teamName: string;
    salaIndex: number;
    points: number;
    finished: boolean;
    rooms: EscapeRoomTeamPublic['rooms'];
    members?: EscapeRoomTeamPublic['members'];
  },
): EscapeRoomDashboardPublic {
  if (progress.runId && progress.runId !== dashboard.runId) return dashboard;

  const existente = dashboard.teams.find((t) => t.id === progress.teamId);
  const actualizado: EscapeRoomTeamPublic = {
    id: progress.teamId,
    name: progress.teamName || existente?.name || 'Equipo',
    salaIndex: progress.salaIndex,
    points: progress.points,
    finished: progress.finished,
    members: progress.members ?? existente?.members ?? [],
    rooms: progress.rooms,
  };

  return {
    ...dashboard,
    teams: existente
      ? dashboard.teams.map((t) => (t.id === progress.teamId ? actualizado : t))
      : [...dashboard.teams, actualizado],
  };
}

/** Celda de la matriz para un equipo y una sala concreta. */
export function estadoDeCelda(
  team: EscapeRoomTeamPublic,
  salaId: string,
  salaIndex: number,
): {
  status: EscapeRoomRoomStatus | 'pendiente' | 'en_curso';
  intentos: number;
  pistas: number;
} {
  const room = team.rooms.find((r) => r.salaId === salaId);
  if (room && room.status !== 'abierta') {
    return { status: room.status, intentos: room.intentos, pistas: room.pistasReveladas };
  }
  const intentos = room?.intentos ?? 0;
  const pistas = room?.pistasReveladas ?? 0;
  if (team.salaIndex === salaIndex && !team.finished) {
    return { status: 'en_curso', intentos, pistas };
  }
  return { status: room ? 'abierta' : 'pendiente', intentos, pistas };
}

const CELDA_META: Record<
  ReturnType<typeof estadoDeCelda>['status'],
  { simbolo: string; texto: string; clase: string }
> = {
  superada: { simbolo: '✓', texto: 'Superada', clase: 'bg-emerald-50 text-emerald-700' },
  agotada: { simbolo: '✕', texto: 'Intentos agotados', clase: 'bg-red-50 text-red-700' },
  en_curso: { simbolo: '▶', texto: 'En curso', clase: 'bg-blue-50 text-[#2563EB]' },
  abierta: { simbolo: '·', texto: 'Abierta', clase: 'bg-[#f9fafb] text-[#6b7280]' },
  pendiente: { simbolo: '–', texto: 'Sin empezar', clase: 'bg-[#f9fafb] text-[#9ca3af]' },
};

export function formatTiempo(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * Los handlers de `/live` lanzan `WsException` en vez de contestar el ack, así
 * que sin timeout una petición fallida dejaría el panel colgado en "cargando".
 * `null` = el servidor no respondió (el detalle llega por el evento `exception`).
 */
function emitAck<T>(
  socket: Socket,
  event: string,
  payload: Record<string, unknown>,
  timeoutMs = 8000,
): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    socket.emit(event, payload, (ack: T) => finish(ack));
  });
}

function mensajeDeExcepcion(payload: unknown): string | null {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as { message?: unknown; error?: unknown };
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string') return o.error;
  }
  return null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EscapeRoomLiveDashboard({
  classId,
  slideId,
  activity,
  socket,
}: EscapeRoomLiveDashboardProps) {
  const [dashboard, setDashboard] = useState<EscapeRoomDashboardPublic | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [numEquipos, setNumEquipos] = useState(MIN_TEAMS);
  const [ahora, setAhora] = useState(() => Date.now());

  const runIdRef = useRef<string | null>(null);
  runIdRef.current = dashboard?.runId ?? null;

  const refrescar = useCallback(async () => {
    setError(null);
    const ack = await emitAck<{ ok?: boolean; dashboard?: unknown; error?: string }>(
      socket,
      'escape-room:dashboard',
      { classId, slideId },
    );
    setCargando(false);
    if (!ack || ack.ok === false) {
      // Si el gateway ya mandó un `exception` con el motivo, no lo pisamos.
      setError((prev) => prev ?? ack?.error ?? 'No se pudo leer el estado de la partida');
      return;
    }
    setError(null);
    setDashboard(parseEscapeRoomDashboard(ack.dashboard));
  }, [socket, classId, slideId]);

  useEffect(() => {
    setCargando(true);
    setDashboard(null);
    void refrescar();
  }, [refrescar]);

  // Los eventos de equipo llegan del `ClassesGateway` con broadcast dual, así que
  // el socket `/live` del docente los recibe sin suscribirse a nada extra.
  useEffect(() => {
    function onProgress(payload: unknown) {
      const progress = parseEscapeRoomProgress(payload);
      if (!progress || progress.slideId !== slideId) return;
      setDashboard((prev) => {
        if (!prev) return prev;
        return mergeTeamProgress(prev, progress);
      });
    }

    function onStarted(payload: unknown) {
      const p = payload as { slideId?: unknown } | null;
      if (p && typeof p.slideId === 'string' && p.slideId !== slideId) return;
      void refrescar();
    }

    function onException(payload: unknown) {
      const msg = mensajeDeExcepcion(payload);
      if (msg) setError(msg);
      setCargando(false);
      setIniciando(false);
    }

    socket.on('escape-room:team-progress', onProgress);
    socket.on('escape-room:room-unlocked', onProgress);
    socket.on('escape-room:finished', onProgress);
    socket.on('escape-room:team-assigned', onProgress);
    socket.on('escape-room:started', onStarted);
    socket.on('exception', onException);

    return () => {
      socket.off('escape-room:team-progress', onProgress);
      socket.off('escape-room:room-unlocked', onProgress);
      socket.off('escape-room:finished', onProgress);
      socket.off('escape-room:team-assigned', onProgress);
      socket.off('escape-room:started', onStarted);
      socket.off('exception', onException);
    };
  }, [socket, slideId, refrescar]);

  // Reloj del servidor: se ancla en `startedAtMs`, solo se re-renderiza el tick.
  const enCurso = !!dashboard && dashboard.teams.some((t) => !t.finished);
  const ganador = dashboard?.teams.length
    ? [...dashboard.teams].sort((a, b) => b.points - a.points)[0]
    : null;
  useEffect(() => {
    if (!enCurso) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enCurso]);

  const iniciar = useCallback(async () => {
    setIniciando(true);
    setError(null);
    const ack = await emitAck<{ ok?: boolean; error?: string }>(
      socket,
      'escape-room:init',
      { classId, slideId, teamCount: numEquipos },
    );
    setIniciando(false);
    if (!ack || ack.ok === false) {
      setError((prev) => prev ?? ack?.error ?? 'No se pudo abrir la partida');
      return;
    }
    setError(null);
    await refrescar();
  }, [socket, classId, slideId, numEquipos, refrescar]);

  // ── Sin partida abierta ────────────────────────────────────────────────────

  if (cargando) {
    return <p className="p-4 text-xs text-[#9ca3af]">Cargando partida…</p>;
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <DoorOpen className="size-5 text-[#2563EB]" aria-hidden />
          <span className="text-sm font-semibold text-[#111827]">Escape Room</span>
        </div>
        <p className="text-xs text-[#6b7280]">
          {activity.salas.length} sala{activity.salas.length !== 1 ? 's' : ''}. Abre la partida para
          que los estudiantes se repartan en equipos.
        </p>
        <div className="space-y-1">
          <Label className="text-[11px]" htmlFor="er-num-equipos">
            Número de equipos
          </Label>
          <Input
            id="er-num-equipos"
            type="number"
            min={MIN_TEAMS}
            max={MAX_TEAMS}
            step={1}
            value={String(numEquipos)}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= MIN_TEAMS && v <= MAX_TEAMS) {
                setNumEquipos(Math.floor(v));
              }
            }}
            className="h-8 w-20 text-xs"
          />
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        <Button
          type="button"
          disabled={iniciando}
          className="h-9 w-full gap-2 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          onClick={() => void iniciar()}
        >
          <Play className="size-4" aria-hidden />
          {iniciando ? 'Abriendo…' : 'Abrir partida'}
        </Button>
      </div>
    );
  }

  // ── Matriz equipos × salas ─────────────────────────────────────────────────

  const salas = dashboard.salas.length
    ? dashboard.salas
    : activity.salas.map((s) => ({ id: s.id, nombre: s.nombre }));
  const transcurrido = formatTiempo(ahora - dashboard.startedAtMs);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#2563EB]" />
          </span>
          <span className="text-xs font-semibold text-[#2563EB]">En vivo</span>
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-[#6b7280]">
          {transcurrido}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Actualizar matriz"
          onClick={() => void refrescar()}
        >
          <RefreshCw className="size-3.5" aria-hidden />
        </Button>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {dashboard.teams.length === 0 ? (
        <p className="text-xs text-[#9ca3af]">
          Partida abierta. Todavía no hay estudiantes en equipos.
        </p>
      ) : (
        <>
          {!enCurso && ganador && (
            <p className="rounded-md bg-[#dbeafe] px-2 py-1.5 text-[11px] font-medium text-[#1d4ed8]">
              Partida terminada · Gana {ganador.name} con {ganador.points} pts
            </p>
          )}

          <div className="overflow-x-auto rounded-md border border-[#e5e7eb]">
            <table className="w-full text-xs">
              <caption className="sr-only">
                Progreso de cada equipo en cada sala del Escape Room
              </caption>
              <thead>
                <tr className="bg-[#F5F5F7]">
                  <th
                    scope="col"
                    className="py-1.5 pl-2 text-left text-[10px] font-medium uppercase text-[#6b7280]"
                  >
                    Equipo
                  </th>
                  {salas.map((sala, i) => (
                    <th
                      key={sala.id}
                      scope="col"
                      title={sala.nombre}
                      className="px-1 py-1.5 text-center text-[10px] font-medium uppercase text-[#6b7280]"
                    >
                      S{i + 1}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="py-1.5 pr-2 text-right text-[10px] font-medium uppercase text-[#6b7280]"
                  >
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboard.teams.map((team) => (
                  <tr key={team.id} className="border-t border-[#e5e7eb]">
                    <th
                      scope="row"
                      className="max-w-[80px] truncate py-1.5 pl-2 text-left font-medium text-[#111827]"
                    >
                      {team.name}
                      <span className="block text-[9px] font-normal text-[#9ca3af]">
                        {team.finished
                          ? 'Terminado'
                          : `Sala ${Math.min(team.salaIndex + 1, salas.length)}/${salas.length}`}
                      </span>
                    </th>
                    {salas.map((sala, i) => {
                      const celda = estadoDeCelda(team, sala.id, i);
                      const meta = CELDA_META[celda.status];
                      const detalle = `${team.name} · ${sala.nombre}: ${meta.texto}, ${celda.intentos} intento${celda.intentos !== 1 ? 's' : ''}, ${celda.pistas} pista${celda.pistas !== 1 ? 's' : ''}`;
                      return (
                        <td key={sala.id} className="px-1 py-1.5 text-center">
                          <span
                            title={detalle}
                            aria-label={detalle}
                            className={cn(
                              'inline-flex min-w-[26px] flex-col items-center rounded px-1 py-0.5 font-semibold leading-tight',
                              meta.clase,
                            )}
                          >
                            <span aria-hidden>{meta.simbolo}</span>
                            <span className="text-[9px] font-normal tabular-nums" aria-hidden>
                              {celda.intentos}
                              {celda.pistas > 0 ? `·${celda.pistas}p` : ''}
                            </span>
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-1.5 pr-2 text-right font-semibold tabular-nums text-[#111827]">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-1">
            {dashboard.teams.map((team) => (
              <li key={team.id} className="flex items-start gap-1.5 text-[10px] text-[#6b7280]">
                <Users className="mt-0.5 size-3 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium text-[#374151]">{team.name}:</span>{' '}
                  {team.members.length > 0
                    ? team.members.map((m) => m.studentName).join(', ')
                    : 'sin integrantes'}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-[10px] leading-snug text-[#9ca3af]">
            ✓ superada · ▶ en curso · ✕ intentos agotados · – sin empezar. Bajo cada símbolo,
            intentos y pistas usadas.
          </p>
        </>
      )}
    </div>
  );
}
