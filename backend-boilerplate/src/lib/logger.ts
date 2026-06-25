/**
 * Logger minimal pino-compatible — usado fora do escopo Fastify (services,
 * libs, helpers) onde `app.log` não está disponível. Em produção o Fastify
 * já tem seu próprio logger (pino) — não duplicar contexto aqui.
 *
 * Signature compatível com `pino` (usado em `server.ts`):
 *   logger.error({ key: 'value' }, 'message');
 *   logger.warn(obj, 'message');
 *   logger.info(obj, 'message');
 *   logger.debug(obj, 'message');
 *
 * Saída: JSON-line em stdout (mesma forma que pino em dev). Em testes, é
 * silencioso por padrão (LOG_LEVEL=silent) — testes que validam logs podem
 * setar LOG_LEVEL=info via env.
 *
 * Por que NÃO importar pino direto: ele é dep transitiva do Fastify e
 * adicionar como dep própria só pra um helper seria exagero. Console + JSON
 * é o suficiente para os módulos de canais.
 */
type LogObj = Record<string, unknown> | Error | unknown;
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

function envLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  const valid: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
  return (valid.includes(raw as LogLevel) ? raw : 'info') as LogLevel;
}

const LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
  silent: Infinity,
};

const currentLevel = LEVELS[envLevel()];

function emit(level: LogLevel, obj: LogObj | undefined, msg: string | undefined): void {
  // pino-like: só emite se o nível da mensagem for >= o threshold configurado.
  // Níveis menores (trace=10, debug=20) são MAIS verbosos; com LOG_LEVEL=info
  // (30), uma msg debug (20) é suprimida (20 < 30).
  if (LEVELS[level] < currentLevel) return;
  const record: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
  };
  if (obj instanceof Error) {
    record.err = { name: obj.name, message: obj.message, stack: obj.stack };
  } else if (obj && typeof obj === 'object') {
    Object.assign(record, obj as Record<string, unknown>);
  }
  if (msg) record.msg = msg;
  // linha JSON por entry (mesma forma do pino em dev mode)
  console.log(JSON.stringify(record));
}

function make(level: LogLevel) {
  return (obj?: LogObj, msg?: string) => emit(level, obj, msg);
}

export const logger = {
  fatal: make('fatal'),
  error: make('error'),
  warn: make('warn'),
  info: make('info'),
  debug: make('debug'),
  trace: make('trace'),
  silent: () => {},
};

export type Logger = typeof logger;
