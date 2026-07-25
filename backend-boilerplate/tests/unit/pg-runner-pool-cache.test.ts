/**
 * Regressão: o pool em cache precisa acompanhar a configuração da conexão.
 *
 * Bug original: o cache de pools era indexado só por `connection.id`. Como um
 * `pg.Pool` congela a configuração no construtor, editar a conexão não surtia
 * efeito enquanto o processo vivesse. O sintoma reportado foi com SSL: criar a
 * conexão com o default `require`, tomar "The server does not support SSL
 * connections", trocar para `disable` e continuar tomando o MESMO erro — dava a
 * impressão de que a escolha do modal era ignorada, quando na verdade o valor
 * chegava certo e o pool velho é que era reaproveitado.
 *
 * O mesmo valia para senha/host/porta/banco/usuário: trocar a senha de uma
 * conexão não tinha efeito até reiniciar o backend.
 *
 * Mockamos `pg` para inspecionar as configs com que os pools são construídos —
 * o teste não depende de o Postgres local ter ou não SSL.
 */

interface FakeConfig {
  host: string;
  ssl?: unknown;
  password?: string;
}

const construidos: FakeConfig[] = [];
const encerrados: FakeConfig[] = [];

jest.mock('pg', () => {
  class FakePool {
    config: FakeConfig;
    constructor(config: FakeConfig) {
      this.config = config;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      (jest.requireMock('pg') as { __construidos: FakeConfig[] }).__construidos.push(config);
    }
    on() {}
    connect() {
      return Promise.reject(new Error('conexão não é o objeto deste teste'));
    }
    end() {
      (jest.requireMock('pg') as { __encerrados: FakeConfig[] }).__encerrados.push(this.config);
      return Promise.resolve();
    }
  }
  return { Pool: FakePool, __construidos: construidos, __encerrados: encerrados };
});

import { runQuery, closeAllPools, type PgRunnerConnection } from '@/lib/pg-runner';

const BASE: PgRunnerConnection = {
  id: 'conn-fixa',
  host: 'db.example.local',
  port: 5432,
  database: 'app',
  user: 'leitor',
  password: 'senha-1',
};

/** Dispara o caminho que resolve o pool (a query em si falha de propósito). */
async function tocaPool(conn: PgRunnerConnection) {
  await expect(runQuery(conn, 'SELECT 1')).rejects.toThrow();
}

beforeEach(() => {
  construidos.length = 0;
  encerrados.length = 0;
});

afterEach(async () => {
  await closeAllPools();
});

describe('pg-runner — cache de pool acompanha a config da conexão', () => {
  it('reaproveita o pool quando NADA muda', async () => {
    await tocaPool(BASE);
    await tocaPool(BASE);
    expect(construidos).toHaveLength(1);
  });

  it('recria o pool quando o sslMode muda (o bug reportado)', async () => {
    await tocaPool({ ...BASE, sslMode: 'require' });
    expect(construidos).toHaveLength(1);
    expect(construidos[0].ssl).toBeTruthy();

    // Mesmo id, SSL desativado: o pool precisa ser REFEITO sem TLS.
    await tocaPool({ ...BASE, sslMode: 'disable' });
    expect(construidos).toHaveLength(2);
    expect(construidos[1].ssl).toBeUndefined();

    // E o pool antigo não pode vazar: tem que ser encerrado.
    expect(encerrados).toHaveLength(1);
    expect(encerrados[0].ssl).toBeTruthy();
  });

  it('recria o pool quando a SENHA muda (mesma classe de bug)', async () => {
    await tocaPool(BASE);
    await tocaPool({ ...BASE, password: 'senha-2-rotacionada' });
    expect(construidos).toHaveLength(2);
    expect(construidos[1].password).toBe('senha-2-rotacionada');
  });

  it('recria o pool quando o host muda', async () => {
    await tocaPool(BASE);
    await tocaPool({ ...BASE, host: 'outro-host.local' });
    expect(construidos).toHaveLength(2);
    expect(construidos[1].host).toBe('outro-host.local');
  });

  it('trata "prefer" e "disable" como configurações distintas', async () => {
    await tocaPool({ ...BASE, sslMode: 'disable' });
    await tocaPool({ ...BASE, sslMode: 'prefer' });
    expect(construidos).toHaveLength(2);
    expect(construidos[0].ssl).toBeUndefined();
    expect(construidos[1].ssl).toBeTruthy();
  });
});
