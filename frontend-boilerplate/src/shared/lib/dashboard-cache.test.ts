import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type {
  BlockDataEvent,
  BlockErrorEvent,
  BlockRunningEvent,
  DashboardDataPayload,
} from '@dashboards/contracts';
import { queryKeys, hashFilters } from './query-keys';
import {
  applyBlockDataEvent,
  errorToResult,
  runningToResult,
  writeBlockResult,
  type DashboardCacheContext,
} from './dashboard-cache';

describe('dashboard-cache (socket → cache)', () => {
  let qc: QueryClient;
  const filtersHash = hashFilters({ depto: 'rh' });
  const ctx: DashboardCacheContext = {
    dashboardId: 'dash1',
    mode: 'draft',
    filtersHash,
  };

  beforeEach(() => {
    qc = new QueryClient();
  });

  it('writeBlockResult grava no bloco isolado E no payload batch', () => {
    const result = {
      blockId: 'b1',
      state: 'success' as const,
      shape: 'scalar' as const,
      data: { value: 42 },
    };
    writeBlockResult(qc, ctx, result);

    expect(qc.getQueryData(queryKeys.blockData('b1', filtersHash))).toEqual(result);

    const payload = qc.getQueryData<DashboardDataPayload>(
      queryKeys.dashboardData('dash1', 'draft', filtersHash),
    );
    expect(payload?.dashboardId).toBe('dash1');
    expect(payload?.mode).toBe('dev'); // draft → dev no payload
    expect(payload?.blocks.b1).toEqual(result);
  });

  it('mescla múltiplos blocos no mesmo payload (não sobrescreve)', () => {
    writeBlockResult(qc, ctx, { blockId: 'b1', state: 'success', shape: 'scalar', data: { value: 1 } });
    writeBlockResult(qc, ctx, { blockId: 'b2', state: 'running' });

    const payload = qc.getQueryData<DashboardDataPayload>(
      queryKeys.dashboardData('dash1', 'draft', filtersHash),
    );
    expect(Object.keys(payload?.blocks ?? {})).toEqual(['b1', 'b2']);
    expect(payload?.blocks.b2.state).toBe('running');
  });

  it('applyBlockDataEvent usa o result do evento block:data', () => {
    const ev: BlockDataEvent = {
      dashboardId: 'dash1',
      blockId: 'b9',
      result: { blockId: 'b9', state: 'success', shape: 'table', data: { columns: [], rows: [] } },
    };
    applyBlockDataEvent(qc, ctx, ev);
    expect(qc.getQueryData(queryKeys.blockData('b9', filtersHash))).toEqual(ev.result);
  });

  it('runningToResult / errorToResult convertem eventos em BlockDataResult', () => {
    const running: BlockRunningEvent = { dashboardId: 'd', blockId: 'b', state: 'running' };
    expect(runningToResult(running)).toEqual({ blockId: 'b', state: 'running' });

    const error: BlockErrorEvent = {
      dashboardId: 'd',
      blockId: 'b',
      error: { code: 'contract_violation', message: 'shape inválido' },
    };
    expect(errorToResult(error)).toEqual({
      blockId: 'b',
      state: 'error',
      error: { code: 'contract_violation', message: 'shape inválido' },
    });
  });
});
