import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* -------------------------------------------------------------- mocks ------ */

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const update = vi.fn(async () => ({ id: 'd1' }));
const publish = vi.fn(async () => ({ id: 'd1' }));
const unpublish = vi.fn(async () => ({ id: 'd1' }));
const addChart = vi.fn(async () => ({ id: 'd1', draftLayout: { filters: [], rows: [] } }));

vi.mock('../api', () => ({
  dashboardsApi: {
    update: (...a: unknown[]) => update(...(a as [])),
    publish: (...a: unknown[]) => publish(...(a as [])),
    unpublish: (...a: unknown[]) => unpublish(...(a as [])),
    addChart: (...a: unknown[]) => addChart(...(a as [])),
  },
}));

import {
  useAddChartToDashboard,
  usePublishDashboard,
  useUpdateDashboard,
} from '../hooks';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, invalidateSpy, wrapper };
}

/** keys invalidadas (1º elemento do queryKey de cada chamada). */
function invalidatedKeys(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.map((c: unknown[]) =>
    JSON.stringify((c[0] as { queryKey: unknown[] }).queryKey),
  );
}

describe('mutations de dashboard — invalidação de cache (doc 32 §3)', () => {
  beforeEach(() => {
    update.mockClear();
    publish.mockClear();
    unpublish.mockClear();
    addChart.mockClear();
  });

  it('useUpdateDashboard invalida detalhe (draft+published), dados e lista', async () => {
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useUpdateDashboard(), { wrapper });

    await result.current.mutateAsync({ id: 'd1', input: { title: 'x' } });
    await waitFor(() => expect(update).toHaveBeenCalled());

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContain(JSON.stringify(['dashboards']));
    expect(keys).toContain(JSON.stringify(['dashboard', 'd1', 'draft']));
    expect(keys).toContain(JSON.stringify(['dashboard', 'd1', 'published']));
    expect(keys).toContain(JSON.stringify(['dashboard-data', 'd1']));
  });

  it('usePublishDashboard (publish=true) chama publish e invalida o dashboard', async () => {
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => usePublishDashboard(), { wrapper });

    await result.current.mutateAsync({ id: 'd1', publish: true });
    await waitFor(() => expect(publish).toHaveBeenCalled());
    expect(unpublish).not.toHaveBeenCalled();

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContain(JSON.stringify(['dashboard', 'd1', 'draft']));
    expect(keys).toContain(JSON.stringify(['dashboard-data', 'd1']));
  });

  it('usePublishDashboard (publish=false) chama unpublish', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => usePublishDashboard(), { wrapper });
    await result.current.mutateAsync({ id: 'd1', publish: false });
    await waitFor(() => expect(unpublish).toHaveBeenCalled());
    expect(publish).not.toHaveBeenCalled();
  });

  it('useAddChartToDashboard chama POST /blocks e invalida o dashboard', async () => {
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useAddChartToDashboard(), { wrapper });

    await result.current.mutateAsync({ id: 'd1', input: { chartId: 'c1', span: 6 } });
    await waitFor(() => expect(addChart).toHaveBeenCalled());

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContain(JSON.stringify(['dashboard', 'd1', 'draft']));
  });
});
