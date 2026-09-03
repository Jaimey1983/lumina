import { describe, expect, it } from 'vitest';

import {
  bloquesVisiblesDeSala,
  salaTieneLienzo,
} from '@/components/viewers/escape-room-viewer';
import { normalizeSala } from '@/components/editor/activities/escape-room-editor';
import type { Block, EscapeRoomSala } from '@/types/slide.types';

const base = {
  id: 'sala-1',
  nombre: 'Sala',
  descripcion: '',
  desafio: '',
  tipoRespuesta: 'texto' as const,
  respuestaCorrecta: 'H2O',
  ignorarMayusculas: true,
  intentosMaximos: 3,
};

const texto: Block = { tipo: 'texto', contenido: 'Pista visual' } as Block;
const imagen: Block = { tipo: 'imagen', url: 'https://example.com/p.png' } as Block;

function sala(over: Partial<EscapeRoomSala> = {}): EscapeRoomSala {
  return normalizeSala({ ...base, ...over });
}

describe('lienzo de sala en el viewer', () => {
  it('una sala legacy sin bloques no tiene lienzo', () => {
    expect(salaTieneLienzo(sala())).toBe(false);
    expect(bloquesVisiblesDeSala(sala())).toEqual([]);
  });

  it('una sala con bloques visuales sí lo tiene', () => {
    const conLienzo = sala({ bloques: [texto, imagen] });

    expect(salaTieneLienzo(conLienzo)).toBe(true);
    expect(bloquesVisiblesDeSala(conLienzo)).toHaveLength(2);
  });

  it('los bloques de actividad no cuentan como lienzo: el acertijo lo sirve el viewer', () => {
    const actividad = { tipo: 'actividad', actividad: { tipo: 'quiz_multiple' } } as unknown as Block;

    expect(salaTieneLienzo(sala({ bloques: [actividad] }))).toBe(false);
    expect(bloquesVisiblesDeSala(sala({ bloques: [actividad, texto] }))).toEqual([texto]);
  });

  it('el fondo por sí solo no fuerza lienzo (sala 1.0 con tema)', () => {
    expect(salaTieneLienzo(sala({ fondo: { tipo: 'color', valor: '#000' } }))).toBe(false);
  });

  it('`normalizeSala` conserva bloques y fondo del diseñador', () => {
    const normalizada = sala({ bloques: [texto], fondo: { tipo: 'color', valor: '#1e1b4b' } });

    expect(normalizada.bloques).toEqual([texto]);
    expect(normalizada.fondo).toEqual({ tipo: 'color', valor: '#1e1b4b' });
  });
});
