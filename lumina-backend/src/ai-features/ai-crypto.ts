import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from 'crypto';

const ALGO = 'aes-256-gcm';
const V1 = 'v1';
const V2 = 'v2';
const HKDF_INFO = 'lumina-teacher-ai-key-v2';
const MIN_SECRET_LEN = 32;

export const AI_KEYS_MIN_SECRET_LEN = MIN_SECRET_LEN;

export type CryptoAad = { userId: string; provider: string };

export function isStrongMasterSecret(secret: string | undefined): boolean {
  const s = secret?.trim() ?? '';
  if (s.length < MIN_SECRET_LEN) return false;
  const lowered = s.toLowerCase();
  if (lowered.includes('cambiar_en_produccion')) return false;
  if (lowered === 'changeme' || lowered.includes('your_secret')) return false;
  return true;
}

function aadBuffer(aad: CryptoAad): Buffer {
  return Buffer.from(`${aad.userId}\0${aad.provider}`, 'utf8');
}

function deriveKeyV1(masterSecret: string): Buffer {
  return createHash('sha256').update(masterSecret, 'utf8').digest();
}

function deriveKeyV2(masterSecret: string, salt: Buffer): Buffer {
  return Buffer.from(hkdfSync('sha256', masterSecret, salt, HKDF_INFO, 32));
}

/** Hint para UI: no revela sufijo si la clave es corta (evitar filtrar la mitad). */
export function apiKeyHint(plainKey: string): string {
  const trimmed = plainKey.trim();
  if (trimmed.length < 16) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

export function assertSafeApiKey(plainKey: string): void {
  for (let i = 0; i < plainKey.length; i++) {
    const code = plainKey.charCodeAt(i);
    if ((code >= 0 && code <= 0x1f) || code === 0x7f) {
      throw new Error('La clave contiene caracteres no permitidos');
    }
  }
  if (/\s/.test(plainKey)) {
    throw new Error('La clave no debe contener espacios');
  }
}

/** Quita secretos de mensajes de error / logs. */
export function redactSecrets(
  text: string,
  secrets: Array<string | undefined>,
): string {
  let out = text;
  for (const secret of secrets) {
    if (!secret || secret.length < 4) continue;
    out = out.split(secret).join('[redacted]');
    try {
      const encoded = encodeURIComponent(secret);
      if (encoded !== secret) out = out.split(encoded).join('[redacted]');
    } catch {
      /* ignore */
    }
  }
  return out;
}

/**
 * Cifra una API key (v2): AES-256-GCM + HKDF-SHA256 + AAD (userId|provider).
 * Formato: v2:<salt_b64>:<iv_b64>:<tag_b64>:<ciphertext_b64>
 */
export function encryptApiKey(
  plainKey: string,
  masterSecret: string,
  aad: CryptoAad,
): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, deriveKeyV2(masterSecret, salt), iv);
  cipher.setAAD(aadBuffer(aad));
  const encrypted = Buffer.concat([
    cipher.update(plainKey, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    V2,
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptApiKey(
  payload: string,
  masterSecret: string,
  aad: CryptoAad,
): string {
  try {
    const parts = payload.split(':');
    if (parts[0] === V2 && parts.length === 5) {
      return decryptV2(parts, masterSecret, aad);
    }
    if (parts[0] === V1 && parts.length === 4) {
      return decryptV1(parts, masterSecret);
    }
  } catch {
    /* mensaje uniforme: no distinguir tamper vs formato */
  }
  throw new Error('No se pudo descifrar la clave');
}

function decryptV2(
  parts: string[],
  masterSecret: string,
  aad: CryptoAad,
): string {
  const [, saltB64, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(
    ALGO,
    deriveKeyV2(masterSecret, Buffer.from(saltB64, 'base64')),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAAD(aadBuffer(aad));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** Compatibilidad con claves guardadas antes del endurecimiento. */
function decryptV1(parts: string[], masterSecret: string): string {
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(
    ALGO,
    deriveKeyV1(masterSecret),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
