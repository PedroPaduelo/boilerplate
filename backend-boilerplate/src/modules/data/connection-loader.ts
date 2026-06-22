/**
 * Resolução de Connection → `PgRunnerConnection` (decifra a senha).
 *
 * Reimplementado localmente (em vez de importar do módulo `connections`) para
 * NÃO acoplar o módulo `data` ao `connections` — a regra de paralelização (doc 21)
 * pede que cada módulo seja autossuficiente. A única dependência compartilhada é a
 * lib de cifragem (`@/lib/crypto`, fonte única do formato do ciphertext).
 */
import type { Connection } from '@prisma/client';
import { decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import type { PgRunnerConnection } from '@/lib/pg-runner';

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

/** Carrega a Connection por id e devolve o objeto do pg-runner, ou `null`. */
export async function loadPgConnection(
  connectionId: string,
): Promise<PgRunnerConnection | null> {
  const conn = await prisma.connection.findUnique({ where: { id: connectionId } });
  return conn ? toPgRunnerConnection(conn) : null;
}
