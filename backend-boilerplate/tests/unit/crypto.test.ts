import { randomBytes } from 'node:crypto';
import {
  CryptoError,
  decrypt,
  decryptWithKey,
  encrypt,
  encryptWithKey,
} from '@/lib/crypto';
import { decodeEncryptionKey } from '@/lib/env';

const KEY = randomBytes(32);

describe('crypto — encryptWithKey/decryptWithKey (AES-256-GCM)', () => {
  it('round-trip: decrypt(encrypt(x)) === x', () => {
    const plain = 'super-secret-password-123!@#';
    const cipher = encryptWithKey(KEY, plain);
    expect(decryptWithKey(KEY, cipher)).toBe(plain);
  });

  it('round-trip with unicode / empty string', () => {
    for (const plain of ['', 'açaí 🔐 café', 'a'.repeat(1000)]) {
      const cipher = encryptWithKey(KEY, plain);
      expect(decryptWithKey(KEY, cipher)).toBe(plain);
    }
  });

  it('ciphertext does not reveal the plaintext', () => {
    const plain = 'plaintextmarker';
    const cipher = encryptWithKey(KEY, plain);
    expect(cipher).not.toContain(plain);
  });

  it('two encrypts of the same plaintext produce different ciphertexts (random IV)', () => {
    const plain = 'same-input';
    const a = encryptWithKey(KEY, plain);
    const b = encryptWithKey(KEY, plain);
    expect(a).not.toBe(b);
    // mas ambos decifram para o mesmo valor
    expect(decryptWithKey(KEY, a)).toBe(plain);
    expect(decryptWithKey(KEY, b)).toBe(plain);
  });

  it('fails to decrypt with a different key', () => {
    const cipher = encryptWithKey(KEY, 'secret');
    const otherKey = randomBytes(32);
    expect(() => decryptWithKey(otherKey, cipher)).toThrow(CryptoError);
  });

  it('fails to decrypt when the authTag/ciphertext was tampered with', () => {
    const cipher = encryptWithKey(KEY, 'secret-value');
    const buf = Buffer.from(cipher, 'base64');
    // adultera o último byte do ciphertext
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString('base64');
    expect(() => decryptWithKey(KEY, tampered)).toThrow(CryptoError);
  });

  it('fails to decrypt when the IV was tampered with', () => {
    const cipher = encryptWithKey(KEY, 'secret-value');
    const buf = Buffer.from(cipher, 'base64');
    buf[0] ^= 0xff; // adultera o IV
    expect(() => decryptWithKey(KEY, buf.toString('base64'))).toThrow(CryptoError);
  });

  it('rejects ciphertext that is too short', () => {
    expect(() => decryptWithKey(KEY, Buffer.from('abc').toString('base64'))).toThrow(
      CryptoError
    );
  });

  it('rejects keys that are not 32 bytes', () => {
    expect(() => encryptWithKey(randomBytes(16), 'x')).toThrow(CryptoError);
    expect(() => decryptWithKey(randomBytes(16), 'x')).toThrow(CryptoError);
  });
});

describe('crypto — encrypt/decrypt (key from env)', () => {
  it('round-trips using the env-configured CONNECTION_ENC_KEY', () => {
    const plain = 'env-bound-secret';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });
});

describe('decodeEncryptionKey', () => {
  it('accepts a 32-byte base64 key', () => {
    const key = randomBytes(32).toString('base64');
    expect(decodeEncryptionKey(key).length).toBe(32);
  });

  it('accepts a 64-char hex key', () => {
    const key = randomBytes(32).toString('hex');
    expect(decodeEncryptionKey(key).length).toBe(32);
  });

  it('rejects keys that decode to the wrong size', () => {
    expect(() => decodeEncryptionKey(randomBytes(16).toString('base64'))).toThrow();
    expect(() => decodeEncryptionKey('not-a-valid-key')).toThrow();
  });
});
