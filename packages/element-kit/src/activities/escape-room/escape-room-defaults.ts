import type { EscapeRoomActivity } from '@lumina/types/slide';

import { normalizeEscapeRoomActivity } from './escape-room-normalize.js';

/** Escape room nuevo: las salas de ejemplo de `BLOCK_FALLBACKS`, ya normalizadas. */
export function createDefaultEscapeRoom(): EscapeRoomActivity {
  return normalizeEscapeRoomActivity(undefined);
}
