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
  // Connection de exemplo — aponta para um Postgres REAL e acessível.
  //
  // Usamos o PRÓPRIO banco da aplicação (DATABASE_URL) como "banco externo" de
  // demonstração: assim run_query / test / schema / o fluxo de dados (data ↔
  // fila ↔ socket ↔ render) funcionam de verdade no e2e. As queries do seed são
  // SELECTs read-only contra tabelas que sempre existem (users, dashboards,
  // information_schema), passando pelos guardrails do pg-runner.
  //
  // A senha é cifrada via lib/crypto (AES-256-GCM) — fonte única do projeto.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('🔌 Conexões:');
  const dbUrl = new URL(
    process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/postgres'
  );
  const sslMode = dbUrl.searchParams.get('sslmode') ?? 'disable';
  const connData = {
    name: 'seed-exemplo-postgres',
    description:
      'Conexão de demonstração do seed — aponta para o próprio Postgres do app (read-only).',
    type: 'POSTGRES' as const,
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 5432),
    database: dbUrl.pathname.replace(/^\//, '') || 'postgres',
    username: decodeURIComponent(dbUrl.username || 'postgres'),
    passwordCipher: encrypt(decodeURIComponent(dbUrl.password || '')),
    sslMode,
    options: { schema: 'public' } as Prisma.JsonObject,
    ownerId: admin.id,
    departmentId: null,
    visibility: 'ORG' as const,
    status: 'unknown',
  };
  const existingConn = await prisma.connection.findFirst({
    where: { name: connData.name, ownerId: admin.id },
  });
  const conn = existingConn
    ? await prisma.connection.update({
        where: { id: existingConn.id },
        data: connData,
      })
    : await prisma.connection.create({ data: connData });
  console.log(
    `  ${existingConn ? '↻ atualizada' : '✓ criada'} Connection "${conn.name}" → ${conn.host}:${conn.port}/${conn.database} (id=${conn.id})`
  );

  // -------------------------------------------------------------------------
  // Charts de exemplo — catalogType VÁLIDO do catálogo (kpi, bar_chart) e
  // draft/published props + dataBinding CONFORMES ao contrato (doc 20). As
  // queries são read-only e rodam de verdade no Postgres do seed.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('📊 Charts de exemplo:');

  /** Cria ou ATUALIZA um chart (idempotente por title+ownerId+catalogType). */
  async function upsertChart(opts: {
    title: string;
    catalogType: string;
    props: Prisma.JsonObject;
    dataBinding: Prisma.JsonObject;
  }) {
    const data = {
      title: opts.title,
      catalogType: opts.catalogType,
      ownerId: admin.id,
      departmentId: null,
      visibility: 'ORG' as const,
      status: 'PUBLISHED' as const,
      draftProps: opts.props,
      draftDataBinding: opts.dataBinding,
      publishedProps: opts.props,
      publishedDataBinding: opts.dataBinding,
      publishedAt: new Date(),
    };
    const existing = await prisma.chart.findFirst({
      where: { title: opts.title, ownerId: admin.id, catalogType: opts.catalogType },
    });
    const chart = existing
      ? await prisma.chart.update({ where: { id: existing.id }, data })
      : await prisma.chart.create({ data });
    console.log(
      `  ${existing ? '↻ atualizado' : '✓ criado'} Chart "${chart.title}" (${chart.catalogType}, id=${chart.id})`
    );
    return chart;
  }

  const kpiChart = await upsertChart({
    title: 'Total de usuários',
    catalogType: 'kpi',
    props: { showDelta: false, accent: 'primary' },
    dataBinding: {
      connectionId: conn.id,
      query: 'SELECT COUNT(*)::int AS value FROM users',
      params: [],
      ttlSeconds: 300,
    },
  });

  const barChart = await upsertChart({
    title: 'Usuários por papel',
    catalogType: 'bar_chart',
    props: { orientation: 'vertical', stacked: false },
    dataBinding: {
      connectionId: conn.id,
      query:
        'SELECT role::text AS x, COUNT(*)::int AS y FROM users GROUP BY role ORDER BY role',
      params: [],
      ttlSeconds: 300,
    },
  });

  // -------------------------------------------------------------------------
  // Dashboard published de exemplo — layout CONFORME ao contrato (doc 20):
  //   { filters[{id,type,label,default}], rows[{id,title,blocks[{id,type,span,props,dataBinding?}]}] }
  //
  // Exercita o catálogo base inteiro: blocos narrativos (title/rich_text) SEM
  // dados, blocos com dados via chart referenciado (props.chartId → kpi) e via
  // dataBinding inline (bar_chart/donut/table). O filtro `f_role` é usado APENAS
  // pelo bar_chart (params) → ao mudar o filtro só esse bloco recomputa.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('📋 Dashboard exemplo:');
  const exampleDashboardLayout: Prisma.JsonObject = {
    filters: [
      {
        id: 'f_role',
        type: 'select',
        label: 'Papel do usuário',
        default: 'todos',
      },
    ],
    rows: [
      {
        id: 'row_intro',
        title: 'Visão geral',
        blocks: [
          {
            id: 'blk_title',
            type: 'title',
            span: 12,
            props: {
              text: 'Painel de Demonstração — Prefeitura',
              level: 1,
              align: 'left',
            },
          },
          {
            id: 'blk_rich',
            type: 'rich_text',
            span: 12,
            props: {
              markdown:
                '## Sobre este painel\nDashboard de **demonstração** gerado pelo seed. Os números abaixo vêm de queries _read-only_ contra o próprio banco da aplicação, exercitando o fluxo **dados → fila → socket → render**.',
            },
          },
        ],
      },
      {
        id: 'row_kpis',
        title: 'Indicadores',
        blocks: [
          {
            // bloco com dados via CHART referenciado (props.chartId → kpiChart)
            id: 'blk_kpi_users',
            type: 'kpi',
            span: 4,
            props: { chartId: kpiChart.id, showDelta: false },
          },
          {
            // bloco com dados via dataBinding INLINE + filtro (param posicional $1)
            id: 'blk_bar_roles',
            type: 'bar_chart',
            span: 8,
            props: { orientation: 'vertical', stacked: false },
            dataBinding: {
              connectionId: conn.id,
              query:
                "SELECT role::text AS x, COUNT(*)::int AS y FROM users WHERE ($1::text IS NULL OR $1 = 'todos' OR role::text = $1) GROUP BY role ORDER BY role",
              params: [{ filterId: 'f_role', as: 'role' }],
              ttlSeconds: 300,
            },
          },
        ],
      },
      {
        id: 'row_dist',
        title: 'Distribuição e detalhamento',
        blocks: [
          {
            id: 'blk_donut_vis',
            type: 'donut',
            span: 5,
            props: { showLegend: true },
            dataBinding: {
              connectionId: conn.id,
              query:
                'SELECT visibility::text AS label, COUNT(*)::int AS value FROM dashboards GROUP BY visibility ORDER BY visibility',
              ttlSeconds: 300,
            },
          },
          {
            id: 'blk_table_tables',
            type: 'table',
            span: 7,
            props: { pageSize: 10, dense: false },
            dataBinding: {
              connectionId: conn.id,
              query:
                "SELECT table_name AS name, table_type AS type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
              ttlSeconds: 300,
            },
          },
        ],
      },
    ],
  };

  const dashData = {
    title: 'Painel de Demonstração',
    ownerId: admin.id,
    departmentId: null,
    visibility: 'ORG' as const,
    status: 'PUBLISHED' as const,
    draftLayout: exampleDashboardLayout,
    publishedLayout: exampleDashboardLayout,
    publishedAt: new Date(),
  };
  const existingDash =
    (await prisma.dashboard.findFirst({
      where: { title: 'Painel de Demonstração', ownerId: admin.id },
    })) ??
    // compatibilidade: substitui o dashboard antigo do seed (layout não-conforme)
    (await prisma.dashboard.findFirst({
      where: { title: 'Painel de Arrecadação', ownerId: admin.id },
    }));
  const exampleDashboard = existingDash
    ? await prisma.dashboard.update({ where: { id: existingDash.id }, data: dashData })
    : await prisma.dashboard.create({ data: dashData });
  console.log(
    `  ${existingDash ? '↻ atualizado' : '✓ criado'} Dashboard "${exampleDashboard.title}" (status=${exampleDashboard.status}, id=${exampleDashboard.id})`
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
  console.log(`   Conexão exemplo: "${conn.name}" (id=${conn.id})`);
  console.log(`   Charts: "${kpiChart.title}" (kpi), "${barChart.title}" (bar_chart)`);
  console.log(`   Dashboard exemplo: "${exampleDashboard.title}" (status=${exampleDashboard.status})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
