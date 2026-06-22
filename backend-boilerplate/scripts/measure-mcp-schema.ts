/**
 * Mede o ganho de tamanho do payload do `get_connection_schema` do MCP:
 * ANTES (modo antigo: schema INTEIRO, todas as tabelas × todas as colunas) vs
 * DEPOIS (modo novo: só a LISTA de tabelas, sem colunas). Aponta para o próprio
 * Postgres do app (DATABASE_URL) — vários schemas/tabelas reais.
 *
 * Uso: npx tsx scripts/measure-mcp-schema.ts
 */
import { env } from '@/lib/env';
import { encrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import { closeAllPools } from '@/lib/pg-runner';
import { introspectSchema } from '@/modules/connections/service';

async function main() {
  const url = new URL(env.DATABASE_URL);
  const conn = await prisma.connection.create({
    data: {
      name: `measure-${Date.now()}`,
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      database: url.pathname.replace(/^\//, ''),
      username: decodeURIComponent(url.username),
      passwordCipher: encrypt(decodeURIComponent(url.password)),
      sslMode: url.searchParams.get('sslmode') ?? 'disable',
      ownerId: (await prisma.user.findFirstOrThrow()).id,
      visibility: 'ORG',
      isActive: true,
    },
  });

  try {
    const full = await introspectSchema(conn, { refresh: true });

    // ANTES: o payload antigo da tool devolvia o objeto introspectado INTEIRO.
    const oldPayload = {
      connectionId: full.connectionId,
      tableCount: full.tableCount,
      fetchedAt: full.fetchedAt,
      cached: full.cached,
      tables: full.tables,
    };
    // DEPOIS (passo 1): só a lista de tabelas, sem colunas.
    const newListPayload = {
      connectionId: full.connectionId,
      cached: full.cached,
      fetchedAt: full.fetchedAt,
      tableCount: full.tableCount,
      mode: 'tables',
      tables: full.tables.map((t) => ({
        schema: t.schema,
        name: t.name,
        columnCount: t.columns.length,
      })),
      total: full.tables.length,
      page: 1,
      pageSize: 200,
      totalPages: Math.max(1, Math.ceil(full.tables.length / 200)),
    };

    const oldStr = JSON.stringify(oldPayload);
    const oldPretty = JSON.stringify(oldPayload, null, 2);
    const newStr = JSON.stringify(newListPayload);
    const totalColumns = full.tables.reduce((a, t) => a + t.columns.length, 0);

    const reduction = (1 - newStr.length / oldStr.length) * 100;
    const reductionVsPretty = (1 - newStr.length / oldPretty.length) * 100;

    console.log('=== get_connection_schema: ANTES vs DEPOIS ===');
    console.log(`Tabelas: ${full.tables.length} | Colunas totais: ${totalColumns}`);
    console.log('');
    console.log(`ANTES (schema inteiro, pretty-print 2 espaços): ${oldPretty.length} chars`);
    console.log(`ANTES (schema inteiro, compacto):               ${oldStr.length} chars`);
    console.log(`DEPOIS (lista de tabelas, compacto):            ${newStr.length} chars`);
    console.log('');
    console.log(`Redução compacto-vs-compacto:        ${reduction.toFixed(1)}%`);
    console.log(`Redução vs payload antigo (pretty):  ${reductionVsPretty.toFixed(1)}%`);
  } finally {
    await prisma.connection.delete({ where: { id: conn.id } });
    await closeAllPools();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
