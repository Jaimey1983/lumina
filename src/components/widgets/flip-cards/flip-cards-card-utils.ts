import type { FlipCardCara, FlipCardElementPos } from '@/types/slide.types';

import type {
  FlipCardsCaraConfig,
  FlipCardsCaraLado,
  FlipCardsConfiguracionCompleta,
} from './flip-cards-config';

export const DEFAULT_TITULO_POS: FlipCardElementPos = { x: 10, y: 14 };
export const DEFAULT_CUERPO_POS: FlipCardElementPos = { x: 10, y: 42 };

export function resolveCaraVisibilidad(
  configuracion: FlipCardsConfiguracionCompleta,
  lado: FlipCardsCaraLado,
  cara: FlipCardCara,
): FlipCardsCaraConfig {
  const global = lado === 'frente' ? configuracion.frente : configuracion.reverso;
  return {
    mostrarImagen: cara.mostrarImagen ?? global.mostrarImagen,
    mostrarTitulo: cara.mostrarTitulo ?? global.mostrarTitulo,
    mostrarCuerpo: cara.mostrarCuerpo ?? global.mostrarCuerpo,
  };
}

export function resolveTextPos(
  cara: FlipCardCara,
  field: 'titulo' | 'cuerpo',
): FlipCardElementPos {
  const base = field === 'titulo' ? DEFAULT_TITULO_POS : DEFAULT_CUERPO_POS;
  const stored = field === 'titulo' ? cara.tituloPos : cara.cuerpoPos;
  return { x: stored?.x ?? base.x, y: stored?.y ?? base.y };
}

export function clampCardPos(x: number, y: number): FlipCardElementPos {
  return {
    x: Math.max(2, Math.min(92, Math.round(x * 10) / 10)),
    y: Math.max(2, Math.min(92, Math.round(y * 10) / 10)),
  };
}

export function cardSelectionFace(
  selection: { kind: string; cardId?: string; face?: FlipCardsCaraLado } | null | undefined,
  fallback: FlipCardsCaraLado = 'frente',
): FlipCardsCaraLado | null {
  if (!selection) return null;
  if (selection.kind === 'card-text' || selection.kind === 'card-image') {
    return selection.face ?? fallback;
  }
  if (selection.kind === 'card' && 'face' in selection && selection.face) {
    return selection.face;
  }
  return null;
}

export function cardSelectionId(
  selection: { kind: string; cardId?: string } | null | undefined,
): string | null {
  if (!selection) return null;
  if (
    selection.kind === 'card' ||
    selection.kind === 'card-text' ||
    selection.kind === 'card-image'
  ) {
    return selection.cardId ?? null;
  }
  return null;
}
