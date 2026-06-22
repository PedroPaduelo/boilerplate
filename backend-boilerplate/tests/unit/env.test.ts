import { randomBytes } from 'node:crypto';
import { envSchema, decodeEncryptionKey } from '@/lib/env';

const VALID_KEY = randomBytes(32).toString('base64');

function baseEnv(overrides: Record<string, unknown> = {}) {
  return {
    JWT_SECRET: 'x'.repeat(32),
    DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    REDIS_URL: 'localhost',
    CONNECTION_ENC_KEY: VALID_KEY,
    ...overrides,
  };
}

describe('envSchema', () => {
  it('parses a valid environment and applies pg-runner defaults', () => {
    const result = envSchema.safeParse(baseEnv());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PG_RUNNER_STATEMENT_TIMEOUT_MS).toBe(15000);
      expect(result.data.PG_RUNNER_MAX_ROWS).toBe(50000);
      expect(result.data.PG_RUNNER_POOL_MAX).toBe(3);
    }
  });

  it('fails clearly when CONNECTION_ENC_KEY is missing', () => {
    const env = baseEnv();
    delete (env as Record<string, unknown>).CONNECTION_ENC_KEY;
    const result = envSchema.safeParse(env);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.CONNECTION_ENC_KEY).toBeDefined();
    }
  });

  it('fails when CONNECTION_ENC_KEY has the wrong size', () => {
    const result = envSchema.safeParse(
      baseEnv({ CONNECTION_ENC_KEY: randomBytes(16).toString('base64') })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.CONNECTION_ENC_KEY).toBeDefined();
    }
  });

  it('coerces pg-runner numeric overrides from strings', () => {
    const result = envSchema.safeParse(
      baseEnv({ PG_RUNNER_MAX_ROWS: '100', PG_RUNNER_STATEMENT_TIMEOUT_MS: '5000' })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PG_RUNNER_MAX_ROWS).toBe(100);
      expect(result.data.PG_RUNNER_STATEMENT_TIMEOUT_MS).toBe(5000);
    }
  });
});

describe('decodeEncryptionKey (re-exported via env)', () => {
  it('decodes a valid base64 key to 32 bytes', () => {
    expect(decodeEncryptionKey(VALID_KEY).length).toBe(32);
  });
});
