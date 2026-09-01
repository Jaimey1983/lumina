import { randomBytes } from 'node:crypto';

// Sin caracteres ambiguos.
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGIT = '23456789';
const ALL = LOWER + UPPER + DIGIT;

/** Contraseña temporal legible (14 chars, ≥1 minúscula, mayúscula y dígito). */
export function generateTemporaryPassword(): string {
  const bytes = randomBytes(14);
  const chars = [
    LOWER[bytes[0] % LOWER.length],
    UPPER[bytes[1] % UPPER.length],
    DIGIT[bytes[2] % DIGIT.length],
  ];
  for (let i = 3; i < 14; i++) chars.push(ALL[bytes[i] % ALL.length]);
  return chars.join('');
}
