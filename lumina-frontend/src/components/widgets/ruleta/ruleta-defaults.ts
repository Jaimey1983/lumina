import type { ActivityBlock, BlockMarco, RuletaActivity } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { RuletaWidget } from '@/types/widget.types';

import {
  RULETA_COLORES_DEFAULT,
  RULETA_MAX_ITEMS,
  RULETA_MIN_ITEMS,
} from './ruleta-config';

export const DEFAULT_RULETA_DURACION = 3000;

function clampItems(
  items: RuletaWidget['items'] | undefined,
): RuletaWidget['items'] {
  const raw = Array.isArray(items) ? items : [];
  const cleaned = raw
    .filter((item) => item && typeof item === 'object')
    .map((item, i) => ({
      id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `i-${i + 1}`,
      texto: typeof item.texto === 'string' ? item.texto : `Elemento ${i + 1}`,
    }));
  if (cleaned.length >= RULETA_MIN_ITEMS) {
    return cleaned.slice(0, RULETA_MAX_ITEMS);
  }
  return [
    { id: 'i-1', texto: 'Equipo 1' },
    { id: 'i-2', texto: 'Equipo 2' },
    { id: 'i-3', texto: 'Equipo 3' },
    { id: 'i-4', texto: 'Equipo 4' },
    { id: 'i-5', texto: 'Equipo 5' },
    { id: 'i-6', texto: 'Equipo 6' },
  ];
}

function normalizeConfig(
  config: Partial<RuletaActivity['configuracion']> | undefined,
): RuletaWidget['configuracion'] {
  const colores = Array.isArray(config?.colores)
    ? config.colores.filter((c): c is string => typeof c === 'string' && c.length > 0)
    : [];
  const duracion = Number(config?.duracionGiro);
  return {
    colores: colores.length > 0 ? colores : [...RULETA_COLORES_DEFAULT],
    sonido: Boolean(config?.sonido),
    duracionGiro:
      Number.isFinite(duracion) && duracion >= 1000 ? duracion : DEFAULT_RULETA_DURACION,
    mostrarGanador: config?.mostrarGanador !== false,
  };
}

function isActivityRuletaBlock(
  input: unknown,
): input is ActivityBlock & { actividad: RuletaActivity } {
  if (!input || typeof input !== 'object') return false;
  const block = input as ActivityBlock;
  return (
    block.tipo === 'actividad' &&
    !!block.actividad &&
    (block.actividad as { tipo?: string }).tipo === 'ruleta'
  );
}

function isRuletaContent(input: unknown): input is RuletaActivity | RuletaWidget {
  if (!input || typeof input !== 'object') return false;
  return (input as { tipo?: string }).tipo === 'ruleta';
}

/** Hidrata widget nuevo, bloque `tipo: 'ruleta'` o actividad G4 legado. */
export function normalizeRuletaBlock(input: unknown): RuletaWidget {
  const fb = BLOCK_FALLBACKS.ruleta;

  if (isActivityRuletaBlock(input)) {
    const act = input.actividad;
    const marco = input.marco;
    return {
      tipo: 'ruleta',
      configuracion: normalizeConfig(act.configuracion),
      items: clampItems(act.items),
      x: marco?.izquierdaPct ?? fb.x,
      y: marco?.arribaPct ?? fb.y,
      ancho: marco?.anchoPct ?? fb.ancho,
      alto: marco?.altoPct ?? fb.alto,
      zIndex: (input as { zIndex?: number }).zIndex,
    };
  }

  const raw = isRuletaContent(input) ? input : ({} as Partial<RuletaWidget>);
  const pos = raw as Partial<RuletaWidget>;
  return {
    tipo: 'ruleta',
    configuracion: normalizeConfig(raw.configuracion),
    items: clampItems(raw.items),
    x: typeof pos.x === 'number' ? pos.x : fb.x,
    y: typeof pos.y === 'number' ? pos.y : fb.y,
    ancho: typeof pos.ancho === 'number' ? pos.ancho : fb.ancho,
    alto: typeof pos.alto === 'number' ? pos.alto : fb.alto,
    zIndex: pos.zIndex,
  };
}

export function createDefaultRuletaWidget(marco?: BlockMarco): RuletaWidget {
  const fb = BLOCK_FALLBACKS.ruleta;
  return normalizeRuletaBlock({
    tipo: 'ruleta',
    configuracion: {
      colores: [...RULETA_COLORES_DEFAULT],
      sonido: false,
      duracionGiro: DEFAULT_RULETA_DURACION,
      mostrarGanador: true,
    },
    items: [
      { id: 'i-1', texto: 'Equipo 1' },
      { id: 'i-2', texto: 'Equipo 2' },
      { id: 'i-3', texto: 'Equipo 3' },
      { id: 'i-4', texto: 'Equipo 4' },
      { id: 'i-5', texto: 'Equipo 5' },
      { id: 'i-6', texto: 'Equipo 6' },
    ],
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
  });
}

/** Fábrica G4 (tests / scoring). El editor nuevo usa `createDefaultRuletaWidget`. */
export function createDefaultRuleta(): RuletaActivity {
  const w = createDefaultRuletaWidget();
  return {
    tipo: 'ruleta',
    configuracion: w.configuracion,
    items: w.items,
  };
}

export function ruletaWidgetToActivity(widget: RuletaWidget): RuletaActivity {
  return {
    tipo: 'ruleta',
    configuracion: widget.configuracion,
    items: widget.items,
  };
}
