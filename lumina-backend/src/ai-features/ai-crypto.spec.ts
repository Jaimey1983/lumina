import {
  createCipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import {
  apiKeyHint,
  assertSafeApiKey,
  decryptApiKey,
  encryptApiKey,
  isStrongMasterSecret,
  redactSecrets,
} from './ai-crypto';

const SECRET = 'test-master-secret-32-chars-ok!!';
const AAD = { userId: 'user-1', provider: 'OPENAI' };

function encryptV1(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    'aes-256-gcm',
    createHash('sha256').update(secret, 'utf8').digest(),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

describe('ai-crypto', () => {
  it('cifra v2 y descifra de forma simétrica', () => {
    const plain = 'sk-test-openai-key-abc123';
    const payload = encryptApiKey(plain, SECRET, AAD);
    expect(payload.startsWith('v2:')).toBe(true);
    expect(decryptApiKey(payload, SECRET, AAD)).toBe(plain);
  });

  it('produce ciphertext distinto en cada cifrado (salt+IV aleatorios)', () => {
    const a = encryptApiKey('same-key', SECRET, AAD);
    const b = encryptApiKey('same-key', SECRET, AAD);
    expect(a).not.toBe(b);
    expect(decryptApiKey(a, SECRET, AAD)).toBe('same-key');
    expect(decryptApiKey(b, SECRET, AAD)).toBe('same-key');
  });

  it('falla si el AAD no coincide (no se puede copiar la clave a otro usuario)', () => {
    const payload = encryptApiKey('secret-key', SECRET, AAD);
    expect(() =>
      decryptApiKey(payload, SECRET, { userId: 'otro', provider: 'OPENAI' }),
    ).toThrow();
    expect(() =>
      decryptApiKey(payload, SECRET, { userId: 'user-1', provider: 'CLAUDE' }),
    ).toThrow();
  });

  it('falla si el secreto no coincide o el payload se altera', () => {
    const payload = encryptApiKey('secret-key', SECRET, AAD);
    expect(() =>
      decryptApiKey(payload, 'otro-secreto-xxxx-32-chars-!!!!', AAD),
    ).toThrow();
    const parts = payload.split(':');
    parts[3] = Buffer.alloc(16, 7).toString('base64');
    expect(() => decryptApiKey(parts.join(':'), SECRET, AAD)).toThrow();
    expect(() => decryptApiKey('v0:a:b:c', SECRET, AAD)).toThrow();
  });

  it('sigue descifrando payloads v1 legacy', () => {
    const payload = encryptV1('legacy-key', SECRET);
    expect(decryptApiKey(payload, SECRET, AAD)).toBe('legacy-key');
  });

  it('apiKeyHint no revela sufijo si la clave es corta', () => {
    expect(apiKeyHint('shortkey')).toBe('••••');
    expect(apiKeyHint('sk-proj-abcdefghij')).toBe('••••ghij');
  });

  it('assertSafeApiKey rechaza control chars y espacios', () => {
    expect(() => assertSafeApiKey('sk-ok-sin-espacios-123')).not.toThrow();
    expect(() => assertSafeApiKey('sk test')).toThrow();
    expect(() => assertSafeApiKey('sk\ntest')).toThrow();
  });

  it('redactSecrets elimina la clave y su forma URL-encoded', () => {
    const key = 'sk-abc/def';
    const msg = `falló ${key} y ${encodeURIComponent(key)}`;
    expect(redactSecrets(msg, [key])).toBe('falló [redacted] y [redacted]');
  });

  it('isStrongMasterSecret exige 32+ y rechaza placeholders', () => {
    expect(isStrongMasterSecret('corto')).toBe(false);
    expect(isStrongMasterSecret('cambiar_en_produccion_min_16_chars_xxx')).toBe(
      false,
    );
    expect(isStrongMasterSecret(SECRET)).toBe(true);
  });
});
