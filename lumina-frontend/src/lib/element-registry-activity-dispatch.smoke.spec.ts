import { describe, expect, it } from 'vitest';

import type { Activity } from '@/types/slide.types';

import type { ActivityRuntimeConfig } from './activity-runtime-config';
import { elementRegistry } from './element-registry-bootstrap';

/** 22 actividades de E2 que E5.5 despacha vía registry (no el switch congelado). */
const ACTIVITY_TIPOS = [
  'quiz_multiple',
  'verdadero_falso',
  'completar_blancos',
  'arrastrar_soltar',
  'emparejar',
  'ordenar_pasos',
  'video_interactivo',
  'short_answer',
  'encuesta_viva',
  'nube_palabras',
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'sopa_letras',
  'crucigrama',
  'abrir_caja',
  'anagrama',
  'ahorcado',
  'puzzle_palabras',
  'globos',
  'topo',
  'historia_ramificada',
] as const;

describe('elementRegistry activity dispatch (E5.5)', () => {
  it.each(ACTIVITY_TIPOS)(
    '%s está registrado con Editor/Viewer/Propiedades',
    (tipo) => {
      const def = elementRegistry.obtener<Activity, ActivityRuntimeConfig>(tipo);
      expect(def).toBeDefined();
      expect(def?.Editor).toEqual(expect.any(Function));
      expect(def?.Viewer).toEqual(expect.any(Function));
      expect(def?.Propiedades).toEqual(expect.any(Function));
    },
  );
});
