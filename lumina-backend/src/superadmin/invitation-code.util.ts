import { randomBytes } from 'node:crypto';

// Alfabeto sin caracteres ambiguos (I, L, O, U, 0, 1).
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

/** Código de invitación legible: `XXXX-XXXX-XXXX` (12 símbolos, ~57 bits). */
export function generateInvitationCode(): string {
  const bytes = randomBytes(12);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}
