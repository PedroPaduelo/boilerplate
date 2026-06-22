import {
  closeAllPools,
  PgRunnerError,
  runQuery,
  SqlGuardError,
  type PgRunnerConnection,
} from '@/lib/pg-runner';

const UNREACHABLE: PgRunnerConnection = {
  id: 'unreachable-test',
  host: '127.0.0.1',
  port: 1, // porta impossível — só usada se o guard NÃO rodar primeiro
  database: 'nope',
  user: 'nope',
  password: 'super-secret-pw',
};

afterAll(async () => {
  await closeAllPools();
});

describe('pg-runner — guardrails (sem banco)', () => {
  it('rejects non-SELECT queries BEFORE attempting to connect', async () => {
    await expect(runQuery(UNREACHABLE, 'DROP TABLE users')).rejects.toThrow(
      SqlGuardError
    );
    await expect(runQuery(UNREACHABLE, 'UPDATE t SET a = 1')).rejects.toThrow(
      SqlGuardError
    );
    await expect(runQuery(UNREACHABLE, 'SELECT 1; SELECT 2')).rejects.toThrow(
      SqlGuardError
    );
  });
});

// -----------------------------------------------------------------------------
// Testes de integração — exigem um Postgres alcançável em PG_RUNNER_TEST_URL.
// Ex.: PG_RUNNER_TEST_URL="postgres://user:pass@host:5432/db?sslmode=disable"
// Sem a env, são pulados (npm test continua verde).
// -----------------------------------------------------------------------------
const TEST_URL = process.env.PG_RUNNER_TEST_URL;
const describeIntegration = TEST_URL ? describe : describe.skip;

function connFromUrl(u: string): PgRunnerConnection {
  const url = new URL(u);
  return {
    id: `it-${url.host}${url.pathname}`,
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    database: url.pathname.replace(/^\//, ''),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    sslMode: url.searchParams.get('sslmode') ?? 'disable',
  };
}

describeIntegration('pg-runner — integração (Postgres real)', () => {
  // só construído quando TEST_URL existe (describe.skip não roda os `it`s).
  const conn = TEST_URL
    ? connFromUrl(TEST_URL)
    : (null as unknown as PgRunnerConnection);

  it('executes a simple SELECT and returns columns/rows/durationMs', async () => {
    const res = await runQuery(conn, 'SELECT 1 AS n, $1::text AS label', {
      params: ['hello'],
    });
    expect(res.columns.map((c) => c.name)).toEqual(['n', 'label']);
    expect(Number(res.rows[0].n)).toBe(1);
    expect(res.rows[0].label).toBe('hello');
    expect(res.rowCount).toBe(1);
    expect(res.truncated).toBe(false);
    expect(typeof res.durationMs).toBe('number');
  });

  it('applies the row cap (truncated)', async () => {
    const res = await runQuery(
      conn,
      'SELECT g FROM generate_series(1, 1000) AS g',
      { maxRows: 10 }
    );
    expect(res.rowCount).toBe(10);
    expect(res.truncated).toBe(true);
  });

  it('enforces statement_timeout on slow queries', async () => {
    await expect(
      runQuery(conn, 'SELECT pg_sleep(3)', { statementTimeoutMs: 150 })
    ).rejects.toThrow(PgRunnerError);
  });

  it('rolls back: a read-only transaction never persists', async () => {
    // garante que nada quebrou o ciclo BEGIN/ROLLBACK em chamadas consecutivas
    const a = await runQuery(conn, 'SELECT 42 AS answer');
    const b = await runQuery(conn, 'SELECT 7 AS answer');
    expect(Number(a.rows[0].answer)).toBe(42);
    expect(Number(b.rows[0].answer)).toBe(7);
  });
});
