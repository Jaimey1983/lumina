import type { FlipCardCara, FlipCardElementPos } from '@/types/slide.types';

import type {
  FlipCardsCaraConfig,
  FlipCardsCaraLado,
  FlipCardsConfiguracionCompleta,
} from './flip-cards-config';

export {
  clampCardPos,
  clampWidgetPos,
  DEFAULT_CUERPO_POS,
  DEFAULT_TITULO_POS,
  resolveItemVisibilidad,
} from '@/components/widgets/shared/widget-slide-utils';

import {
  resolveItemVisibilidad,
  resolveTextPos as sharedResolveTextPos,
} from '@/components/widgets/shared/widget-slide-utils';

export function resolveCaraVisibilidad(
  configuracion: FlipCardsConfiguracionCompleta,
  lado: FlipCardsCaraLado,
  cara: FlipCardCara,
): FlipCardsCaraConfig {
  const global = lado === 'frente' ? configuracion.frente : configuracion.reverso;
  return resolveItemVisibilidad(global, cara);
}

export function resolveTextPos(
  cara: FlipCardCara,
  field: 'titulo' | 'cuerpo',
): FlipCardElementPos {
  return sharedResolveTextPos(cara, field);
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
