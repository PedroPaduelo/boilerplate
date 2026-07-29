/**
 * Cria um dashboard de DEMONSTRAÇÃO usando todas as capacidades de apresentação
 * (doc 41), a partir dos charts que já existem no ambiente.
 *
 * Serve a dois propósitos:
 *  1. prova de ponta a ponta de que o contrato novo atravessa HTTP + Zod +
 *     validação + Prisma sem perder campo;
 *  2. dá uma tela real para inspecionar composição (o que teste de DOM não vê).
 *
 * Uso: node scripts/seed-demo-dashboard.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:4000';
const EMAIL = process.env.SEED_EMAIL ?? 'analyst@prefeitura.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'user1234';

const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const { token } = await login.json();
if (!token) throw new Error('login falhou');

const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

const res = await fetch(`${API}/charts?pageSize=30`, { headers });
const { charts = [] } = await res.json();
if (charts.length === 0) throw new Error('nenhum chart disponível');

const byType = (...types) => charts.find((c) => types.includes(c.catalogType));
const kpis = charts.filter((c) => c.catalogType === 'kpi').slice(0, 3);
const serie = byType('line_chart', 'area_chart', 'bar_chart');
const composicao = byType('donut', 'progress_circle', 'radial_gauge');
const ranking = byType('bar_list', 'h_bar_chart', 'leaderboard');
const tabela = byType('data_table', 'table', 'invoice_table');

const bloco = (chart, extra = {}) => ({
  id: `blk_${chart.id}`,
  type: chart.catalogType,
  span: 6,
  props: { chartId: chart.id },
  ...extra,
});

const rows = [];
const tabs = [];

if (kpis.length > 0) {
  rows.push({
    id: 'row_kpis',
    title: 'Indicadores do período',
    description: 'Consolidado do canal de atendimento e da malha fiscal.',
    columns: Math.min(kpis.length, 3),
    blocks: kpis.map((c, i) =>
      bloco(c, {
        span: 4,
        unit: i === 0 ? 'R$' : i === 1 ? '%' : 'msgs',
        emphasis: i === 0 ? 'featured' : i === 2 ? 'muted' : undefined,
      }),
    ),
  });
}

if (serie && composicao) {
  rows.push({
    id: 'row_analise',
    title: 'Análise',
    itemSizing: 'span',
    blocks: [
      bloco(serie, {
        span: 8,
        unit: 'msgs',
        icon: 'trend',
        description: 'Série diária, sem descontar reprocessamentos.',
      }),
      bloco(composicao, { span: 4, unit: '%' }),
    ],
  });
}

if (ranking) {
  rows.push({
    id: 'row_ranking',
    title: 'Ranking',
    blocks: [bloco(ranking, { span: 12, unit: 'msgs' })],
  });
}

if (tabela) {
  rows.push({
    id: 'row_tabela',
    title: 'Detalhamento',
    blocks: [bloco(tabela, { span: 12 })],
  });
}

if (rows[0]) {
  tabs.push({
    id: 'tab_visao',
    title: 'Visão geral',
    rowIds: [rows[0].id],
    icon: 'overview',
    description: 'Os números que resumem o período.',
    group: 'Operação',
    order: 10,
  });
}
if (rows[1]) {
  tabs.push({
    id: 'tab_analise',
    title: 'Análise',
    rowIds: [rows[1].id],
    icon: 'trend',
    description: 'Como o volume evoluiu e como ele se compõe.',
    group: 'Operação',
    order: 20,
  });
}
if (rows[2]) {
  tabs.push({
    id: 'tab_ranking',
    title: 'Ranking',
    rowIds: [rows[2].id],
    icon: 'list',
    group: 'Detalhamento',
    order: 30,
  });
}
if (rows[3]) {
  tabs.push({
    id: 'tab_tabela',
    title: 'Registros',
    rowIds: [rows[3].id],
    icon: 'table',
    group: 'Detalhamento',
    level: 2,
    order: 40,
  });
}

const draftLayout = {
  theme: { colorMode: 'dark', accent: 'teal', palette: 'multi' },
  filters: [
    { id: 'f_periodo', type: 'date_range', label: 'Período' },
    { id: 'f_canal', type: 'select', label: 'Canal' },
  ],
  rows,
  tabs,
};

const created = await fetch(`${API}/dashboards`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'Operação de Atendimento — demonstração',
    draftLayout,
    visibility: 'ORG',
  }),
});
const body = await created.json();
if (created.status !== 201) {
  console.error('FALHOU', created.status, JSON.stringify(body).slice(0, 800));
  process.exit(1);
}

console.log('dashboard:', body.id);
console.log('rows:', body.draftLayout.rows.length, '| tabs:', body.draftLayout.tabs.length);
console.log('theme preservado:', JSON.stringify(body.draftLayout.theme));
console.log(
  'apresentação preservada no bloco:',
  JSON.stringify(body.draftLayout.rows[0]?.blocks?.[0]),
);
