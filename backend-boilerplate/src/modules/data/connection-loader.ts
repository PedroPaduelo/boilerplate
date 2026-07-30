/**
 * Resolução de Connection → alvo executável pelo `query-runner` (decifra o
 * segredo: senha do Postgres ou token do gateway).
 *
 * Reimplementado localmente (em vez de importar do módulo `connections`) para
 * NÃO acoplar o módulo `data` ao `connections` — a regra de paralelização (doc 21)
 * pede que cada módulo seja autossuficiente. As únicas dependências
 * compartilhadas são a lib de cifragem (`@/lib/crypto`, fonte única do formato
 * do ciphertext) e o `query-runner` (fonte única de execução).
 */
import type { Connection } from '@prisma/client';
import { decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import type { PgRunnerConnection } from '@/lib/pg-runner';
import type { RunnerConnection } from '@/lib/query-runner';

/** Monta o objeto do pg-runner a partir de um registro de Connection (decifra a senha). */
export function toPgRunnerConnection(conn: Connection): PgRunnerConnection {
  return {
    id: conn.id,
    host: conn.host,
    port: conn.port,
    database: conn.database,
    user: conn.username,
    password: decrypt(conn.passwordCipher),
    sslMode: conn.sslMode,
  };
}

/**
 * Registro → alvo do `query-runner`, escolhendo o transporte pelo tipo.
 *
 * Um bloco de dashboard não sabe (nem deve saber) se o dado vem de um Postgres
 * na mesma rede ou de um gateway HTTP do outro lado de uma VPN: ele pede
 * `runQuery` e recebe linhas. É aqui que essa indiferença é produzida.
 */
export function toRunnerConnection(conn: Connection): RunnerConnection {
  if (conn.type === 'API_GATEWAY') {
    return {
      kind: 'gateway',
      id: conn.id,
      baseUrl: conn.baseUrl ?? `https://${conn.host}`,
      // Para API_GATEWAY o segredo cifrado é o TOKEN Bearer.
      token: decrypt(conn.passwordCipher),
      database: conn.database,
    };
  }
  return toPgRunnerConnection(conn);
}

/** Carrega a Connection por id e devolve o alvo executável, ou `null`. */
export async function loadRunnerConnection(
  connectionId: string,
): Promise<RunnerConnection | null> {
  const conn = await prisma.connection.findUnique({ where: { id: connectionId } });
  return conn ? toRunnerConnection(conn) : null;
}

/**
 * @deprecated Use `loadRunnerConnection`. Mantido como alias porque o worker e
 * os testes chamam por este nome; o retorno agora pode ser qualquer transporte.
 */
export const loadPgConnection = loadRunnerConnection;
