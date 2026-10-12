/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- transitorio: se corre con la config del kit (jsdom + RTL); el frontend no los tiene. Se mueve al kit en la migración.
/**
 * U11.4 — caracterización del editor de `escape_room` ANTES de migrarlo al kit (Regla 7).
 *
 * Fija qué EMITE `onChange` en cada edición (campos de la actividad, alta/baja/tipo de sala, opciones,
 * pistas, intentos) y cómo se comporta el envoltorio del lienzo (`EscapeRoomActivityEditor`: estado
 * local con guardado diferido y botón de quitar). Las consultas usan placeholders y roles, no los
 * rótulos con codificación rota («TÃ­tulo…»), que la migración corrige a propósito.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EscapeRoomActivity } from '@lumina/types/slide';

import { EscapeRoomEditor, tipoRespuestaLabel } from './escape-room-editor';
import { EscapeRoomActivityEditor } from '@/app/(app)/classes/[id]/editor/components/activities/escape-room-activity';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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
  tiempoLimiteMinutos: 10,
  mostrarRanking: true,
  puntosBase: 300,
  ...extra,
});

function montar(extra: Partial<EscapeRoomActivity> = {}) {
  const onChange = vi.fn();
  const onBlurFlush = vi.fn();
  const r = render(<EscapeRoomEditor activity={actividad(extra)} onChange={onChange} onBlurFlush={onBlurFlush} />);
  const ultimo = () => onChange.mock.calls.at(-1)![0] as EscapeRoomActivity;
  return { onChange, onBlurFlush, ultimo, ...r };
}

describe('EscapeRoomEditor — actividad', () => {
  it('muestra los datos de la actividad y de las dos salas (expandidas)', () => {
    montar();
    expect((screen.getByPlaceholderText('Nombre de la actividad') as HTMLInputElement).value).toBe('Laboratorio');
    expect((screen.getByPlaceholderText('Historia inicial para el estudiante') as HTMLTextAreaElement).value).toBe(
      'Escapa del laboratorio',
    );
    expect(screen.getByText('10 min')).toBeTruthy();
    expect(screen.getByText('Sala del agua')).toBeTruthy();
    expect(screen.getAllByPlaceholderText('Ej. La sala de los misterios')).toHaveLength(2);
  });

  it('editar el título y la introducción emite la actividad completa', () => {
    const { ultimo } = montar();
    fireEvent.change(screen.getByPlaceholderText('Nombre de la actividad'), { target: { value: 'Nuevo' } });
    expect(ultimo()).toMatchObject({ tipo: 'escape_room', titulo: 'Nuevo', introduccion: 'Escapa del laboratorio' });
    expect(ultimo().salas).toHaveLength(2);
    fireEvent.change(screen.getByPlaceholderText('Historia inicial para el estudiante'), { target: { value: 'Otra' } });
    expect(ultimo().introduccion).toBe('Otra');
  });

  it('el deslizador de tiempo: 0 = sin límite (undefined), otro valor son minutos', () => {
    const { ultimo } = montar();
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0' } });
    expect(ultimo().tiempoLimiteMinutos).toBeUndefined();
    fireEvent.change(slider, { target: { value: '30' } });
    expect(ultimo().tiempoLimiteMinutos).toBe(30);
  });

  it('«Mostrar ranking» y los puntos base (no negativos)', () => {
    const { ultimo, onBlurFlush } = montar();
    fireEvent.click(screen.getByLabelText('Mostrar ranking'));
    expect(ultimo().mostrarRanking).toBe(false);
    const puntos = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(puntos, { target: { value: '450' } });
    expect(ultimo().puntosBase).toBe(450);
    fireEvent.change(puntos, { target: { value: '-20' } });
    expect(ultimo().puntosBase).toBe(0);
    fireEvent.blur(puntos);
    expect(onBlurFlush).toHaveBeenCalled();
  });
});

describe('EscapeRoomEditor — salas', () => {
  it('«Agregar sala» suma una sala nueva de texto con 3 intentos', () => {
    const { ultimo } = montar();
    fireEvent.click(screen.getByRole('button', { name: /Agregar sala/ }));
    const salas = ultimo().salas;
    expect(salas).toHaveLength(3);
    expect(salas[2]).toMatchObject({
      nombre: 'Nueva sala',
      tipoRespuesta: 'texto',
      respuestaCorrecta: '',
      ignorarMayusculas: true,
      intentosMaximos: 3,
    });
    expect(salas[2]!.id.length).toBeGreaterThan(0);
  });

  it('«Eliminar sala» quita la elegida; con una sola queda deshabilitado', () => {
    const { ultimo, rerender } = montar();
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar sala' })[0]);
    expect(ultimo().salas.map((s) => s.id)).toEqual(['sala-2']);
    cleanup();
    montar({ salas: [actividad().salas[0]!] });
    expect((screen.getByRole('button', { name: 'Eliminar sala' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('plegar y desplegar una sala', () => {
    montar();
    expect(screen.getAllByPlaceholderText('Ej. La sala de los misterios')).toHaveLength(2);
    fireEvent.click(screen.getByText('Sala del agua'));
    expect(screen.getAllByPlaceholderText('Ej. La sala de los misterios')).toHaveLength(1);
    fireEvent.click(screen.getByText('Sala del agua'));
    expect(screen.getAllByPlaceholderText('Ej. La sala de los misterios')).toHaveLength(2);
  });

  it('editar nombre, narrativa, desafío y respuesta correcta de una sala', () => {
    const { ultimo } = montar();
    fireEvent.change(screen.getAllByPlaceholderText('Ej. La sala de los misterios')[0], { target: { value: 'Sala A' } });
    expect(ultimo().salas[0]!.nombre).toBe('Sala A');
    fireEvent.change(screen.getAllByPlaceholderText('Contexto de la sala')[0], { target: { value: 'Contexto' } });
    expect(ultimo().salas[0]!.descripcion).toBe('Contexto');
    fireEvent.change(screen.getAllByPlaceholderText('Enunciado del acertijo')[0], { target: { value: '¿Q?' } });
    expect(ultimo().salas[0]!.desafio).toBe('¿Q?');
    fireEvent.change(screen.getByPlaceholderText('Texto esperado'), { target: { value: 'Agua' } });
    expect(ultimo().salas[0]!.respuestaCorrecta).toBe('Agua');
    // las demás salas no cambian
    expect(ultimo().salas[1]).toMatchObject({ id: 'sala-2', nombre: 'Sala de la sal' });
  });

  it('cambiar el tipo: a opción múltiple deja dos opciones vacías y sin respuesta; a código quita las opciones', () => {
    const { ultimo } = montar();
    const tipos = screen.getAllByRole('combobox');
    fireEvent.change(tipos[0], { target: { value: 'opcion_multiple' } });
    expect(ultimo().salas[0]).toMatchObject({ tipoRespuesta: 'opcion_multiple', opciones: ['', ''], respuestaCorrecta: '' });
    fireEvent.change(tipos[1], { target: { value: 'codigo' } });
    expect(ultimo().salas[1]!.tipoRespuesta).toBe('codigo');
    expect(ultimo().salas[1]!.opciones).toBeUndefined();
  });

  it('opciones: marcar la correcta, reescribir la correcta la arrastra, agregar otra', () => {
    const { ultimo } = montar();
    fireEvent.click(screen.getByLabelText('Marcar opción A como correcta'));
    expect(ultimo().salas[1]!.respuestaCorrecta).toBe('Sodio');
    fireEvent.change(screen.getByPlaceholderText('Opción B'), { target: { value: 'Cloro gas' } });
    expect(ultimo().salas[1]!.opciones).toEqual(['Sodio', 'Cloro gas']);
    expect(ultimo().salas[1]!.respuestaCorrecta).toBe('Cloro gas');
    fireEvent.click(screen.getByRole('button', { name: /Agregar opción/ }));
    expect(ultimo().salas[1]!.opciones).toEqual(['Sodio', 'Cloro', '']);
  });

  it('«Ignorar mayúsculas» y los intentos (número / ilimitados)', () => {
    const { ultimo } = montar();
    fireEvent.click(screen.getAllByLabelText('Ignorar mayúsculas')[0]);
    expect(ultimo().salas[0]!.ignorarMayusculas).toBe(false);
    const intentos = screen.getAllByRole('spinbutton')[1];
    expect((intentos as HTMLInputElement).value).toBe('2');
    fireEvent.change(intentos, { target: { value: '5' } });
    expect(ultimo().salas[0]!.intentosMaximos).toBe(5);
    fireEvent.change(intentos, { target: { value: '0' } });
    expect(ultimo().salas[0]!.intentosMaximos).toBe(5);
    fireEvent.click(screen.getAllByLabelText('Ilimitados')[0]);
    expect(ultimo().salas[0]!.intentosMaximos).toBe(-1);
  });

  it('pistas: agregar, subir/bajar, eliminar; la primera no sube y la última no baja', () => {
    const { ultimo } = montar();
    expect((screen.getByRole('button', { name: 'Subir pista 1' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Bajar pista 1' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: /Agregar pista/ })[0]);
    expect(ultimo().salas[0]!.pistas).toEqual(['Dos hidrógenos', '']);
    cleanup();
    const m = montar({ salas: [{ ...actividad().salas[0]!, pistas: ['uno', 'dos'] }, actividad().salas[1]!] });
    fireEvent.click(m.container.querySelector('[aria-label="Bajar pista 1"]'));
    expect(m.ultimo().salas[0]!.pistas).toEqual(['dos', 'uno']);
    fireEvent.click(m.container.querySelector('[aria-label="Eliminar pista 2"]'));
    expect(m.ultimo().salas[0]!.pistas).toEqual(['uno']);
  });

  it('el rótulo del tipo de respuesta', () => {
    expect(tipoRespuestaLabel('texto')).toBe('Texto');
  });
});

describe('EscapeRoomActivityEditor — envoltorio del lienzo', () => {
  function montarLienzo(props: Record<string, unknown> = {}) {
    const onChange = vi.fn();
    const r = render(
      <EscapeRoomActivityEditor
        editorSyncKey="k"
        activity={actividad()}
        canvasLayout={false}
        isSelected={false}
        onChange={onChange}
        {...props}
      />,
    );
    return { onChange, ...r };
  }

  it('muestra la cabecera con el número de salas y el botón de diseñar deshabilitado', () => {
    montarLienzo();
    expect(screen.getByText('Escape room')).toBeTruthy();
    expect(screen.getByText('2 salas')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Diseñar Escape Room/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('una edición se guarda con retraso (450 ms), normalizada', () => {
    const { onChange } = montarLienzo();
    fireEvent.change(screen.getByPlaceholderText('Nombre de la actividad'), { target: { value: 'Nuevo' } });
    expect(onChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(449));
    expect(onChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ tipo: 'escape_room', titulo: 'Nuevo' });
  });

  it('salir de un campo guarda de inmediato (flush)', () => {
    const { onChange } = montarLienzo();
    const campo = screen.getByPlaceholderText('Nombre de la actividad');
    fireEvent.change(campo, { target: { value: 'Ya' } });
    fireEvent.blur(campo);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].titulo).toBe('Ya');
  });

  /** El botón de quitar del encabezado: el único de papelera sin `aria-label`. */
  const botonQuitar = (c: HTMLElement) =>
    Array.from(c.querySelectorAll('button')).find(
      (b) => !b.getAttribute('aria-label') && /trash/.test(b.querySelector('svg')?.getAttribute('class') ?? ''),
    );

  it('el botón de quitar solo existe si hay onRemove, guarda lo pendiente y quita', () => {
    const sin = montarLienzo();
    expect(botonQuitar(sin.container)).toBeUndefined();
    cleanup();
    const onRemove = vi.fn();
    const { onChange, container } = montarLienzo({ onRemove });
    fireEvent.change(screen.getByPlaceholderText('Nombre de la actividad'), { target: { value: 'Z' } });
    fireEvent.click(botonQuitar(container)!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].titulo).toBe('Z');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('en el lienzo (canvasLayout) no lleva marco propio', () => {
    const { container } = montarLienzo({ canvasLayout: true });
    expect((container.firstElementChild as HTMLElement).className).toContain('border-0');
  });
});
