import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardLayoutFixture } from '@dashboards/contracts';
import { staleTimeFor } from '@/shared/lib/query-policies';
import type { DashboardDetail } from '../types';

/* ---------------------------------------------------------- polyfills ----- */
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
});

/* -------------------------------------------------------------- mocks ------ */

const { authState } = vi.hoisted(() => ({
  authState: {
    user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null,
  },
}));

const detail: DashboardDetail = {
  id: 'dash_1',
  title: 'Dívida Ativa 2026',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'DRAFT',
  draftLayout: dashboardLayoutFixture as never,
  publishedLayout: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  mode: 'draft',
  layout: dashboardLayoutFixture as never,
};

const updateMutate = vi.fn((_vars: unknown, opts?: { onSuccess?: (d?: unknown) => void }) =>
  opts?.onSuccess?.(),
);
const publishMutate = vi.fn((_vars: unknown, opts?: { onSuccess?: (d?: unknown) => void }) =>
  opts?.onSuccess?.(),
);
const addChartMutate = vi.fn();

vi.mock('../hooks', () => ({
  useDashboard: () => ({ data: detail, isLoading: false, isError: false }),
  useUpdateDashboard: () => ({ mutate: updateMutate, isPending: false }),
  usePublishDashboard: () => ({ mutate: publishMutate, isPending: false }),
  useAddChartToDashboard: () => ({ mutate: addChartMutate, isPending: false }),
}));

const useDashboardData = vi.fn((opts?: { mode?: string }) => {
  void opts; // capturado por `mock.calls` para asserção do modo de preview
  return {
    payload: undefined,
    filtersHash: '∅',
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: () => {},
  };
});
vi.mock('../use-dashboard-data', () => ({
  useDashboardData: (opts: unknown) => useDashboardData(opts as never),
}));

vi.mock('@/features/charts/hooks', () => ({
  useCharts: () => ({ data: { charts: [] }, isLoading: false }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// Importado depois dos mocks.
import { DashboardEditor } from '../components/dashboard-editor';

function renderEditor() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/dashboards/${detail.id}/edit`]}>
        <Routes>
          <Route path="/dashboards/:id/edit" element={<DashboardEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardEditor (T-G2)', () => {
  beforeEach(() => {
    updateMutate.mockClear();
    publishMutate.mockClear();
    addChartMutate.mockClear();
    useDashboardData.mockClear();
    authState.user = { id: 'me', role: 'CREATOR' };
    detail.status = 'DRAFT';
    detail.publishedLayout = null;
  });

  it('renderiza o editor (título, badge rascunho, blocos)', () => {
    renderEditor();
    expect(screen.getByDisplayValue('Dívida Ativa 2026')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    // bloco do layout aparece no editor
    expect(screen.getByText('blk_title')).toBeInTheDocument();
  });

  it('editar e salvar dispara update com draftLayout saneado (e valida ok)', async () => {
    renderEditor();
    // muda o título → fica dirty → Salvar habilita
    fireEvent.change(screen.getByDisplayValue('Dívida Ativa 2026'), {
      target: { value: 'Dívida Ativa 2026 (rev)' },
    });
    const save = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);

    expect(updateMutate).toHaveBeenCalledTimes(1);
    const arg = updateMutate.mock.calls[0][0] as {
      id: string;
      input: { title: string; draftLayout: { rows: unknown[] } };
    };
    expect(arg.id).toBe('dash_1');
    expect(arg.input.title).toBe('Dívida Ativa 2026 (rev)');
    expect(arg.input.draftLayout.rows).toHaveLength(3);
  });

  it('layout inválido bloqueia o salvar e mostra erro claro', async () => {
    renderEditor();
    // esvazia o connectionId do 1º bloco de dados (kpi) → layout inválido
    const conns = screen.getAllByLabelText(/Conexão \(connectionId\)/i) as HTMLInputElement[];
    fireEvent.change(conns[0], { target: { value: '' } });

    const save = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);

    expect(await screen.findByText(/Layout inválido/i)).toBeInTheDocument();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('publicar dispara a mutation e reflete status PUBLICADO', async () => {
    renderEditor();
    const publish = screen.getByRole('button', { name: /Publicar/i });
    fireEvent.click(publish);

    expect(publishMutate).toHaveBeenCalledWith(
      { id: 'dash_1', publish: true },
      expect.anything(),
    );
    // onSuccess do mock altera o estado local → badge muda
    await waitFor(() => expect(screen.getByText('Publicado')).toBeInTheDocument());
  });

  it('modo dev (rascunho) busca dados frescos (mode=draft, staleTime 0)', () => {
    renderEditor();
    const lastOpts = useDashboardData.mock.calls.at(-1)?.[0];
    expect(lastOpts?.mode).toBe('draft');
    expect(staleTimeFor('draft')).toBe(0);
  });

  it('RBAC: usuário sem ownership não edita (403)', () => {
    authState.user = { id: 'outro', role: 'CREATOR' }; // não é dono (ownerId="me")
    renderEditor();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Dívida Ativa 2026')).not.toBeInTheDocument();
  });

  it('RBAC: VIEWER não edita (403)', () => {
    authState.user = { id: 'me', role: 'VIEWER' };
    renderEditor();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
  });
});
