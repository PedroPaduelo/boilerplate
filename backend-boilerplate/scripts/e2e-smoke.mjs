#!/usr/bin/env node
/**
 * Smoke e2e do fluxo do PRODUTO (sem o chat) — task [INT].
 *
 * Exercita ponta a ponta contra o servidor REAL (Postgres + Redis + BullMQ +
 * pg-runner + Playmwright/Chromium), na ordem do doc 40:
 *
 *   login → conexão (create + test + schema) → chart (create + publish) →
 *   dashboard (create + add_chart + publish) → data (batch via fila/worker/cache,
 *   modo published com poll até hidratar; modo dev fresco; filtro recomputa só o
 *   afetado) → carga leve (N batches concorrentes, anti-stampede) → share-link
 *   (create + GET público inicia TTL) → export PDF (%PDF).
 *
 * Uso:  node scripts/e2e-smoke.mjs            (BASE=http://localhost:4000)
 *       BASE=http://host:4000 node scripts/e2e-smoke.mjs
 *
 * Sai com código !=0 no primeiro passo que falhar. Cada passo loga PASS/observação.
 */
const BASE = process.env.BASE ?? 'http://localhost:4000';
const EMAIL = process.env.E2E_EMAIL ?? 'admin@prefeitura.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'admin1234';

let pass = 0;
let token = '';
const log = (...a) => console.log(...a);
function ok(msg) {
  pass++;
  log(`  \u2713 ${msg}`);
}
function fail(msg, extra) {
  log(`  \u2717 FAIL: ${msg}`);
  if (extra !== undefined) log('    ', typeof extra === 'string' ? extra : JSON.stringify(extra).slice(0, 600));
  process.exit(1);
}
function assert(cond, msg, extra) {
  if (!cond) fail(msg, extra);
  else ok(msg);
}

async function api(method, path, { body, raw, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth && token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** POST /dashboards/:id/data e faz poll até todos os blocos saírem de 'queued'. */
async function fetchDataSettled(dashId, mode, filters, { maxPolls = 15, intervalMs = 400 } = {}) {
  let last;
  for (let i = 0; i < maxPolls; i++) {
    const r = await api('POST', `/dashboards/${dashId}/data`, { body: { mode, filters } });
    if (r.status !== 200) return r;
    last = r;
    const states = Object.values(r.json.blocks ?? {}).map((b) => b.state);
    if (!states.includes('queued') && !states.includes('running')) return r;
    await sleep(intervalMs);
  }
  return last;
}

async function main() {
  log(`\n=== e2e smoke @ ${BASE} ===\n`);

  // 1) LOGIN -----------------------------------------------------------------
  log('1) auth');
  {
    const r = await api('POST', '/auth/login', { auth: false, body: { email: EMAIL, password: PASSWORD } });
    token = r.json?.token ?? r.json?.accessToken ?? r.json?.data?.token ?? '';
    assert(r.status === 200 && token, 'login admin', r.json);
  }

  // 2) CONNECTION ------------------------------------------------------------
  log('2) conexão');
  const dbUrl = new URL(process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres');
  let connId;
  {
    const r = await api('POST', '/connections', {
      body: {
        name: `e2e-conn-${Date.now()}`,
        description: 'conexão criada pelo smoke e2e',
        type: 'POSTGRES',
        host: dbUrl.hostname,
        port: Number(dbUrl.port || 5432),
        database: dbUrl.pathname.replace(/^\//, '') || 'postgres',
        username: decodeURIComponent(dbUrl.username || 'postgres'),
        password: decodeURIComponent(dbUrl.password || ''),
        sslMode: dbUrl.searchParams.get('sslmode') ?? 'disable',
        visibility: 'ORG',
      },
    });
    connId = r.json?.id;
    assert(r.status === 201 || r.status === 200, 'POST /connections cria conexão', r.json);
    assert(!!connId, 'conexão tem id');
    assert(r.json?.password === undefined && r.json?.passwordCipher === undefined, 'resposta NÃO vaza senha');
  }
  {
    const r = await api('POST', `/connections/${connId}/test`);
    assert(r.status === 200 && r.json?.ok === true, 'POST /connections/:id/test ok=true', r.json);
  }
  {
    const r = await api('GET', `/connections/${connId}/schema`);
    assert(r.status === 200 && (r.json?.tableCount ?? 0) > 0, `GET schema (${r.json?.tableCount} tabelas)`, r.json);
  }

  // 3) CHART (create + publish) ---------------------------------------------
  log('3) chart');
  let chartId;
  {
    const r = await api('POST', '/charts', {
      body: {
        title: `e2e KPI usuários ${Date.now()}`,
        catalogType: 'kpi',
        draftProps: { showDelta: false },
        draftDataBinding: { connectionId: connId, query: 'SELECT COUNT(*)::int AS value FROM users', params: [], ttlSeconds: 120 },
        visibility: 'ORG',
      },
    });
    chartId = r.json?.id;
    assert((r.status === 201 || r.status === 200) && chartId, 'POST /charts cria chart kpi', r.json);
  }
  {
    const r = await api('POST', `/charts/${chartId}/publish`);
    assert(r.status === 200 && r.json?.status === 'PUBLISHED', 'POST /charts/:id/publish', r.json);
  }

  // 4) DASHBOARD (create + add_chart + publish) -----------------------------
  log('4) dashboard');
  let dashId;
  const layout = {
    filters: [{ id: 'f_role', type: 'select', label: 'Papel', default: 'todos' }],
    rows: [
      {
        id: 'r1',
        title: 'Indicadores',
        blocks: [
          {
            id: 'b_bar',
            type: 'bar_chart',
            span: 8,
            props: { orientation: 'vertical', stacked: false },
            dataBinding: {
              connectionId: connId,
              query:
                "SELECT role::text AS x, COUNT(*)::int AS y FROM users WHERE ($1::text IS NULL OR $1 = 'todos' OR role::text = $1) GROUP BY role ORDER BY role",
              params: [{ filterId: 'f_role', as: 'role' }],
              ttlSeconds: 120,
            },
          },
          {
            id: 'b_table',
            type: 'table',
            span: 4,
            props: { pageSize: 5 },
            dataBinding: {
              connectionId: connId,
              query: "SELECT table_name AS name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
              ttlSeconds: 120,
            },
          },
        ],
      },
    ],
  };
  {
    const r = await api('POST', '/dashboards', {
      body: { title: `e2e Dashboard ${Date.now()}`, draftLayout: layout, visibility: 'ORG' },
    });
    dashId = r.json?.id;
    assert((r.status === 201 || r.status === 200) && dashId, 'POST /dashboards cria dashboard', r.json);
  }
  {
    // add_chart_to_dashboard: anexa o chart publicado como bloco kpi (props.chartId)
    const r = await api('POST', `/dashboards/${dashId}/blocks`, { body: { chartId, rowId: 'r1', span: 4 } });
    assert(r.status === 200 || r.status === 201, 'POST /dashboards/:id/blocks (add_chart)', r.json);
  }
  {
    const r = await api('POST', `/dashboards/${dashId}/publish`);
    assert(r.status === 200 && r.json?.status === 'PUBLISHED', 'POST /dashboards/:id/publish', r.json);
  }

  // 5) DATA — published (fila/worker/cache) ---------------------------------
  log('5) data published (fila → worker → cache → success)');
  {
    const first = await api('POST', `/dashboards/${dashId}/data`, { body: { mode: 'published', filters: { f_role: 'todos' } } });
    const states = Object.values(first.json?.blocks ?? {}).map((b) => b.state);
    assert(first.status === 200, 'batch published responde 200', first.json);
    assert(states.includes('queued'), 'blocos em cache miss vão para queued (enfileirados)', states);

    const settled = await fetchDataSettled(dashId, 'published', { f_role: 'todos' });
    const blocks = settled.json?.blocks ?? {};
    const allSuccess = Object.values(blocks).every((b) => b.state === 'success');
    assert(allSuccess, 'após worker processar a fila, todos os blocos = success', Object.fromEntries(Object.entries(blocks).map(([k, v]) => [k, v.state])));
    assert(Object.values(blocks).some((b) => b.meta?.cached === true), 'segunda leitura vem do CACHE (meta.cached=true)');
  }

  // 6) DATA — dev fresco (sem cache) ----------------------------------------
  log('6) data dev (inline, sempre fresco)');
  {
    const r = await api('POST', `/dashboards/${dashId}/data`, { body: { mode: 'draft', filters: { f_role: 'todos' } } });
    const blocks = r.json?.blocks ?? {};
    assert(r.json?.mode === 'dev', 'modo dev retornado');
    assert(Object.values(blocks).every((b) => b.state === 'success'), 'dev hidrata inline (success)');
    assert(Object.values(blocks).every((b) => b.meta?.cached === false), 'dev NUNCA usa cache (meta.cached=false)');
  }

  // 7) FILTRO recomputa só o afetado ----------------------------------------
  log('7) filtro recomputa só o bloco afetado');
  {
    const r = await api('POST', `/dashboards/${dashId}/data`, { body: { mode: 'published', filters: { f_role: 'ADMIN' } } });
    const blocks = r.json?.blocks ?? {};
    // b_bar usa f_role (param) → cacheKey muda → queued; b_table e kpi não → cached
    assert(blocks.b_bar?.state === 'queued', 'bloco com param do filtro recomputa (queued)', blocks.b_bar);
    assert(blocks.b_table?.state === 'success' && blocks.b_table?.meta?.cached === true, 'bloco SEM o filtro permanece em cache (não recomputa)', blocks.b_table);
  }

  // 8) CARGA LEVE — N batches concorrentes (anti-stampede, sem travar) -------
  log('8) carga leve (10 batches concorrentes, fila não trava)');
  {
    const t0 = Date.now();
    const reqs = Array.from({ length: 10 }, () =>
      api('POST', `/dashboards/${dashId}/data`, { body: { mode: 'published', filters: { f_role: 'CREATOR' } } }),
    );
    const results = await Promise.all(reqs);
    const allOk = results.every((r) => r.status === 200);
    assert(allOk, '10 batches concorrentes responderam 200 (sem travar)', results.map((r) => r.status));
    log(`    (10 requisições concorrentes em ${Date.now() - t0}ms)`);
    const settled = await fetchDataSettled(dashId, 'published', { f_role: 'CREATOR' });
    assert(Object.values(settled.json?.blocks ?? {}).every((b) => b.state === 'success'), 'todos os blocos hidratam após carga');
  }

  // 9) SHARE-LINK (create + GET público inicia TTL) -------------------------
  log('9) share-link');
  let token2;
  {
    const r = await api('POST', '/share', { body: { targetType: 'DASHBOARD', targetId: dashId, durationSeconds: 3600 } });
    token2 = r.json?.token;
    assert((r.status === 201 || r.status === 200) && token2, 'POST /share cria link', r.json);
    assert(r.json?.firstAccessedAt == null && r.json?.expiresAt == null, 'TTL ainda NÃO iniciou (firstAccessedAt/expiresAt null)');
  }
  {
    const r = await api('GET', `/public/${token2}`, { auth: false });
    assert(r.status === 200 && r.json?.targetType === 'DASHBOARD' && r.json?.dashboard?.id === dashId, 'GET /public/:token retorna dashboard published', r.json);
    assert(r.json?.expiresAt != null, 'TTL iniciou na 1ª abertura (expiresAt setado)');
    // T-G1 bugfix do share público: payload embutido no GET /public/:token.
    assert(r.json?.dashboard?.publishedDataPayload != null, 'GET /public/:token inclui publishedDataPayload (T-G1)');
  }
  {
    // Endpoint DEDICADO de dados do share público (T-G1). Sem auth; retorna
    // o snapshot materializado no publish, no shape do DashboardDataPayload
    // (modo 'published'), com blocos já no shape — sem dataBinding cru.
    const r = await api('GET', `/public/${token2}/data`, { auth: false });
    assert(r.status === 200, 'GET /public/:token/data responde 200 (T-G1)', r.json);
    assert(r.json?.mode === 'published' && typeof r.json?.blocks === 'object', 'payload tem mode=published e blocks', r.json);
    const sample = Object.values(r.json?.blocks ?? {})[0];
    assert(sample && sample.state === 'success' && sample.data != null, 'pelo menos 1 bloco hidrata com state=success', sample);
    // checagem de segurança (review T-B4): NUNCA vaza dataBinding cru.
    const flat = JSON.stringify(r.json);
    assert(!flat.includes('connectionId') && !flat.includes('publishedDataBinding') && !flat.includes('"query"'), 'NÃO vaza connectionId/dataBinding/query', flat.slice(0, 200));
  }
  {
    // Bloqueios: token inexistente → 404 em AMBAS as rotas públicas.
    const r1 = await api('GET', `/public/zzz_404_${Date.now()}`, { auth: false });
    assert(r1.status === 404, 'GET /public/<inexistente> → 404');
    const r2 = await api('GET', `/public/zzz_404_${Date.now()}/data`, { auth: false });
    assert(r2.status === 404, 'GET /public/<inexistente>/data → 404 (T-G1)');
  }
  {
    // Bloqueio: token revogado → 403 em AMBAS as rotas públicas.
    const created = await api('POST', '/share', { body: { targetType: 'DASHBOARD', targetId: dashId, durationSeconds: 3600 } });
    const revTok = created.json?.token;
    const revId = created.json?.id;
    if (revTok && revId) {
      await api('DELETE', `/share/${revId}`);
      const r1 = await api('GET', `/public/${revTok}`, { auth: false });
      assert(r1.status === 403, 'GET /public/<revoked> → 403');
      const r2 = await api('GET', `/public/${revTok}/data`, { auth: false });
      assert(r2.status === 403, 'GET /public/<revoked>/data → 403 (T-G1)');
    }
  }

  // 10) EXPORT PDF (sync, %PDF) ---------------------------------------------
  log('10) export PDF');
  {
    const res = await api('POST', `/export/dashboards/${dashId}/pdf`, { body: { mode: 'published', filters: { f_role: 'todos' }, async: false }, raw: true });
    assert(res.status === 200, 'POST /export/.../pdf (sync) responde 200', String(res.status));
    const ct = res.headers.get('content-type') || '';
    assert(ct.includes('application/pdf'), `content-type = application/pdf (${ct})`);
    const buf = Buffer.from(await res.arrayBuffer());
    assert(buf.slice(0, 5).toString('latin1') === '%PDF-', `magic bytes = %PDF (bytes=${buf.length})`);
  }

  log(`\n=== e2e smoke OK — ${pass} asserts passaram ===\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error('e2e smoke crashed:', e);
  process.exit(1);
});
