/**
 * lib/crypto — cifragem simétrica AES-256-GCM.
 *
 * Usada para cifrar/decifrar at-rest as senhas das Connections externas
 * (campo `Connection.passwordCipher`). Esta lib é a FONTE ÚNICA do formato
 * de ciphertext do projeto — qualquer código que precise cifrar/decifrar
 * credenciais deve usar `encrypt`/`decrypt` daqui.
 *
 * Formato do ciphertext (string base64): `iv | authTag | ciphertext`
 *   - iv:      12 bytes (aleatório por encrypt → mesmo plaintext gera ciphers
 *              diferentes)
 *   - authTag: 16 bytes (GCM — garante integridade/autenticidade)
 *   - ciphertext: restante
 *
 * Chave: 32 bytes (AES-256), vinda de `env.CONNECTION_ENC_KEY` (base64 ou hex),
 * validada no boot por `lib/env`.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { decodeEncryptionKey, env } from './env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes — recomendado para GCM
const AUTH_TAG_LENGTH = 16; // bytes

/** Erro lançado em falhas de cifragem/decifragem (ex.: authTag inválido). */
export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

/**
 * Cifra `plaintext` com a `key` informada (32 bytes). IV aleatório por chamada.
 * Use preferencialmente `encrypt`, que resolve a chave do env.
 */
export function encryptWithKey(key: Buffer, plaintext: string): string {
  if (key.length !== 32) {
    throw new CryptoError('encryption key must be 32 bytes (AES-256)');
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

/**
 * Decifra um payload no formato `base64(iv | authTag | ciphertext)` com a `key`
 * informada. Lança `CryptoError` se o formato for inválido ou o authTag não
 * bater (dado adulterado / chave errada).
 */
export function decryptWithKey(key: Buffer, payload: string): string {
  if (key.length !== 32) {
    throw new CryptoError('encryption key must be 32 bytes (AES-256)');
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(payload, 'base64');
  } catch {
    throw new CryptoError('invalid ciphertext encoding');
  }

  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new CryptoError('invalid ciphertext: too short');
  }

  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    // Não vaza detalhe do erro de baixo nível (pode conter material sensível).
    throw new CryptoError('decryption failed: invalid key or corrupted data');
  }
}

// Chave resolvida do env, cacheada após o primeiro uso.
let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = decodeEncryptionKey(env.CONNECTION_ENC_KEY);
  }
  return cachedKey;
}

/** Cifra `plaintext` usando a chave do env (`CONNECTION_ENC_KEY`). */
export function encrypt(plaintext: string): string {
  return encryptWithKey(getKey(), plaintext);
}

/** Decifra um payload usando a chave do env (`CONNECTION_ENC_KEY`). */
export function decrypt(payload: string): string {
  return decryptWithKey(getKey(), payload);
}
