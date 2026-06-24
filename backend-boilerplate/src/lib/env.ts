import dotenv from 'dotenv';
dotenv.config({ override: true });

import z from 'zod';

/**
 * Aceita a chave de cifragem em base64 ou hex e exige que decodifique para
 * exatamente 32 bytes (AES-256). Exportada para reuso por `lib/crypto`.
 */
export function decodeEncryptionKey(raw: string): Buffer {
  const trimmed = raw.trim();

  // hex: 64 chars [0-9a-f]
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // base64 / base64url
  const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const buf = Buffer.from(normalized, 'base64');
  if (buf.length === 32) {
    return buf;
  }

  throw new Error(
    'CONNECTION_ENC_KEY must decode to 32 bytes (use 32-byte base64 or 64-char hex)'
  );
}

function isValidEncryptionKey(raw: string): boolean {
  try {
    decodeEncryptionKey(raw);
    return true;
  } catch {
    return false;
  }
}

export const envSchema = z.object({
  // Application
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  BASE_URL: z.string().url().default('http://localhost:4000'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_PORT: z.coerce.number().default(6379),

  // Upload
  UPLOAD_DIR: z.string().optional(),
  MAX_FILE_SIZE: z.coerce.number().default(104857600), // 100MB
  UPLOAD_TIMEOUT: z.coerce.number().default(120000), // 2min

  // Security
  CORS_ORIGINS: z.string().optional(),
  SWAGGER_USER: z.string().optional(),
  SWAGGER_PASSWORD: z.string().optional(),

  // Connections — chave de cifragem das credenciais (AES-256-GCM).
  // 32 bytes em base64 (ex.: `openssl rand -base64 32`) ou 64 chars hex.
  CONNECTION_ENC_KEY: z
    .string({ required_error: 'CONNECTION_ENC_KEY is required' })
    .refine(isValidEncryptionKey, {
      message:
        'CONNECTION_ENC_KEY must decode to 32 bytes (use 32-byte base64 or 64-char hex)',
    }),

  // pg-runner — guardrails de execução de query contra bancos externos.
  // Timeout (ms) aplicado no Postgres remoto via `SET LOCAL statement_timeout`.
  // Default 30s: dashboards ANALÍTICOS sobre tabelas grandes (milhões de linhas
  // sem índice no filtro) legitimamente levam 8-15s; um teto de 15s causava
  // falso-timeout. O row cap (PG_RUNNER_MAX_ROWS) e a transação read-only
  // protegem contra runaway. Queries bem escritas (agregação/FILTER, sem
  // COUNT(DISTINCT)/GROUP BY redundante) ficam bem abaixo deste teto.
  PG_RUNNER_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  // Limite máximo de linhas retornadas (row cap) — o runner para de buscar após isto.
  PG_RUNNER_MAX_ROWS: z.coerce.number().int().positive().default(50000),
  // Tamanho máximo do pool por conexão externa.
  // IMPORTANTE: deve ser >= QUERY_EXEC_WORKER_CONCURRENCY. Cada query do worker
  // segura UMA conexão do pool por toda a sua duração (BEGIN→SET→cursor→ROLLBACK);
  // se o worker processa N jobs em paralelo, precisa de N conexões livres, senão
  // os jobs excedentes morrem com "timeout exceeded when trying to connect" (o
  // pool não é o banco — é client-side). O worker faz o clamp defensivo, mas o
  // certo é manter este teto >= a concorrência configurada.
  PG_RUNNER_POOL_MAX: z.coerce.number().int().positive().default(8),
  // Quantos jobs de execução de query o worker BullMQ processa EM PARALELO por
  // dashboard/published. Mantenha <= PG_RUNNER_POOL_MAX (ver nota acima). Valor
  // conservador por padrão para não martelar o Postgres externo com muitas
  // queries pesadas simultâneas. 6 aproveita melhor o pool (8) no carregamento
  // do dashboard publicado, deixando folga para o snapshot/preview.
  QUERY_EXEC_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(6),
  // Tempo (ms) que uma conexão ociosa do pool externo é mantida antes de fechar.
  PG_RUNNER_IDLE_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(30000),
  // Timeout (ms) para adquirir uma conexão do pool (e estabelecer o TCP). 30s:
  // em PICOS de concorrência (várias fontes pedindo conexão — worker + preview +
  // snapshot), as execuções ESPERAM a vez no pool em vez de FALHAR com
  // "timeout exceeded when trying to connect". O pool do pg é o limitador global.
  PG_RUNNER_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
});

export type Env = z.infer<typeof envSchema>;

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:\n',
    _env.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
