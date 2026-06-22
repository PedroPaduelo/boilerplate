import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SOCKET_EVENTS,
  type BlockDataEvent,
  type BlockErrorEvent,
  type DashboardDataPayload,
} from '@dashboards/contracts';
import { queryKeys, hashFilters } from '@/shared/lib/query-keys';
import { useDashboardRealtime } from './use-dashboard-realtime';

/**
 * Socket fake controlável: registra handlers via `on`/`off` e dispara eventos
 * server→client via `__receive`. Espelha a superfície usada pelo hook.
 */
const mocks = vi.hoisted(() => {
  type Handler = (payload: unknown) => void;
  const handlers = new Map<string, Set<Handler>>();
  const socket = {
    on(ev: string, h: Handler) {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(h);
      return socket;
    },
    off(ev: string, h: Handler) {
      handlers.get(ev)?.delete(h);
      return socket;
    },
    __receive(ev: string, payload: unknown) {
      handlers.get(ev)?.forEach((h) => h(payload));
    },
    __count(ev: string) {
      return handlers.get(ev)?.size ?? 0;
    },
  };
  return {
    socket,
    joinDashboard: vi.fn(),
    leaveDashboard: vi.fn(),
  };
});

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({
    connected: true,
    getSocket: () => mocks.socket,
    joinDashboard: mocks.joinDashboard,
    leaveDashboard: mocks.leaveDashboard,
  }),
}));

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useDashboardRealtime', () => {
  const filtersHash = hashFilters({});

  beforeEach(() => {
    mocks.joinDashboard.mockClear();
    mocks.leaveDashboard.mockClear();
  });

  it('entra na sala do dashboard ao montar e sai ao desmontar', () => {
    const qc = new QueryClient();
    const { unmount } = renderHook(
      () => useDashboardRealtime({ dashboardId: 'dash1', mode: 'draft', filtersHash }),
      { wrapper: makeWrapper(qc) },
    );
    expect(mocks.joinDashboard).toHaveBeenCalledWith('dash1');
    unmount();
    expect(mocks.leaveDashboard).toHaveBeenCalledWith('dash1');
  });

  it('block:data → setQueryData no cache certo (bloco + payload)', () => {
    const qc = new QueryClient();
    renderHook(
      () => useDashboardRealtime({ dashboardId: 'dash1', mode: 'draft', filtersHash }),
      { wrapper: makeWrapper(qc) },
    );

    const ev: BlockDataEvent = {
      dashboardId: 'dash1',
      blockId: 'b1',
      result: { blockId: 'b1', state: 'success', shape: 'scalar', data: { value: 42 } },
    };
    act(() => mocks.socket.__receive(SOCKET_EVENTS.BLOCK_DATA, ev));

    expect(qc.getQueryData(queryKeys.blockData('b1', filtersHash))).toEqual(ev.result);
    const payload = qc.getQueryData<DashboardDataPayload>(
      queryKeys.dashboardData('dash1', 'draft', filtersHash),
    );
    expect(payload?.blocks.b1).toEqual(ev.result);
  });

  it('block:error → grava estado de erro do bloco', () => {
    const qc = new QueryClient();
    renderHook(
      () => useDashboardRealtime({ dashboardId: 'dash1', mode: 'draft', filtersHash }),
      { wrapper: makeWrapper(qc) },
    );

    const ev: BlockErrorEvent = {
      dashboardId: 'dash1',
      blockId: 'b2',
      error: { code: 'forbidden_chart', message: 'sem acesso' },
    };
    act(() => mocks.socket.__receive(SOCKET_EVENTS.BLOCK_ERROR, ev));

    const result = qc.getQueryData<{ state: string; error?: { message: string } }>(
      queryKeys.blockData('b2', filtersHash),
    );
    expect(result?.state).toBe('error');
    expect(result?.error?.message).toBe('sem acesso');
  });

  it('ignora eventos de OUTRO dashboard', () => {
    const qc = new QueryClient();
    renderHook(
      () => useDashboardRealtime({ dashboardId: 'dash1', mode: 'draft', filtersHash }),
      { wrapper: makeWrapper(qc) },
    );

    const ev: BlockDataEvent = {
      dashboardId: 'OUTRO',
      blockId: 'bX',
      result: { blockId: 'bX', state: 'success', shape: 'scalar', data: { value: 1 } },
    };
    act(() => mocks.socket.__receive(SOCKET_EVENTS.BLOCK_DATA, ev));

    expect(qc.getQueryData(queryKeys.blockData('bX', filtersHash))).toBeUndefined();
  });

  it('remove os handlers no cleanup (sem vazamento)', () => {
    const qc = new QueryClient();
    const { unmount } = renderHook(
      () => useDashboardRealtime({ dashboardId: 'dash1', mode: 'draft', filtersHash }),
      { wrapper: makeWrapper(qc) },
    );
    expect(mocks.socket.__count(SOCKET_EVENTS.BLOCK_DATA)).toBe(1);
    unmount();
    expect(mocks.socket.__count(SOCKET_EVENTS.BLOCK_DATA)).toBe(0);
  });
});
