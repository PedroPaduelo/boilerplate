/**
 * Tolerância do gateway-runner aos FORMATOS de resposta de `/query`.
 *
 * Por que isto existe: o gateway mudou o formato sem aviso. Passou de
 *
 *   { ok, columns, rows, rowCount, truncated }                        (plano)
 * para
 *   { ok, statementCount, results: [ { columns, rows, rowCount } ] }  (por statement)
 *
 * e o runner, que lia `body.rows`, passou a devolver ZERO LINHA para toda
 * query — sem erro, sem aviso: a tela mostrava "0 linhas" para consultas que
 * funcionavam perfeitamente no banco. Falha silenciosa não pode voltar, então
 * os dois formatos ficam travados aqui.
 *
 * O `fetch` global é substituído por um dublê: o teste é sobre a LEITURA da
 * resposta, não sobre a rede.
 */
import { runGatewayQuery } from '@/lib/gateway-runner';

const CONN = { id: 'c1', baseUrl: 'https://gw.exemplo.com', token: 'tok' };

/** Instala um `fetch` que sempre devolve `body` como JSON 200. */
function mockFetch(body: unknown) {
  const spy = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  });
  (globalThis as unknown as { fetch: unknown }).fetch = spy;
  return spy;
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  (globalThis as unknown as { fetch: unknown }).fetch = originalFetch;
});

describe('gateway-runner — formatos de resposta de /query', () => {
  it('formato POR STATEMENT (`results[]`) devolve as linhas', async () => {
    mockFetch({
      ok: true,
      database: 'TRIBUTARIO_IPATINGA',
      statementCount: 1,
      results: [
        {
          index: 0,
          command: 'SELECT',
          columns: [{ name: 'name', type: 'nvarchar' }],
          rows: [{ name: 'ACAO_PROCESSO' }, { name: 'ADM_PUBLICA' }],
          rowCount: 2,
          truncated: false,
          durationMs: 688,
        },
      ],
      durationMs: 688,
    });

    const out = await runGatewayQuery(CONN, 'SELECT TOP 10 name FROM sysobjects');

    expect(out.rowCount).toBe(2);
    expect(out.rows).toEqual([{ name: 'ACAO_PROCESSO' }, { name: 'ADM_PUBLICA' }]);
    expect(out.columns).toEqual([{ name: 'name', dataTypeID: 0, dataType: 'nvarchar' }]);
    expect(out.truncated).toBe(false);
  });

  it('formato PLANO (linhas no topo) continua funcionando', async () => {
    mockFetch({
      ok: true,
      command: 'SELECT',
      columns: [{ name: 'servidor', type: 'nvarchar' }],
      rows: [{ servidor: 'DCESP3SQLROPRD3' }],
      rowCount: 1,
      truncated: false,
    });

    const out = await runGatewayQuery(CONN, 'SELECT @@SERVERNAME AS servidor');

    expect(out.rowCount).toBe(1);
    expect(out.rows).toEqual([{ servidor: 'DCESP3SQLROPRD3' }]);
  });

  it('propaga `truncated` vindo de dentro de `results[]`', async () => {
    mockFetch({
      ok: true,
      statementCount: 1,
      results: [{ columns: [], rows: [{ a: 1 }], rowCount: 1, truncated: true }],
    });

    const out = await runGatewayQuery(CONN, 'SELECT a FROM t');
    expect(out.truncated).toBe(true);
  });

  it('escolhe o bloco que TEM linhas quando vêm vários', async () => {
    mockFetch({
      ok: true,
      statementCount: 2,
      results: [
        { command: 'SET', rowCount: 0 },
        { command: 'SELECT', columns: [{ name: 'x', type: 'int' }], rows: [{ x: 7 }] },
      ],
    });

    const out = await runGatewayQuery(CONN, 'SELECT x FROM t');
    expect(out.rows).toEqual([{ x: 7 }]);
  });

  it('resposta sem linhas nenhum devolve resultado vazio (sem estourar)', async () => {
    mockFetch({ ok: true, statementCount: 1, results: [{ command: 'SELECT' }] });

    const out = await runGatewayQuery(CONN, 'SELECT x FROM t');
    expect(out.rows).toEqual([]);
    expect(out.rowCount).toBe(0);
  });

  it('aplica o row cap mesmo se o gateway ignorar o `maxRows`', async () => {
    mockFetch({
      ok: true,
      results: [{ rows: Array.from({ length: 10 }, (_, i) => ({ i })), rowCount: 10 }],
    });

    const out = await runGatewayQuery(CONN, 'SELECT i FROM t', { maxRows: 3 });
    expect(out.rowCount).toBe(3);
    expect(out.truncated).toBe(true);
  });
});
