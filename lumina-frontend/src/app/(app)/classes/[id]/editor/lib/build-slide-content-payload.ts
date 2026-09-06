import { isAxiosError } from 'axios';

import type { Slide } from '@/types/slide.types';

import type { EditorSlideState } from './editor-slide-state';

/** Toast / mensaje de 409: rebase al servidor, nunca last-write-wins silencioso. */
export const SLIDE_VERSION_CONFLICT_MESSAGE =
  'Este slide se modificó en otra sesión. Se recargó la versión del servidor.';

export type SlideContentExtras = {
  diseno?: Slide['diseno'];
};

/**
 * Serializa el `content` mínimo desde el estado del reducer (E5.4).
 * No incluye selección, marquee ni flags de UI.
 */
export function buildSlideContentPayload(
  state: Pick<EditorSlideState, 'bloques' | 'fondo' | 'guias' | 'transicion'>,
  extras?: SlideContentExtras,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    bloques: state.bloques,
    guias: state.guias,
  };
  if (state.fondo !== undefined) payload.fondo = state.fondo;
  if (extras?.diseno) payload.diseno = extras.diseno;
  if (state.transicion !== undefined) payload.transicion = state.transicion;
  return payload;
}

export function parseContentVersion(data: unknown): number | undefined {
  return readIntegerField(data, 'contentVersion');
}

function readIntegerField(
  data: unknown,
  field: 'contentVersion' | 'currentVersion',
): number | undefined {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const raw = (data as Record<string, unknown>)[field];
  return typeof raw === 'number' && Number.isInteger(raw) ? raw : undefined;
}

function readCurrentVersionFromUnknown(data: unknown): number | undefined {
  const direct = readIntegerField(data, 'currentVersion');
  if (direct !== undefined) return direct;
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  return readIntegerField((data as Record<string, unknown>).message, 'currentVersion');
}

/** Extrae `currentVersion` del body Nest (objeto plano o `{ message: { currentVersion } }`). */
export function parseSlideVersionConflict(body: unknown): {
  currentVersion?: number;
} | null {
  const currentVersion = readCurrentVersionFromUnknown(body);
  if (currentVersion === undefined) return null;
  return { currentVersion };
}

export function isAxiosSlideVersionConflict(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 409;
}

export function axiosSlideConflictVersion(err: unknown): number | undefined {
  if (!isAxiosSlideVersionConflict(err) || !isAxiosError(err)) return undefined;
  return parseSlideVersionConflict(err.response?.data)?.currentVersion;
}
