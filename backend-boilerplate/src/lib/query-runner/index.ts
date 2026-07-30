/**
 * lib/query-runner — ponto ÚNICO de execução de query contra fonte externa.
 *
 * Existem dois transportes (`pg-runner` via TCP e `gateway-runner` via HTTP) e
 * um monte de chamadores que não deveriam se importar com qual é qual: o
 * executor de blocos, o worker da fila, o playground do chart, as rotas de
 * conexão e as tools do MCP fazem todos a mesma pergunta — "rode este SELECT e
 * me devolva linhas". Este módulo é quem responde, escolhendo o transporte pelo
 * formato da conexão.
 *
 * O tipo é DISCRIMINADO por `kind`, e `postgres` é o default implícito: assim
 * todo objeto `PgRunnerConnection` que já circulava no código (e nos testes)
 * continua valendo sem alteração.
 */
import {
  runQuery as runPgQuery,
  PgRunnerError,
  SqlGuardError,
  type PgRunnerConnection,
  type QueryResultShape,
  type RunQueryOptions,
} from '../pg-runner';
import {
  runGatewayQuery,
  GatewayRunnerError,
  type GatewayConnection,
} from '../gateway-runner';

export type { QueryResultShape, RunQueryOptions } from '../pg-runner';

/** Conexão Postgres (TCP). `kind` é opcional — este é o default histórico. */
export type PostgresTarget = PgRunnerConnection & { kind?: 'postgres' };

/** Conexão via gateway HTTP read-only. */
export type GatewayTarget = GatewayConnection & { kind: 'gateway' };

/** Qualquer fonte executável pela plataforma. */
export type RunnerConnection = PostgresTarget | GatewayTarget;

/** É uma conexão de gateway HTTP? */
export function isGatewayTarget(conn: RunnerConnection): conn is GatewayTarget {
  return (conn as GatewayTarget).kind === 'gateway';
}

/**
 * Erros que representam "a query/fonte externa falhou" — e que, por isso, viram
 * `400` na API em vez de `500`.
 *
 * Sem este predicado cada rota precisaria listar as três classes à mão, e a
 * classe nova (gateway) seria esquecida em alguma delas — o sintoma seria um
 * "Internal server error" opaco no lugar de "Somente comandos de leitura são
 * permitidos". Um lugar só para lembrar.
 */
export function isExternalQueryError(
  err: unknown
): err is SqlGuardError | PgRunnerError | GatewayRunnerError {
  return (
    err instanceof SqlGuardError ||
    err instanceof PgRunnerError ||
    err instanceof GatewayRunnerError
  );
}

/**
 * Executa uma query read-only contra a fonte, seja ela qual for.
 * Lança `SqlGuardError` (guardrail de SQL), `PgRunnerError` (Postgres) ou
 * `GatewayRunnerError` (gateway HTTP).
 */
export async function runQuery(
  connection: RunnerConnection,
  sql: string,
  options: RunQueryOptions = {}
): Promise<QueryResultShape> {
  if (isGatewayTarget(connection)) {
    return runGatewayQuery(connection, sql, {
      params: options.params,
      maxRows: options.maxRows,
      // `statementTimeoutMs` é o vocabulário do Postgres; para o gateway o que
      // existe é o timeout da requisição HTTP.
      timeoutMs: options.statementTimeoutMs,
    });
  }
  return runPgQuery(connection, sql, options);
}
