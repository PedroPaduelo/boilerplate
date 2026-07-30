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
  // URL pública do FRONTEND — usada para montar links de compartilhamento de
  // dashboards (ex.: `${WEB_APP_URL}/public/<token>`) enviados pelo WhatsApp.
  WEB_APP_URL: z.string().url().default('https://boilerplate-fe-cmqg5udk.cloud.serendiped.com'),
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

  // Rate limit global (@fastify/rate-limit): requisições por janela e tamanho
  // da janela. Vira env (e não constante no server.ts) porque o teto certo
  // depende do ambiente — atrás de um proxy, com uma SPA que dispara dezenas de
  // chamadas por tela, o valor antigo (100/min) estourava com uso normal e
  // devolvia 429 para quem só estava navegando.
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

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
  // pg-runner connect timeout
  PG_RUNNER_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // gateway-runner — conexões do tipo API_GATEWAY (HTTP read-only).
  // Timeout por requisição ao gateway. 65s por padrão: um pouco ACIMA do teto
  // típico de query do gateway (60s), para que quem responda "sua query
  // estourou 60s" seja ele — com a causa — em vez de nós abortarmos antes e
  // reportarmos um timeout genérico de rede.
  GATEWAY_TIMEOUT_MS: z.coerce.number().int().positive().default(65000),
  // Timeout dos pings/health (não tocam o banco): falha rápido, porque é o
  // caminho que diagnostica "o gateway está no ar?".
  GATEWAY_HEALTH_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // Agent de IA (motor do agente integrado)
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional().or(z.literal('')),
  AI_MODEL: z.string().default('claude-sonnet-4-20250514'),
  /// Teto de tokens de SAÍDA por requisição ao modelo. Sem isto, o provider usa
  /// o default do modelo (claude-sonnet-4 = 64000) e provedores/proxies com teto
  /// menor rejeitam a chamada com 400 ("max_tokens ... should be less than or
  /// equal to N"). 32768 é compatível com o proxy interno; ajuste conforme o
  /// provider em uso.
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(32768),

  // WhatsApp via Evolution API (opcional — sem as 3, o endpoint
  // /webhooks/evolution responde 503 e a integração fica desabilitada).
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_INSTANCE: z.string().optional(),
  EVOLUTION_APIKEY: z.string().optional(),
  // Secret opcional do webhook (header `x-channel-secret`). Se setado, a rota
  // compara o header com este valor antes de processar. Vazio = sem gate.
  CHANNELS_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * As 3 envs obrigatórias da Evolution API estão setadas?
 *
 * Centraliza o gate de habilitação: a rota `/webhooks/evolution` usa isto pra
 * devolver 503 quando a integração não está configurada (fail-closed) e o
 * `evolutionClient` evita requests que virariam 404/401.
 */
export function isEvolutionEnabled(): boolean {
  return Boolean(env.EVOLUTION_API_URL && env.EVOLUTION_INSTANCE && env.EVOLUTION_APIKEY);
}

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:\n',
    _env.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
