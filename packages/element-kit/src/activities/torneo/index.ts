/**
 * API pública de Torneo para consumidores del workspace (`@lumina/element-kit`, U11.1).
 */
export type { TorneoActivity } from '@lumina/types/slide';
export { TorneoViewer, type TorneoAnswerPayload, type TorneoRankingRow, type TorneoViewerProps } from './torneo-viewer.js';
export { createDefaultTorneo } from './torneo-defaults.js';
export { TorneoActivityEditor, normalizeTorneo } from './torneo-editor.js';
