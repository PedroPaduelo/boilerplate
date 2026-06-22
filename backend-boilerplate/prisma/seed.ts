// =============================================================================
// SEED — dados mínimos para dev/teste (F0.1).
//
// Credenciais DETERMINÍSTICAS (documentadas no commit):
//   admin@prefeitura.local / admin1234   (role: ADMIN)
//
// Além do admin, cria usuários de teste para cada papel da matriz RBAC
// (mesmo email + senha `user1234`). Útil para a F2 validar a matriz.
//
// O seed é idempotente: pode rodar 2x sem quebrar. Estratégia:
//   - upsert por chave natural (email, slug) onde existe @unique;
//   - findFirst + create (skip) nas demais (Connection, Chart, Dashboard
//     exemplo) — sem @unique natural além do id.
//
// A cifra de `passwordCipher` é AES-256-GCM via `src/lib/crypto` (F0.2), usando
// a chave `CONNECTION_ENC_KEY` do .env. A lib é a fonte única do formato de
// ciphertext do projeto — o seed apenas a consome.
// =============================================================================

import { PrismaClient, type Prisma } from '@prisma/client';
import { hash as bcryptHash } from 'bcryptjs';
import { encrypt } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function upsertUser(opts: {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'ANALYST' | 'CREATOR' | 'VIEWER' | 'USER';
}) {
  const passwordHash = await bcryptHash(opts.password, 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: {
      name: opts.name,
      // Não atualizamos password/role em updates para preservar mudanças de teste.
    },
    create: {
      email: opts.email,
      name: opts.name,
      password: passwordHash,
      role: opts.role,
    },
  });
}

async function findOrCreate<T extends { id: string }>(
  fetch: () => Promise<T | null>,
  create: () => Promise<T>,
  label: string
): Promise<T> {
  const existing = await fetch();
  if (existing) {
    console.log(`  ↺ ${label} já existe (id=${existing.id})`);
    return existing;
  }
  const created = await create();
  console.log(`  ✓ ${label} criado (id=${created.id})`);
  return created;
}

async function main() {
  console.log('🌱 Seed — F0.1 dashboards MVP');
  console.log('');

  // -------------------------------------------------------------------------
  // Usuários (1 ADMIN principal + 1 por papel da matriz RBAC)
  // -------------------------------------------------------------------------
  console.log('👥 Usuários:');
  const admin = await upsertUser({
    email: 'admin@prefeitura.local',
    name: 'Admin da Prefeitura',
    password: 'admin1234',
    role: 'ADMIN',
  });
  const analyst = await upsertUser({
    email: 'analyst@prefeitura.local',
    name: 'Analista de Dados',
    password: 'user1234',
    role: 'ANALYST',
  });
  const creator = await upsertUser({
    email: 'creator@prefeitura.local',
    name: 'Creator de Relatórios',
    password: 'user1234',
    role: 'CREATOR',
  });
  const viewer = await upsertUser({
    email: 'viewer@prefeitura.local',
    name: 'Viewer de Dashboards',
    password: 'user1234',
    role: 'VIEWER',
  });
  const plainUser = await upsertUser({
    email: 'user@prefeitura.local',
    name: 'Usuário Autenticado (sem dashboards)',
    password: 'user1234',
    role: 'USER',
  });

  // -------------------------------------------------------------------------
  // Departamento raiz
  // -------------------------------------------------------------------------
  console.log('');
  console.log('🏢 Departamentos:');
  const departRoot = await prisma.department.upsert({
    where: { slug: 'prefeitura' },
    update: { name: 'Prefeitura' },
    create: { name: 'Prefeitura', slug: 'prefeitura' },
  });
  console.log(`  ✓ Raiz: ${departRoot.name} (slug=${departRoot.slug})`);

  // Departamentos adicionais (exemplos por área) + memberships
  const finance = await prisma.department.upsert({
    where: { slug: 'financas' },
    update: { name: 'Finanças' },
    create: { name: 'Finanças', slug: 'financas' },
  });
  const saude = await prisma.department.upsert({
    where: { slug: 'saude' },
    update: { name: 'Saúde' },
    create: { name: 'Saúde', slug: 'saude' },
  });

  // Admin pertence a TODOS os departamentos
  for (const d of [departRoot, finance, saude]) {
    await prisma.departmentMembership.upsert({
      where: { userId_departmentId: { userId: admin.id, departmentId: d.id } },
      update: {},
      create: { userId: admin.id, departmentId: d.id },
    });
  }
  // ANALYST em Finanças; CREATOR em Saúde; demais só na raiz
  for (const [u, d] of [
    [analyst, finance],
    [creator, saude],
    [viewer, departRoot],
    [plainUser, departRoot],
  ] as const) {
    await prisma.departmentMembership.upsert({
      where: { userId_departmentId: { userId: u.id, departmentId: d.id } },
      update: {},
      create: { userId: u.id, departmentId: d.id },
    });
  }
  console.log('  ✓ Memberships criadas');

  // -------------------------------------------------------------------------
  // Connection de exemplo (Postgres fictício, valor cifrado)
  // -------------------------------------------------------------------------
  console.log('');
  console.log('🔌 Conexões:');
  const conn = await findOrCreate(
    async () =>
      prisma.connection.findFirst({
        where: { name: 'seed-exemplo-postgres', ownerId: admin.id },
      }),
    async () =>
      prisma.connection.create({
        data: {
          name: 'seed-exemplo-postgres',
          description: 'Conexão fictícia usada pelo seed (host inacessível).',
          type: 'POSTGRES',
          host: 'db-exemplo.prefeitura.local',
          port: 5432,
          database: 'dw_prefeitura',
          username: 'reader',
          passwordCipher: encrypt('placeholder-not-real'),
          sslMode: 'require',
          options: { schema: 'public' },
          ownerId: admin.id,
          departmentId: finance.id,
          visibility: 'DEPARTMENT',
          status: 'unknown',
        },
      }),
    'Connection "seed-exemplo-postgres"'
  );

  // -------------------------------------------------------------------------
  // Chart exemplo (catalogType = "kpi" — placeholder do catálogo base
  // que virá em F0.4). Como o catálogo vive em código, não há tabela
  // BlockDefinition; garantimos a "linha de exemplo" via Chart publicado.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('📊 Chart exemplo:');
  const exampleChart = await findOrCreate(
    async () =>
      prisma.chart.findFirst({
        where: {
          title: 'Arrecadação total',
          ownerId: admin.id,
          catalogType: 'kpi',
        },
      }),
    async () =>
      prisma.chart.create({
        data: {
          title: 'Arrecadação total',
          catalogType: 'kpi',
          ownerId: admin.id,
          departmentId: finance.id,
          visibility: 'DEPARTMENT',
          status: 'PUBLISHED',
          draftProps: {
            label: 'Arrecadação total (R$)',
            valueFormat: 'BRL',
            color: 'primary',
          },
          draftDataBinding: {
            connectionId: conn.id,
            query:
              'SELECT COALESCE(SUM(valor), 0) AS total FROM arrecadacao WHERE data >= NOW() - INTERVAL \'30 days\'',
            params: [],
            transform: { kind: 'scalar' },
            ttlSeconds: 300,
          },
          publishedProps: {
            label: 'Arrecadação total (R$)',
            valueFormat: 'BRL',
            color: 'primary',
          },
          publishedDataBinding: {
            connectionId: conn.id,
            query:
              'SELECT COALESCE(SUM(valor), 0) AS total FROM arrecadacao WHERE data >= NOW() - INTERVAL \'30 days\'',
            params: [],
            transform: { kind: 'scalar' },
            ttlSeconds: 300,
          },
          publishedAt: new Date(),
        },
      }),
    'Chart "Arrecadação total" (kpi)'
  );

  // -------------------------------------------------------------------------
  // Dashboard published de exemplo
  // Estrutura do layout: { filters[], rows: [{ id, blocks: [{ blockId, chartId }] }] }
  // Reflete o contrato de docs/plano/20-contrato-dashboard.md (alto nível).
  // Blocos do catálogo base citados no escopo: kpi, bar, title.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('📋 Dashboard exemplo:');
  const exampleDashboardLayout: Prisma.JsonObject = {
    filters: [
      {
        id: 'periodo',
        type: 'date-range',
        label: 'Período',
        defaultValue: { from: 'now-30d', to: 'now' },
      },
    ],
    rows: [
      {
        id: 'row-titulo',
        blocks: [
          {
            blockId: 'b-title-1',
            type: 'title',
            props: { text: 'Painel de Arrecadação — últimos 30 dias' },
          },
        ],
      },
      {
        id: 'row-kpis',
        blocks: [
          {
            blockId: 'b-kpi-1',
            type: 'kpi',
            chartId: exampleChart.id,
            props: { columnSpan: 1 },
          },
        ],
      },
      {
        id: 'row-grafico',
        blocks: [
          {
            blockId: 'b-bar-1',
            type: 'bar',
            dataBinding: {
              connectionId: conn.id,
              query:
                'SELECT tipo, SUM(valor) AS total FROM arrecadacao WHERE data >= NOW() - INTERVAL \'30 days\' GROUP BY tipo ORDER BY total DESC',
              params: [],
              transform: { kind: 'category-value', x: 'tipo', y: 'total' },
              ttlSeconds: 600,
            },
            props: { title: 'Arrecadação por tipo', columnSpan: 2 },
          },
        ],
      },
    ],
  };

  const exampleDashboard = await findOrCreate(
    async () =>
      prisma.dashboard.findFirst({
        where: { title: 'Painel de Arrecadação', ownerId: admin.id },
      }),
    async () =>
      prisma.dashboard.create({
        data: {
          title: 'Painel de Arrecadação',
          ownerId: admin.id,
          departmentId: finance.id,
          visibility: 'DEPARTMENT',
          status: 'PUBLISHED',
          draftLayout: exampleDashboardLayout,
          publishedLayout: exampleDashboardLayout,
          publishedAt: new Date(),
        },
      }),
    'Dashboard "Painel de Arrecadação" (published)'
  );

  console.log('');
  console.log('🎉 Seed concluído.');
  console.log('');
  console.log('   Credenciais determinísticas:');
  console.log('     admin@prefeitura.local  /  admin1234   (ADMIN)');
  console.log('     analyst@prefeitura.local / user1234   (ANALYST)');
  console.log('     creator@prefeitura.local / user1234   (CREATOR)');
  console.log('     viewer@prefeitura.local  / user1234   (VIEWER)');
  console.log('     user@prefeitura.local    / user1234   (USER)');
  console.log('');
  console.log(`   Dashboard exemplo: "${exampleDashboard.title}" (status=PUBLISHED)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
