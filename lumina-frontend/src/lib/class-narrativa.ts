// ─── Utilidades para Misión / Quest (Metadatos Narrativos) ───────────────────
// Capa 10 (PLAN_ACCION_DIAGRAMAS_GRAFICOS §4.5 & D-DG-06).

import type { ClassNarrativeMeta } from '@/types/slide.types';

/**
 * Normaliza y sanitiza metadatos narrativos de una clase.
 * Retorna `null` si no hay contenido válido (preservando estado limpio).
 */
export function normalizeClassNarrativeMeta(raw: unknown): ClassNarrativeMeta | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;

  const nombreMision =
    typeof data.nombreMision === 'string' && data.nombreMision.trim().length > 0
      ? data.nombreMision.trim()
      : undefined;

  const rawFragmentos = Array.isArray(data.fragmentosHistoria)
    ? data.fragmentosHistoria
    : [];

  const fragmentosHistoria: string[] = [];
  for (const f of rawFragmentos) {
    if (typeof f === 'string' && f.trim().length > 0) {
      fragmentosHistoria.push(f.trim());
    }
  }

  if (!nombreMision && fragmentosHistoria.length === 0) {
    return null;
  }

  return {
    ...(nombreMision ? { nombreMision } : {}),
    ...(fragmentosHistoria.length > 0 ? { fragmentosHistoria } : {}),
  };
}

/**
 * Determina si una clase tiene una misión o narrativa configurada.
 */
export function hasNarrativaConfigurada(raw: unknown): boolean {
  return normalizeClassNarrativeMeta(raw) !== null;
}
