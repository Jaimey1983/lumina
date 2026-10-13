/**
 * U11.1 — paridad del viewer de `torneo` contra su comportamiento ANTERIOR a migrarlo al kit (Regla 7).
 *
 * Estas 24 pruebas se escribieron y pasaron contra el viewer viejo del frontend (commit de
 * caracterización) y aquí solo cambió el import: es el contrato con el alumno y con el docente.
 * Fijan lo que el alumno VE y lo que el viewer EMITE: modo autónomo (sin socket: puntos base +
 * bonus de velocidad, nota final 1–5, resumen) y modo en vivo (eventos `torneo:*` con socket falso).
 *
 * Relojes falsos con `toFake` explícito, incluido `performance` (el viewer mide `responseMs` con él).
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Socket } from 'socket.io-client';
import type { TorneoActivity } from '@lumina/types/slide';

const sonido = vi.hoisted(() => vi.fn());
vi.mock('@lumina/editor-shared/use-sound', () => ({ useSound: () => ({ play: sonido }) }));

import { TorneoViewer, type TorneoAnswerPayload } from "../../activities/torneo/torneo-viewer.js";
import { torneoDefinition } from './torneo-definition.js';
import { TorneoViewer as TorneoViewerElemento, TorneoEditor, TorneoPropiedades } from './torneo-adapters.js';
import { createDefaultTorneo, normalizeTorneo } from '../../activities/torneo/index.js';


beforeEach(() => {
  sonido.mockClear();
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'],
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const actividad = (extra: Partial<TorneoActivity> = {}): TorneoActivity => ({
  tipo: 'torneo',
  preguntas: [
    { enunciado: '¿2+2?', opciones: ['3', '4', '5', '6'], correcta: '4', tiempoSegundos: 10 },
    { enunciado: '¿Capital?', opciones: ['Bogotá', 'Lima', '', ''], correcta: 'Bogotá', tiempoSegundos: 20 },
  ],
  puntosBase: 1000,
  bonusVelocidad: 500,
  ...extra,
});

function montarAutonomo(extra: Partial<TorneoActivity> = {}) {
  const onAnswer = vi.fn<(p: TorneoAnswerPayload) => void>();
  const r = render(
    <TorneoViewer
      activity={actividad(extra)}
      studentId="est1"
      studentName="Ana"
      classId="cls"
      onAnswer={onAnswer}
      editorSyncKey="a"
    />,
  );
  return { onAnswer, ...r };
}

const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('Torneo — modo autónomo (sin socket)', () => {
  it('muestra la pantalla de espera con el número de preguntas y el botón de empezar', () => {
    montarAutonomo();
    expect(screen.getByText('Torneo de preguntas')).toBeTruthy();
    expect(screen.getByText(/2 preguntas · responde lo más rápido que puedas/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '¡Comenzar!' })).toBeTruthy();
  });

  it('con una sola pregunta usa el singular', () => {
    montarAutonomo({ preguntas: [actividad().preguntas[0]!] });
    expect(screen.getByText(/1 pregunta · responde/)).toBeTruthy();
  });

  it('al empezar muestra la pregunta, el tiempo y 4 opciones A–D (la vacía queda deshabilitada)', () => {
    montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    expect(screen.getByText('Pregunta 1 de 2 · 10s')).toBeTruthy();
    expect(screen.getByText('¿2+2?')).toBeTruthy();
    for (const letra of ['A', 'B', 'C', 'D']) expect(screen.getByText(letra)).toBeTruthy();
    // La primera pregunta tiene las cuatro opciones habilitadas.
    expect(screen.getAllByRole('button').every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('el reloj baja un segundo por segundo', () => {
    montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    avanzar(3000);
    expect(screen.getByText('Pregunta 1 de 2 · 7s')).toBeTruthy();
  });

  it('una respuesta correcta emite el payload, suena «correct», muestra «¡Correcto!» y avanza a los 1,6 s', () => {
    const { onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    avanzar(2000);
    fireEvent.click(screen.getByText('4'));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({
      questionIndex: 0,
      answer: '4',
      responseMs: 2000,
      torneoId: null,
      correctAnswer: '4',
    });
    expect(sonido).toHaveBeenCalledWith('correct');
    expect(screen.getByText('¡Correcto!')).toBeTruthy();
    // Con la respuesta dada, todas las opciones quedan deshabilitadas.
    expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true);

    avanzar(1599);
    expect(screen.getByText(/Pregunta 1 de 2/)).toBeTruthy();
    avanzar(1);
    expect(screen.getByText(/Pregunta 2 de 2 · 20s/)).toBeTruthy();
  });

  it('una respuesta incorrecta suena «wrong» y revela la correcta', () => {
    const { onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    fireEvent.click(screen.getByText('3'));
    expect(sonido).toHaveBeenCalledWith('wrong');
    expect(screen.getByText('Incorrecto · Respuesta: 4')).toBeTruthy();
    expect(onAnswer).toHaveBeenCalledWith({
      questionIndex: 0,
      answer: '3',
      responseMs: 0,
      torneoId: null,
      correctAnswer: '4',
    });
  });

  it('una opción vacía no se puede elegir', () => {
    const { onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    fireEvent.click(screen.getByText('3'));
    avanzar(1600);
    const vacias = screen.getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled);
    expect(vacias.length).toBe(2); // C y D están vacías
    onAnswer.mockClear();
    vacias.forEach((b) => fireEvent.click(b));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('se queda sin tiempo: emite respuesta vacía con el tiempo transcurrido, suena «wrong» y avanza', () => {
    const { onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    avanzar(10000);
    expect(onAnswer).toHaveBeenCalledWith({
      questionIndex: 0,
      answer: '',
      responseMs: 10000,
      torneoId: null,
      correctAnswer: '4',
    });
    expect(sonido).toHaveBeenCalledWith('wrong');
    expect(screen.getByText('Incorrecto · Respuesta: 4')).toBeTruthy();
    avanzar(1600);
    expect(screen.getByText(/Pregunta 2 de 2/)).toBeTruthy();
  });

  it('todo correcto: puntos base + bonus por velocidad → nota 1–5 y resumen «2/2»', () => {
    const { onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    avanzar(2000);
    fireEvent.click(screen.getByText('4')); // 1000 + round(500·(1−2000/10000)) = 1400
    avanzar(1600);
    fireEvent.click(screen.getByText('Bogotá')); // 1000 + 500 = 1500
    avanzar(1600);

    const final = onAnswer.mock.calls.at(-1)![0];
    expect(final).toMatchObject({
      questionIndex: -1,
      answer: '',
      responseMs: 0,
      torneoId: null,
      correctAnswer: '',
    });
    // 2900 de 3000 posibles → 2900/3000·4 + 1
    expect(final.finalNota).toBeCloseTo((2900 / 3000) * 4 + 1, 10);
    expect(screen.getByText('¡Torneo completado!')).toBeTruthy();
    expect(screen.getByText('respuestas correctas')).toBeTruthy();
    expect(screen.getByText('¡Perfecto! ¡Respondiste todo correctamente!')).toBeTruthy();
    expect(screen.getByText('Ana')).toBeTruthy();
  });

  it('todo mal: nota 1.0 y mensaje de ánimo', () => {
    const { onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    fireEvent.click(screen.getByText('3'));
    avanzar(1600);
    fireEvent.click(screen.getByText('Lima'));
    avanzar(1600);
    expect(onAnswer.mock.calls.at(-1)![0].finalNota).toBe(1);
    expect(screen.getByText('¡No te rindas, practica y mejorarás!')).toBeTruthy();
  });

  it('la mitad bien da «¡Sigue practicando!» (1 de 2 = 50 %)', () => {
    montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    fireEvent.click(screen.getByText('4'));
    avanzar(1600);
    fireEvent.click(screen.getByText('Lima'));
    avanzar(1600);
    expect(screen.getByText('¡Sigue practicando!')).toBeTruthy();
  });

  it('un cambio de `editorSyncKey` reinicia el viewer a la pantalla de espera', () => {
    const { rerender, onAnswer } = montarAutonomo();
    fireEvent.click(screen.getByRole('button', { name: '¡Comenzar!' }));
    expect(screen.getByText(/Pregunta 1 de 2/)).toBeTruthy();
    rerender(
      <TorneoViewer
        activity={actividad()}
        studentId="est1"
        studentName="Ana"
        classId="cls"
        onAnswer={onAnswer}
        editorSyncKey="b"
      />,
    );
    expect(screen.getByRole('button', { name: '¡Comenzar!' })).toBeTruthy();
  });

  it('expone el id de la clase en la raíz', () => {
    const { container } = montarAutonomo();
    expect(container.querySelector('[data-lumina-class-id="cls"]')).toBeTruthy();
  });
});

type Handler = (payload: unknown) => void;
function crearSocket() {
  const handlers = new Map<string, Set<Handler>>();
  const socket = {
    on: (e: string, fn: Handler) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(fn);
    },
    off: vi.fn((e: string, fn: Handler) => void handlers.get(e)?.delete(fn)),
  };
  const disparar = (e: string, payload?: unknown) =>
    act(() => void handlers.get(e)?.forEach((fn) => fn(payload)));
  const escuchas = () => [...handlers.values()].reduce((n, s) => n + s.size, 0);
  return { socket: socket as unknown as Socket, offSpy: socket.off, disparar, escuchas };
}

function montarVivo() {
  const s = crearSocket();
  const onAnswer = vi.fn<(p: TorneoAnswerPayload) => void>();
  const r = render(
    <TorneoViewer
      activity={actividad()}
      studentId="s2"
      studentName="Beto"
      classId="cls"
      onAnswer={onAnswer}
      liveSocket={s.socket}
      editorSyncKey="a"
    />,
  );
  return { ...s, onAnswer, ...r };
}

describe('Torneo — modo en vivo (socket falso)', () => {
  it('espera al docente y escucha los cuatro eventos', () => {
    const { escuchas } = montarVivo();
    expect(screen.getByText('Esperando al docente…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '¡Comenzar!' })).toBeNull();
    expect(escuchas()).toBe(4);
  });

  it('`torneo:start` muestra el aviso 2,5 s y guarda el id del torneo', () => {
    const { disparar, onAnswer } = montarVivo();
    disparar('torneo:start', { torneoId: '  t1  ' });
    expect(screen.getByText('¡Torneo iniciado!')).toBeTruthy();
    avanzar(2500);
    expect(screen.queryByText('¡Torneo iniciado!')).toBeNull();

    disparar('torneo:question', { questionIndex: 0 });
    fireEvent.click(screen.getByText('4'));
    expect(onAnswer).toHaveBeenCalledWith({
      questionIndex: 0,
      answer: '4',
      responseMs: 0,
      torneoId: 't1',
      correctAnswer: '4',
    });
  });

  it('`torneo:question` abre la pregunta indicada con su tiempo; sin feedback local al responder', () => {
    const { disparar, onAnswer } = montarVivo();
    disparar('torneo:question', { index: 1, tiempoSegundos: 7 });
    expect(screen.getByText('Pregunta 2 de 2 · 7s')).toBeTruthy();
    avanzar(1000);
    fireEvent.click(screen.getByText('Lima'));
    expect(sonido).toHaveBeenCalledWith('submit');
    expect(screen.queryByText(/Incorrecto|¡Correcto!/)).toBeNull();
    expect(onAnswer).toHaveBeenCalledWith({
      questionIndex: 1,
      answer: 'Lima',
      responseMs: 1000,
      torneoId: null,
      correctAnswer: 'Bogotá',
    });
    // No avanza solo: es el docente quien controla el ritmo.
    avanzar(5000);
    expect(screen.getByText(/Pregunta 2 de 2/)).toBeTruthy();
  });

  it('un índice fuera de rango se acota a la última pregunta y sin payload empieza en la primera', () => {
    const { disparar } = montarVivo();
    disparar('torneo:question', { questionIndex: 99 });
    expect(screen.getByText(/Pregunta 2 de 2 · 20s/)).toBeTruthy();
    disparar('torneo:question');
    expect(screen.getByText(/Pregunta 1 de 2 · 10s/)).toBeTruthy();
  });

  it('si se acaba el tiempo emite la respuesta vacía', () => {
    const { disparar, onAnswer } = montarVivo();
    disparar('torneo:question', { questionIndex: 0, tiempoSegundos: 3 });
    avanzar(3000);
    expect(onAnswer).toHaveBeenCalledWith({
      questionIndex: 0,
      answer: '',
      responseMs: 3000,
      torneoId: null,
      correctAnswer: '4',
    });
  });

  it('`torneo:ranking` muestra el top 5 con mi fila y vuelve a la espera tras la cuenta de 3 s', () => {
    const { disparar } = montarVivo();
    disparar('torneo:ranking', {
      ranking: [
        { studentId: 's1', studentName: 'Ana', points: 900, position: 1 },
        { studentId: 's2', studentName: 'Beto', total: 800.4, position: 2 },
        { studentId: 's3', studentName: '', points: 10, position: 3 },
        { studentId: 's4', studentName: 'D', points: 9, position: 4 },
        { studentId: 's5', studentName: 'E', points: 8, position: 5 },
        { studentId: 's6', studentName: 'F', points: 7, position: 6 },
        { sinId: true },
      ],
    });
    expect(screen.getByText('Ranking')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('800')).toBeTruthy(); // `total` como respaldo de `points`, redondeado
    expect(screen.getByText('s3')).toBeTruthy(); // sin nombre → muestra el id
    expect(screen.queryByText('F')).toBeNull();
    expect(screen.getByText('Siguiente pregunta en 3…')).toBeTruthy();
    avanzar(1000);
    expect(screen.getByText('Siguiente pregunta en 2…')).toBeTruthy();
    avanzar(2000);
    expect(screen.getByText('Esperando al docente…')).toBeTruthy();
  });

  it('un ranking vacío conserva el anterior', () => {
    const { disparar } = montarVivo();
    disparar('torneo:ranking', [{ studentId: 's1', studentName: 'Ana', points: 5, position: 1 }]);
    disparar('torneo:ranking', { ranking: [] });
    expect(screen.getByText('Ana')).toBeTruthy();
  });

  it('`torneo:end` muestra el podio con mi lugar y puntos (acepta `podio`)', () => {
    const { disparar } = montarVivo();
    disparar('torneo:end', {
      podio: [
        { studentId: 's1', studentName: 'Ana', points: 900, position: 1 },
        { studentId: 's2', studentName: 'Beto', points: 800.4, position: 2 },
        { studentId: 's3', studentName: 'Cami', points: 700, position: 3 },
      ],
    });
    expect(screen.getByText('Torneo finalizado')).toBeTruthy();
    expect(screen.getByText('2º')).toBeTruthy();
    expect(screen.getByText('1º')).toBeTruthy();
    expect(screen.getByText('3º')).toBeTruthy();
    expect(screen.getByText('Cami')).toBeTruthy();
    expect(screen.getByText(/lugar/).textContent).toContain('lugar 2 · 800 pts');
    expect(screen.getByText('¡Subcampeón espectacular!')).toBeTruthy();
  });

  it('el mensaje final depende de la posición', () => {
    const casos: [number, string][] = [
      [1, '¡Campeón del torneo!'],
      [3, '¡Estás en el podio!'],
    ];
    for (const [pos, msg] of casos) {
      cleanup();
      const { disparar } = montarVivo();
      disparar('torneo:end', [
        ...Array.from({ length: pos - 1 }, (_, i) => ({ studentId: `x${i}`, studentName: 'X', points: 1, position: i + 1 })),
        { studentId: 's2', studentName: 'Beto', points: 5, position: pos },
      ]);
      expect(screen.getByText(msg)).toBeTruthy();
    }
    // Fuera de la mitad superior del ranking.
    cleanup();
    const { disparar } = montarVivo();
    disparar(
      'torneo:end',
      Array.from({ length: 6 }, (_, i) => ({
        studentId: i === 4 ? 's2' : `x${i}`,
        studentName: 'X',
        points: 1,
        position: i + 1,
      })),
    );
    expect(screen.getByText('¡Sigue practicando, vas por buen camino!')).toBeTruthy();
    // Particularidad actual: sin ranking, la posición propia se toma como 1.º.
    cleanup();
    const vacio = montarVivo();
    vacio.disparar('torneo:end', []);
    expect(screen.getByText('¡Campeón del torneo!')).toBeTruthy();
  });

  it('al final no vuelve a la espera aunque llegue un ranking antes (la cuenta no pisa el cierre)', () => {
    const { disparar } = montarVivo();
    disparar('torneo:ranking', [{ studentId: 's1', studentName: 'Ana', points: 5, position: 1 }]);
    disparar('torneo:end', [{ studentId: 's1', studentName: 'Ana', points: 5, position: 1 }]);
    avanzar(5000);
    expect(screen.getByText('Torneo finalizado')).toBeTruthy();
  });

  it('al desmontar quita las cuatro escuchas', () => {
    const { unmount, offSpy, escuchas } = montarVivo();
    unmount();
    expect(offSpy).toHaveBeenCalledTimes(4);
    expect(escuchas()).toBe(0);
  });
});

// ─── Contrato del elemento (U11.1) ───────────────────────────────────────────────────────────

describe('Torneo — ElementDefinition', () => {
  it('se registra una sola vez con su catálogo y sin puntuación (en scoring es `exclude`)', async () => {
    const { elementRegistry } = await import('../../index.js');
    const def = elementRegistry.obtener('torneo');
    expect(def).toBe(torneoDefinition);
    expect('puntuacion' in torneoDefinition).toBe(false);
    expect(torneoDefinition.catalogo).toMatchObject({ nombre: 'Torneo de preguntas', familia: 'actividad' });
    expect(elementRegistry.listar().filter((d) => (d as { tipo: string }).tipo === 'torneo')).toHaveLength(1);
  });

  it('crearPorDefecto da las preguntas de ejemplo y normalizar es idempotente', () => {
    const a = createDefaultTorneo();
    expect(a.tipo).toBe('torneo');
    expect(a.preguntas.length).toBeGreaterThan(0);
    expect(a.puntosBase).toBeGreaterThan(0);
    expect(normalizeTorneo(null)).toEqual(a);
    const n = normalizeTorneo(a);
    expect(normalizeTorneo(n)).toEqual(n);
  });

  it('el Viewer del contrato usa el socket del torneo y, si falta, el de la clase; emite por onResponse', () => {
    const del = crearSocket();
    const clase = crearSocket();
    const onResponse = vi.fn();
    render(
      <TorneoViewerElemento
        estado={actividad()}
        config={{
          onResponse,
          viewerStudentId: 's2',
          viewerStudentName: 'Beto',
          viewerClassId: 'cls',
          torneoSocket: del.socket,
          liveSocket: clase.socket,
        }}
      />,
    );
    expect(del.escuchas()).toBe(4);
    expect(clase.escuchas()).toBe(0);
    del.disparar('torneo:question', { questionIndex: 0 });
    fireEvent.click(screen.getByText('4'));
    expect(onResponse).toHaveBeenCalledWith({
      questionIndex: 0,
      answer: '4',
      responseMs: 0,
      torneoId: null,
      correctAnswer: '4',
    });
  });

  it('sin torneoSocket cae a liveSocket; sin ningún socket es autónomo', () => {
    const clase = crearSocket();
    const { unmount } = render(
      <TorneoViewerElemento estado={actividad()} config={{ liveSocket: clase.socket }} />,
    );
    expect(clase.escuchas()).toBe(4);
    unmount();
    render(<TorneoViewerElemento estado={actividad()} config={{}} />);
    expect(screen.getByRole('button', { name: '¡Comenzar!' })).toBeTruthy();
  });

  it('Editor y Propiedades editan las preguntas y avisan con onChange', () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <TorneoEditor estado={actividad()} config={{ editorSyncKey: 'k' }} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Agregar pregunta/ }));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)![0].preguntas).toHaveLength(3);
    unmount();

    const onChange2 = vi.fn();
    render(
      <TorneoPropiedades
        estado={actividad()}
        config={{ editorSyncKey: 'k' }}
        onChange={onChange2}
        onConfigChange={() => {}}
      />,
    );
    expect(screen.getByText('Pregunta 2')).toBeTruthy();
  });
});
