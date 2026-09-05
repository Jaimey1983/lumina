/**
 * Fachada — la implementación real vive en `@lumina/scoring` (E2.1).
 *
 * Todos los consumidores del frontend importan `@/lib/activity-scoring`; este
 * archivo solo re-exporta el paquete para no reapuntar 24 imports de golpe.
 *
 * TODO(migración-etapa-5): borrar esta fachada y reapuntar los imports directos
 * a `@lumina/scoring` cuando E5 termine de unificar el estado del editor.
 * Ticket: LUM-E5-SCORING-FACADE · fecha objetivo: 2026-11-30.
 *
 * El espejo backend (`lumina-backend/src/classes/activity-scoring.ts`) todavía
 * es una copia manual; se reapunta a `@lumina/scoring` en E6.
 */
export * from '@lumina/scoring';
