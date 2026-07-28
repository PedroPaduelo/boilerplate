/**
 * Testes dos contratos: schemas compilam no ajv, fixtures validam, casos negativos
 * são rejeitados. Rodar: `npm test` (node --import tsx --test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDashboardLayout,
  validateDashboardConfig,
  validateBlockManifest,
  validateDashboardDataPayload,
  validateBlockDataByShape,
  validateBlockDataEvent,
  validateCreateDashboardRequest,
  formatErrors,
  assertValid,
  ContractValidationError,
} from '../src/validation/validator';
import {
  dashboardConfigFixture,
  dashboardLayoutFixture,
  dashboardLayoutWithTabsFixture,
  dashboardDataPayloadFixture,
  baseManifests,
} from '../src/fixtures';
import { dashboardRoom, SOCKET_EVENTS } from '../src/socket/events';
import {
  IMPLICIT_TAB_ID,
  hasExplicitTabs,
  layoutForTab,
  pickActiveTab,
  resolveDashboardTabs,
} from '../src/layout/tabs';

test('DashboardLayout fixture valida contra o schema', () => {
  const ok = validateDashboardLayout(dashboardLayoutFixture);
  assert.ok(ok, formatErrors(validateDashboardLayout.errors));
});

test('DashboardConfig fixture valida contra o schema (doc 20)', () => {
  const ok = validateDashboardConfig(dashboardConfigFixture);
  assert.ok(ok, formatErrors(validateDashboardConfig.errors));
});

test('os 7 manifestos da base validam contra BlockManifestSchema', () => {
  assert.equal(baseManifests.length, 7);
  for (const m of baseManifests) {
    const ok = validateBlockManifest(m);
    assert.ok(ok, `${m.type}: ${formatErrors(validateBlockManifest.errors)}`);
  }
});

test('manifestos narrativos (title/rich_text) não têm dataContract; charts têm', () => {
  const byType = Object.fromEntries(baseManifests.map((m) => [m.type, m]));
  assert.equal(byType.title.dataContract, undefined);
  assert.equal(byType.rich_text.dataContract, undefined);
  assert.ok(byType.bar_chart.dataContract);
  assert.equal(byType.bar_chart.dataContract?.shape, 'series');
  assert.equal(byType.kpi.dataContract?.shape, 'scalar');
  assert.equal(byType.donut.dataContract?.shape, 'categorical');
  assert.equal(byType.table.dataContract?.shape, 'table');
});

test('DashboardDataPayload (batch) fixture valida', () => {
  const ok = validateDashboardDataPayload(dashboardDataPayloadFixture);
  assert.ok(ok, formatErrors(validateDashboardDataPayload.errors));
});

test('o data de cada bloco valida contra o shape declarado', () => {
  for (const [, result] of Object.entries(dashboardDataPayloadFixture.blocks)) {
    if (result.state === 'success' && result.shape && result.data !== undefined) {
      const { valid, errors } = validateBlockDataByShape(result.shape, result.data);
      assert.ok(valid, `${result.blockId}: ${formatErrors(errors)}`);
    }
  }
});

test('payload de evento block:data valida (result = BlockDataResult)', () => {
  const evt = {
    dashboardId: 'dash_divida_ativa_2026',
    blockId: 'blk_kpi_total',
    result: dashboardDataPayloadFixture.blocks.blk_kpi_total,
  };
  const ok = validateBlockDataEvent(evt);
  assert.ok(ok, formatErrors(validateBlockDataEvent.errors));
});

test('CreateDashboardRequest valida com layout embutido', () => {
  const ok = validateCreateDashboardRequest({
    title: 'Novo dashboard',
    visibility: 'PRIVATE',
    layout: dashboardLayoutFixture,
  });
  assert.ok(ok, formatErrors(validateCreateDashboardRequest.errors));
});

test('helpers de socket', () => {
  assert.equal(dashboardRoom('abc'), 'dashboard:abc');
  assert.equal(SOCKET_EVENTS.BLOCK_DATA, 'block:data');
});

// ---------- casos NEGATIVOS ----------
test('NEGATIVO: layout com span fora do grid (13) é rejeitado', () => {
  const bad = {
    filters: [],
    rows: [
      { id: 'r1', blocks: [{ id: 'b1', type: 'kpi', span: 13, props: {} }] },
    ],
  };
  assert.equal(validateDashboardLayout(bad), false);
});

test('NEGATIVO: filtro com type desconhecido é rejeitado', () => {
  const bad = {
    filters: [{ id: 'f1', type: 'rgb_picker', label: 'X' }],
    rows: [],
  };
  assert.equal(validateDashboardLayout(bad), false);
});

test('NEGATIVO: manifesto sem campos obrigatórios é rejeitado', () => {
  assert.equal(validateBlockManifest({ type: 'x' }), false);
});

test('NEGATIVO: dado series com y não-numérico é rejeitado', () => {
  const { valid } = validateBlockDataByShape('series', [{ x: 'Jan', y: 'muito' }]);
  assert.equal(valid, false);
});

test('assertValid lança ContractValidationError em payload inválido', () => {
  assert.throws(
    () => assertValid(validateDashboardLayout, { filters: 'nope' }, 'layout'),
    ContractValidationError,
  );
  // e retorna o valor tipado quando válido
  const out = assertValid(validateDashboardLayout, dashboardLayoutFixture, 'layout');
  assert.equal(out.rows.length, 3);
});

// =============================================================================
// ABAS (doc 40) — contrato + normalizador
// =============================================================================
//
// O foco destes testes é a RETROCOMPATIBILIDADE e o invariante de que nenhum
// bloco fica invisível. Os dois fixtures usam exatamente as MESMAS `rows`, então
// dá para comparar "com abas" × "sem abas" sem margem para dúvida.

/** Ids de todas as rows de uma lista de abas resolvidas, na ordem de render. */
function rowIdsOf(tabs: ReturnType<typeof resolveDashboardTabs>): string[] {
  return tabs.flatMap((tab) => tab.rows.map((row) => row.id));
}

test('RETROCOMPAT: layout legado (sem `tabs`) continua válido no schema', () => {
  // Este é o teste que prova a promessa central: o JSON que já está no banco
  // hoje (`{ filters, rows }`) segue passando depois da mudança de contrato.
  assert.ok(!('tabs' in dashboardLayoutFixture));
  const ok = validateDashboardLayout(dashboardLayoutFixture);
  assert.ok(ok, formatErrors(validateDashboardLayout.errors));
});

test('RETROCOMPAT: layout legado é lido como UMA aba implícita com todas as rows', () => {
  const tabs = resolveDashboardTabs(dashboardLayoutFixture);

  assert.equal(tabs.length, 1);
  assert.equal(tabs[0].id, IMPLICIT_TAB_ID);
  assert.equal(tabs[0].isImplicit, true);
  // ordem e conteúdo IDÊNTICOS ao layout original — é isso que garante que a
  // tela atual não muda de comportamento para quem não usa abas.
  assert.deepEqual(rowIdsOf(tabs), dashboardLayoutFixture.rows.map((r) => r.id));
  assert.equal(hasExplicitTabs(dashboardLayoutFixture), false);
});

test('layout COM abas valida contra o schema', () => {
  const ok = validateDashboardLayout(dashboardLayoutWithTabsFixture);
  assert.ok(ok, formatErrors(validateDashboardLayout.errors));
  assert.equal(hasExplicitTabs(dashboardLayoutWithTabsFixture), true);
});

test('abas respeitam a ordem declarada em rowIds (não a ordem de `rows`)', () => {
  const tabs = resolveDashboardTabs(dashboardLayoutWithTabsFixture);
  // a aba declara ['row_evolucao', 'row_intro'] — invertido em relação a `rows`.
  assert.equal(tabs[0].rows[0].id, 'row_evolucao');
  assert.equal(tabs[0].rows[1].id, 'row_intro');
});

test('rowId inexistente é ignorado (não cria linha fantasma)', () => {
  const tabs = resolveDashboardTabs(dashboardLayoutWithTabsFixture);
  const detalhe = tabs.find((t) => t.id === 'tab_detalhe');
  assert.ok(detalhe);
  // 'row_fantasma' não existe em `rows` → some, sem quebrar a aba.
  assert.equal(
    detalhe.rows.some((r) => r.id === 'row_fantasma'),
    false,
  );
});

test('INVARIANTE: nenhum bloco fica invisível — união das abas === layout.rows', () => {
  // Este é o teste que impede a pior falha possível deste desenho: linha órfã
  // (existe em `rows`, nenhuma aba a cita) sumir da tela SEM erro.
  for (const layout of [dashboardLayoutFixture, dashboardLayoutWithTabsFixture]) {
    const rendered = rowIdsOf(resolveDashboardTabs(layout));
    assert.deepEqual(
      [...rendered].sort(),
      layout.rows.map((r) => r.id).sort(),
      'toda row do layout precisa aparecer em exatamente uma aba',
    );
    // e nenhuma repetida (id de bloco duplicado quebraria o mapa do batch).
    assert.equal(new Set(rendered).size, rendered.length);
  }
});

test('linha órfã é recuperada na PRIMEIRA aba', () => {
  const tabs = resolveDashboardTabs(dashboardLayoutWithTabsFixture);
  // `row_detalhe` não é citada por nenhuma aba do fixture.
  assert.ok(tabs[0].rows.some((r) => r.id === 'row_detalhe'));
});

test('rowId repetido em duas abas: a primeira vence (linha nunca duplica)', () => {
  const layout = {
    filters: [],
    rows: [{ id: 'r1', blocks: [] }],
    tabs: [
      { id: 't1', title: 'A', rowIds: ['r1'] },
      { id: 't2', title: 'B', rowIds: ['r1'] },
    ],
  };
  const tabs = resolveDashboardTabs(layout);
  assert.equal(tabs[0].rows.length, 1);
  assert.equal(tabs[1].rows.length, 0);
});

test('pickActiveTab cai na primeira aba quando o id pedido não existe', () => {
  const tabs = resolveDashboardTabs(dashboardLayoutWithTabsFixture);
  // link antigo / aba removida não pode resultar em tela vazia.
  assert.equal(pickActiveTab(tabs, 'tab_que_sumiu')?.id, tabs[0].id);
  assert.equal(pickActiveTab(tabs, null)?.id, tabs[0].id);
  assert.equal(pickActiveTab(tabs, 'tab_detalhe')?.id, 'tab_detalhe');
});

test('layoutForTab devolve só as rows da aba e NÃO vaza `tabs` para o renderer', () => {
  const tabs = resolveDashboardTabs(dashboardLayoutWithTabsFixture);
  const forTab = layoutForTab(dashboardLayoutWithTabsFixture, tabs[1]);

  assert.equal(forTab.tabs, undefined);
  assert.deepEqual(forTab.rows, tabs[1].rows);
  // filtros são do dashboard inteiro, não da aba — seguem inteiros.
  assert.equal(forTab.filters.length, dashboardLayoutWithTabsFixture.filters.length);
});

test('resolveDashboardTabs é defensivo com layout nulo/vazio', () => {
  assert.deepEqual(resolveDashboardTabs(undefined)[0].rows, []);
  assert.deepEqual(resolveDashboardTabs({ filters: [], rows: [], tabs: [] })[0].rows, []);
});

// ---------- casos NEGATIVOS de aba ----------
test('NEGATIVO: aba sem `title` é rejeitada (aba sem nome é inacessível)', () => {
  const bad = { filters: [], rows: [], tabs: [{ id: 't1', rowIds: [] }] };
  assert.equal(validateDashboardLayout(bad), false);
});

test('NEGATIVO: aba sem `rowIds` é rejeitada', () => {
  const bad = { filters: [], rows: [], tabs: [{ id: 't1', title: 'A' }] };
  assert.equal(validateDashboardLayout(bad), false);
});

test('NEGATIVO: aba com campo desconhecido é rejeitada (additionalProperties)', () => {
  const bad = {
    filters: [],
    rows: [],
    tabs: [{ id: 't1', title: 'A', rowIds: [], icone: 'x' }],
  };
  assert.equal(validateDashboardLayout(bad), false);
});
