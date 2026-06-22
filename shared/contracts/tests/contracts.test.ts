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
  dashboardDataPayloadFixture,
  baseManifests,
} from '../src/fixtures';
import { dashboardRoom, SOCKET_EVENTS } from '../src/socket/events';

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
    visibility: 'private',
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
