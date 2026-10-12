/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- transitorio: se corre con la config del kit (jsdom + RTL); el frontend no los tiene. Se mueve al kit en la migración.
/**
 * U11.3b — caracterización del viewer de `escape_room` ANTES de migrarlo al kit (Regla 7).
 *
 * Fija lo que el alumno VE y lo que el viewer EMITE hoy, en modo local (previsualización, sin socket)
 * y en modo equipos (socket falso: `escape-room:{state,join-team,answer,hint-request,ranking}` y los
 * eventos de progreso del servidor). Al migrar, este archivo se mueve al kit y solo cambian los
 * imports: las aserciones son las mismas.
 *
 * Relojes falsos con `toFake` explícito (incluido `Date`: el viewer mide el tiempo con él).
 *
 * DEFECTO PREVIO descubierto al escribir esto: con un EQUIPO ya asignado (modo equipos), el viewer
 * viejo entra en un bucle de renderizado infinito — `normalizeEscapeRoomActivity(activity)` crea un
 * `salas` nuevo en cada render, el efecto de sincronía depende de `salas` y llama a
 * `setHistorial(array nuevo)`. Por eso las pruebas de equipo con equipo asignado SOLO terminan si el
 * viejo se parcha con `useMemo(() => normalize(activity), [activity])` (las 29 pasaron con ese único
 * cambio; sin él, esas 14 se cuelgan). El resto (modo local y modo equipos sin equipo) pasa contra el
 * viejo tal cual. La migración aplica esa memoización a propósito y se anota en la ficha.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EscapeRoomActivity } from '@lumina/types/slide';

const sonido = vi.hoisted(() => vi.fn());
vi.mock('@lumina/editor-shared/use-sound', () => ({ useSound: () => ({ play: sonido }) }));

import { EscapeRoomViewer } from './escape-room-viewer';

const T0 = new Date('2026-01-01T10:00:00Z').getTime();

beforeEach(() => {
  sonido.mockClear();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(T0);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const flush = () => act(async () => {});

const actividad = (extra: Partial<EscapeRoomActivity> = {}): EscapeRoomActivity => ({
  tipo: 'escape_room',
  titulo: 'Laboratorio',
  introduccion: 'Escapa del laboratorio',
  salas: [
    {
      id: 'sala-1',
      nombre: 'Sala del agua',
      descripcion: 'Una sala húmeda',
      desafio: '¿Fórmula del agua?',
      tipoRespuesta: 'texto',
      respuestaCorrecta: 'H2O',
      ignorarMayusculas: true,
      intentosMaximos: 2,
      pistas: ['Dos hidrógenos'],
    },
    {
      id: 'sala-2',
      nombre: 'Sala de la sal',
      descripcion: '',
      desafio: '¿Qué elemento es el cloro?',
      tipoRespuesta: 'opcion_multiple',
      opciones: ['Sodio', 'Cloro'],
      respuestaCorrecta: 'Cloro',
      ignorarMayusculas: true,
      intentosMaximos: 3,
    },
  ],
  tiempoLimiteMinutos: 1,
  mostrarRanking: true,
  puntosBase: 300,
  ...extra,
});

function montarLocal(extra: Partial<EscapeRoomActivity> = {}, props: Record<string, unknown> = {}) {
  const onComplete = vi.fn();
  const onAnswer = vi.fn();
  const onExit = vi.fn();
  const r = render(
    <EscapeRoomViewer
      activity={actividad(extra)}
      studentId="s1"
      studentName="Ana"
      classId="cls"
      slideId="sl1"
      editorSyncKey="a"
      onComplete={onComplete}
      onAnswer={onAnswer}
      onExit={onExit}
      {...props}
    />,
  );
  return { onComplete, onAnswer, onExit, ...r };
}

const escribir = (v: string) => fireEvent.change(screen.getByPlaceholderText('Tu respuesta…'), { target: { value: v } });
const confirmar = () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
const comenzar = () => fireEvent.click(screen.getByRole('button', { name: '▶ Comenzar' }));

describe('Escape room — modo local (sin socket)', () => {
  it('intro: título, narrativa, número de salas, tiempo y nombre del alumno', () => {
    montarLocal();
    expect(screen.getByText('Laboratorio')).toBeTruthy();
    expect(screen.getByText('Escapa del laboratorio')).toBeTruthy();
    expect(screen.getByText('2 salas')).toBeTruthy();
    expect(screen.getByText('1 min')).toBeTruthy();
    expect(screen.queryByText('Modo equipos')).toBeNull();
    expect(screen.getByText('Ana')).toBeTruthy();
  });

  it('sin tiempo límite no muestra la etiqueta de tiempo ni el reloj', () => {
    montarLocal({ tiempoLimiteMinutos: undefined });
    expect(screen.queryByText(/ min$/)).toBeNull();
    comenzar();
    expect(screen.queryByText('01:00')).toBeNull();
  });

  it('al comenzar muestra la sala 1, el desafío, el reloj y «Confirmar» deshabilitado', () => {
    montarLocal();
    comenzar();
    expect(screen.getByText('Sala 1 de 2')).toBeTruthy();
    expect(screen.getByText('Sala del agua')).toBeTruthy();
    expect(screen.getByText('Una sala húmeda')).toBeTruthy();
    expect(screen.getByText('¿Fórmula del agua?')).toBeTruthy();
    expect(screen.getByText('01:00')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(true);
    escribir('x');
    expect((screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('el reloj baja un segundo por segundo', () => {
    montarLocal();
    comenzar();
    avanzar(5000);
    expect(screen.getByText('00:55')).toBeTruthy();
  });

  it('acierto al primer intento: emite la respuesta, suena «correct», overlay y pasa a la sala 2 a los 1,5 s', () => {
    const { onAnswer } = montarLocal();
    comenzar();
    escribir(' h2o ');
    confirmar();
    expect(onAnswer).toHaveBeenCalledWith('sala-1', ' h2o ', true, 1);
    expect(sonido).toHaveBeenCalledWith('correct');
    expect(screen.getByText('¡Correcto!')).toBeTruthy();
    expect(screen.getByText('Pasando a la siguiente sala…')).toBeTruthy();
    avanzar(1499);
    expect(screen.getByText('Sala 1 de 2')).toBeTruthy();
    avanzar(1);
    expect(screen.getByText('Sala 2 de 2')).toBeTruthy();
    expect(screen.getByText('Sala de la sal')).toBeTruthy();
  });

  it('la tecla Enter confirma', () => {
    const { onAnswer } = montarLocal();
    comenzar();
    escribir('H2O');
    fireEvent.keyDown(screen.getByPlaceholderText('Tu respuesta…'), { key: 'Enter' });
    expect(onAnswer).toHaveBeenCalledWith('sala-1', 'H2O', true, 1);
  });

  it('fallo: suena «wrong», cuenta los intentos restantes y revela la pista tras el primer fallo', () => {
    const { onAnswer } = montarLocal();
    comenzar();
    expect(screen.queryByRole('button', { name: 'Ver pista' })).toBeNull();
    escribir('CO2');
    confirmar();
    expect(onAnswer).toHaveBeenCalledWith('sala-1', 'CO2', false, 1);
    expect(sonido).toHaveBeenCalledWith('wrong');
    expect(screen.getByText('Incorrecto. Te queda 1 intento.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver pista' }));
    expect(screen.getByText('Dos hidrógenos')).toBeTruthy();
  });

  it('al agotar los intentos la sala se bloquea, no suma puntos y se sigue a la siguiente', () => {
    const { onAnswer } = montarLocal();
    comenzar();
    escribir('a');
    confirmar();
    escribir('b');
    confirmar();
    expect(onAnswer).toHaveBeenLastCalledWith('sala-1', 'b', false, 2);
    expect(screen.getByText('Sala bloqueada')).toBeTruthy();
    expect(screen.getByText('Continuando de todas formas…')).toBeTruthy();
    avanzar(1500);
    expect(screen.getByText('Sala 2 de 2')).toBeTruthy();
  });

  it('opción múltiple: elegir y confirmar; victoria con puntos, tiempo, desglose y «Finalizar»', () => {
    const { onAnswer, onComplete, onExit } = montarLocal();
    comenzar();
    escribir('H2O');
    confirmar(); // 300 pts
    avanzar(1500);
    expect((screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Sodio'));
    confirmar(); // incorrecto
    expect(onAnswer).toHaveBeenLastCalledWith('sala-2', 'Sodio', false, 1);
    expect(screen.getByText('Incorrecto. Te quedan 2 intentos.')).toBeTruthy();
    avanzar(3000);
    fireEvent.click(screen.getByText('Cloro'));
    confirmar(); // segundo intento: 150 pts
    expect(onAnswer).toHaveBeenLastCalledWith('sala-2', 'Cloro', true, 2);
    avanzar(1500);

    expect(screen.getByText('¡Escapaste!')).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(450, 6000);
    expect(screen.getByText('450')).toBeTruthy();
    expect(screen.getByText('puntos')).toBeTruthy();
    expect(screen.getByText('0m 6s')).toBeTruthy();
    expect(screen.getByText('Desglose por sala')).toBeTruthy();
    expect(screen.getByText('1 intento')).toBeTruthy();
    expect(screen.getByText('2 intentos')).toBeTruthy();
    expect(screen.getByText('300 pts')).toBeTruthy();
    expect(screen.getByText('150 pts')).toBeTruthy();
    // En local no hay ranking de equipos.
    expect(screen.queryByText('Ranking de equipos')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Actividad finalizada')).toBeTruthy();
    expect(screen.getByText('450')).toBeTruthy();
  });

  it('el puntaje por intento: 3.º intento da la sexta parte (50/300)', () => {
    const { onComplete } = montarLocal({
      salas: [{ ...actividad().salas[1]!, intentosMaximos: 3 }],
    });
    comenzar();
    fireEvent.click(screen.getByText('Sodio'));
    confirmar();
    confirmar(); // sigue elegido «Sodio»
    fireEvent.click(screen.getByText('Cloro'));
    confirmar();
    avanzar(1500);
    expect(onComplete).toHaveBeenCalledWith(50, 1500);
  });

  it('se acaba el tiempo: derrota con lo completado y los puntos, y avisa por onComplete', () => {
    const { onComplete } = montarLocal();
    comenzar();
    escribir('H2O');
    confirmar();
    avanzar(1500); // 300 pts, sala 2
    avanzar(58500); // total 60 s
    expect(screen.getByText('¡Se acabó el tiempo!')).toBeTruthy();
    expect(screen.getByText(/Completaste/).textContent).toBe('Completaste 1 de 2 salas');
    expect(screen.getByText('puntos acumulados')).toBeTruthy();
    expect(onComplete).toHaveBeenCalledWith(300, 60000);
  });

  it('intentos ilimitados (−1): nunca bloquea y el mensaje no cuenta intentos', () => {
    montarLocal({ salas: [{ ...actividad().salas[0]!, intentosMaximos: -1 }] });
    comenzar();
    for (let i = 0; i < 4; i += 1) {
      escribir(`x${i}`);
      confirmar();
    }
    expect(screen.getByText('Respuesta incorrecta.')).toBeTruthy();
    expect(screen.queryByText('Sala bloqueada')).toBeNull();
  });

  it('tipo código: campo numérico con su texto de ayuda', () => {
    montarLocal({ salas: [{ ...actividad().salas[0]!, tipoRespuesta: 'codigo', respuestaCorrecta: '1234' }] });
    comenzar();
    const input = screen.getByPlaceholderText('Código numérico…');
    expect(input.getAttribute('type')).toBe('number');
  });

  it('lienzo de la sala: se pinta si tiene bloques visibles y se ignoran los de tipo «actividad»', () => {
    const renderSalaCanvas = vi.fn(() => <div data-testid="lienzo" />);
    const conLienzo = actividad({
      salas: [{ ...actividad().salas[0]!, bloques: [{ id: 'b1', tipo: 'separador' }, { id: 'b2', tipo: 'actividad' }] }],
    });
    montarLocal(conLienzo, { renderSalaCanvas });
    comenzar();
    expect(screen.getByTestId('lienzo')).toBeTruthy();
    expect(renderSalaCanvas).toHaveBeenCalledTimes(1);
    cleanup();

    const soloActividad = vi.fn(() => <div data-testid="lienzo" />);
    montarLocal(
      { salas: [{ ...actividad().salas[0]!, bloques: [{ id: 'b2', tipo: 'actividad' }] }] },
      { renderSalaCanvas: soloActividad },
    );
    comenzar();
    expect(screen.queryByTestId('lienzo')).toBeNull();
    expect(soloActividad).not.toHaveBeenCalled();
  });

  it('un cambio de `editorSyncKey` reinicia el viewer a la intro', () => {
    const { rerender, onAnswer } = montarLocal();
    comenzar();
    expect(screen.getByText('Sala 1 de 2')).toBeTruthy();
    rerender(
      <EscapeRoomViewer
        activity={actividad()}
        studentId="s1"
        studentName="Ana"
        classId="cls"
        slideId="sl1"
        editorSyncKey="b"
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByRole('button', { name: '▶ Comenzar' })).toBeTruthy();
  });
});

// ─── Modo equipos (socket falso) ──────────────────────────────────────────────

type Handler = (payload: unknown) => void;
const SALA_ROOMS = (s1: string, s2: string, i1 = 0, i2 = 0) => [
  { salaId: 'sala-1', salaIndex: 0, status: s1, intentos: i1, pistasReveladas: 0, points: s1 === 'superada' ? 300 : 0, solvedByStudentName: null },
  { salaId: 'sala-2', salaIndex: 1, status: s2, intentos: i2, pistasReveladas: 0, points: s2 === 'superada' ? 300 : 0, solvedByStudentName: null },
];
const equipo = (extra = {}) => ({
  id: 't1',
  name: 'Equipo Rojo',
  salaIndex: 0,
  points: 0,
  finished: false,
  members: [{ studentId: 's1', studentName: 'Ana' }, { studentId: 's9', studentName: 'Beto' }],
  rooms: SALA_ROOMS('abierta', 'abierta'),
  ...extra,
});
const estado = (team) => ({
  runId: 'r1',
  classId: 'cls',
  slideId: 'sl1',
  sessionId: 'ses',
  status: 'running',
  startedAtMs: T0,
  totalSalas: 2,
  tiempoLimiteMinutos: 1,
  mostrarRanking: true,
  team,
});

function crearSocket(respuestas: Record<string, unknown>) {
  const handlers = new Map<string, Set<Handler>>();
  const emitidos: { evento: string; payload: Record<string, unknown> }[] = [];
  const socket = {
    on: (e: string, fn: Handler) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(fn);
    },
    off: (e: string, fn: Handler) => void handlers.get(e)?.delete(fn),
    emit: (e: string, payload: Record<string, unknown>, cb?: (r: unknown) => void) => {
      emitidos.push({ evento: e, payload });
      const r = respuestas[e];
      if (cb) cb(typeof r === 'function' ? r(payload) : r ?? { ok: false });
    },
  };
  const disparar = (e: string, payload: unknown) => act(() => void handlers.get(e)?.forEach((fn) => fn(payload)));
  return { socket, emitidos, disparar, enviados: (e: string) => emitidos.filter((x) => x.evento === e) };
}

async function montarVivo(respuestas: Record<string, unknown>, extra: Partial<EscapeRoomActivity> = {}) {
  const s = crearSocket(respuestas);
  const onComplete = vi.fn();
  const onAnswer = vi.fn();
  const r = render(
    <EscapeRoomViewer
      activity={actividad(extra)}
      studentId="s1"
      studentName="Ana"
      classId="cls"
      slideId="sl1"
      editorSyncKey="a"
      liveSocket={s.socket}
      onComplete={onComplete}
      onAnswer={onAnswer}
    />,
  );
  await flush();
  return { ...s, onComplete, onAnswer, ...r };
}

describe('Escape room — modo equipos (socket falso)', () => {
  it('con una partida abierta por el docente muestra «Modo equipos» y pide el estado al entrar', async () => {
    const v = await montarVivo({ 'escape-room:state': { ok: true, state: estado(null) } });
    expect(screen.getByText('Modo equipos')).toBeTruthy();
    expect(v.enviados('escape-room:state')[0]!.payload).toEqual({ classId: 'cls', slideId: 'sl1', studentId: 's1' });
  });

  it('sin partida abierta se comporta como local', async () => {
    await montarVivo({ 'escape-room:state': { ok: true, state: null } });
    expect(screen.queryByText('Modo equipos')).toBeNull();
  });

  it('Comenzar une al equipo (join-team) y pasa a la sala con el equipo en el encabezado', async () => {
    const v = await montarVivo({
      'escape-room:state': { ok: true, state: estado(null) },
      'escape-room:join-team': { ok: true, state: estado(equipo()) },
    });
    comenzar();
    await flush();
    expect(v.enviados('escape-room:join-team')[0]!.payload).toEqual({
      classId: 'cls',
      slideId: 'sl1',
      studentId: 's1',
      studentName: 'Ana',
    });
    expect(screen.getByText('Sala 1 de 2')).toBeTruthy();
    expect(screen.getByText(/Equipo Rojo/)).toBeTruthy();
    expect(screen.getByText('01:00')).toBeTruthy();
  });

  it('si no se puede unir muestra el error y se queda en la intro', async () => {
    await montarVivo({
      'escape-room:state': { ok: true, state: estado(null) },
      'escape-room:join-team': { ok: false, error: 'Partida llena' },
    });
    comenzar();
    await flush();
    expect(screen.getByText('Partida llena')).toBeTruthy();
    expect(screen.getByRole('button', { name: '▶ Comenzar' })).toBeTruthy();
  });

  it('la intro muestra a los compañeros del equipo cuando ya hay uno asignado', async () => {
    await montarVivo({ 'escape-room:state': { ok: true, state: estado(equipo()) } });
    expect(screen.getByText('Equipo Rojo')).toBeTruthy();
    expect(screen.getByText('Ana · Beto')).toBeTruthy();
  });

  it('respuesta: la valida el servidor; incorrecto cuenta el intento y trae pistas', async () => {
    const v = await montarVivo({
      'escape-room:state': { ok: true, state: estado(equipo()) },
      'escape-room:answer': { ok: true, outcome: 'incorrecto', intento: 1, pistas: ['Piensa en H'] },
    });
    comenzar();
    await flush();
    escribir('CO2');
    confirmar();
    await flush();
    expect(v.enviados('escape-room:answer')[0]!.payload).toEqual({
      classId: 'cls',
      slideId: 'sl1',
      studentId: 's1',
      studentName: 'Ana',
      salaId: 'sala-1',
      answer: 'CO2',
    });
    expect(v.onAnswer).toHaveBeenCalledWith('sala-1', 'CO2', false, 1);
    expect(sonido).toHaveBeenCalledWith('wrong');
    expect(screen.getByText('Incorrecto. Te queda 1 intento.')).toBeTruthy();
    expect(screen.getByText('Piensa en H')).toBeTruthy();
  });

  it('respuesta correcta: overlay y se limpia a los 1,5 s; bloqueada: overlay de sala bloqueada', async () => {
    const v = await montarVivo({
      'escape-room:state': { ok: true, state: estado(equipo()) },
      'escape-room:answer': { ok: true, outcome: 'correcto', intento: 1 },
    });
    comenzar();
    await flush();
    escribir('H2O');
    confirmar();
    await flush();
    expect(v.onAnswer).toHaveBeenCalledWith('sala-1', 'H2O', true, 1);
    expect(sonido).toHaveBeenCalledWith('correct');
    expect(screen.getByText('¡Correcto!')).toBeTruthy();
    avanzar(1500);
    expect(screen.queryByText('¡Correcto!')).toBeNull();
  });

  it('bloqueada: overlay de «Sala bloqueada»', async () => {
    const v = await montarVivo({
      'escape-room:state': { ok: true, state: estado(equipo()) },
      'escape-room:answer': { ok: true, outcome: 'bloqueada', intento: 2 },
    });
    comenzar();
    await flush();
    escribir('a');
    confirmar();
    await flush();
    expect(screen.getByText('Sala bloqueada')).toBeTruthy();
    expect(v.onAnswer).toHaveBeenCalledWith('sala-1', 'a', false, 2);
  });

  it('un fallo del servidor al responder no cambia nada ni suena', async () => {
    await montarVivo({
      'escape-room:state': { ok: true, state: estado(equipo()) },
      'escape-room:answer': { ok: false, error: 'x' },
    });
    comenzar();
    await flush();
    escribir('a');
    confirmar();
    await flush();
    expect(sonido).not.toHaveBeenCalled();
    expect(screen.queryByText(/Incorrecto/)).toBeNull();
  });

  it('«Pedir pista» (tras un intento) pide la pista al servidor y la muestra', async () => {
    const v = await montarVivo({
      'escape-room:state': {
        ok: true,
        state: estado(equipo({ rooms: SALA_ROOMS('abierta', 'abierta', 1) })),
      },
      'escape-room:hint-request': { ok: true, pistas: ['Pista del servidor'] },
    });
    comenzar();
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Pedir pista' }));
    await flush();
    expect(v.enviados('escape-room:hint-request')[0]!.payload).toEqual({
      classId: 'cls',
      slideId: 'sl1',
      studentId: 's1',
      salaId: 'sala-1',
    });
    expect(screen.getByText('Pista del servidor')).toBeTruthy();
  });

  it('el progreso de un compañero (team-progress) avanza la sala y el viewer anima la transición', async () => {
    const v = await montarVivo({ 'escape-room:state': { ok: true, state: estado(equipo()) } });
    comenzar();
    await flush();
    await v.disparar('escape-room:team-progress', {
      classId: 'cls',
      slideId: 'sl1',
      runId: 'r1',
      totalSalas: 2,
      teamId: 't1',
      teamName: 'Equipo Rojo',
      salaIndex: 1,
      points: 300,
      finished: false,
      rooms: SALA_ROOMS('superada', 'abierta'),
    });
    expect(screen.getByText('¡Correcto!')).toBeTruthy();
    expect(screen.getByText('Sala 2 de 2')).toBeTruthy();
    avanzar(1500);
    expect(screen.queryByText('¡Correcto!')).toBeNull();
    expect(screen.getByText('Sala de la sal')).toBeTruthy();
  });

  it('al terminar el equipo: victoria con los puntos del servidor, un solo aviso y el podio de equipos', async () => {
    const v = await montarVivo({
      'escape-room:state': { ok: true, state: estado(equipo()) },
      'escape-room:ranking': {
        ok: true,
        ranking: [
          { teamId: 't2', name: 'Equipo Azul', points: 700, finished: true, salaIndex: 2, position: 1 },
          { teamId: 't1', name: 'Equipo Rojo', points: 600, finished: false, salaIndex: 1, position: 2 },
        ],
      },
    });
    comenzar();
    await flush();
    avanzar(4000);
    const fin = {
      classId: 'cls',
      slideId: 'sl1',
      runId: 'r1',
      totalSalas: 2,
      teamId: 't1',
      teamName: 'Equipo Rojo',
      salaIndex: 2,
      points: 600,
      finished: true,
      rooms: SALA_ROOMS('superada', 'superada', 1, 1),
    };
    await v.disparar('escape-room:team-progress', fin);
    await flush();
    await v.disparar('escape-room:team-progress', fin);
    await flush();

    expect(screen.getByText('¡Escapaste!')).toBeTruthy();
    expect(v.onComplete).toHaveBeenCalledTimes(1);
    expect(v.onComplete).toHaveBeenCalledWith(600, 4000);
    expect(screen.getByText('600')).toBeTruthy();
    expect(screen.getByText('Ranking de equipos')).toBeTruthy();
    expect(screen.getByText('Equipo Azul')).toBeTruthy();
    expect(screen.getByText('en juego')).toBeTruthy();
    expect(screen.getByText('700 pts')).toBeTruthy();
  });

  it('sin «mostrarRanking» no pide ni muestra el podio', async () => {
    const v = await montarVivo(
      { 'escape-room:state': { ok: true, state: estado(equipo()) } },
      { mostrarRanking: false },
    );
    comenzar();
    await flush();
    await v.disparar('escape-room:team-progress', {
      classId: 'cls',
      slideId: 'sl1',
      runId: 'r1',
      totalSalas: 2,
      teamId: 't1',
      teamName: 'Equipo Rojo',
      salaIndex: 2,
      points: 600,
      finished: true,
      rooms: SALA_ROOMS('superada', 'superada'),
    });
    await flush();
    expect(screen.getByText('¡Escapaste!')).toBeTruthy();
    expect(v.enviados('escape-room:ranking')).toHaveLength(0);
    expect(screen.queryByText('Ranking de equipos')).toBeNull();
  });

  it('al desmontar quita las escuchas del socket', async () => {
    const v = await montarVivo({ 'escape-room:state': { ok: true, state: estado(null) } });
    v.unmount();
    await v.disparar('escape-room:team-progress', { teamId: 'x' });
  });
});
