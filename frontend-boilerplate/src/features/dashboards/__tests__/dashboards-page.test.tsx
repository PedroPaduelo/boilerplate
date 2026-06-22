import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Dashboard } from '../types';

// Polyfills que o Radix (DropdownMenu) usa e o jsdom não implementa.
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
});

/* ------------------------------------------------------------------ mocks -- */

const { state, prefetchFn, deleteMock } = vi.hoisted(() => {
  type Pending = { onSettled?: () => void } | null;
  const deleteMock = {
    isPending: false,
    pending: null as Pending,
    mutate: vi.fn((_id: string, options?: { onSettled?: () => void }) => {
      deleteMock.isPending = true;
      deleteMock.pending = { onSettled: options?.onSettled };
    }),
    settleOk: () => {
      deleteMock.isPending = false;
      deleteMock.pending?.onSettled?.();
      deleteMock.pending = null;
    },
    settleFail: () => {
      deleteMock.isPending = false;
      deleteMock.pending?.onSettled?.();
      deleteMock.pending = null;
    },
  };
  return {
    // Estado de auth mutável entre testes (papel/usuário logado).
    state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
    prefetchFn: vi.fn(),
    deleteMock,
  };
});

const dashboards: Dashboard[] = [
  {
    id: 'd1',
    title: 'Vendas Mensais',
    ownerId: 'me',
    departmentId: null,
    visibility: 'ORG',
    status: 'PUBLISHED',
    draftLayout: { filters: [], rows: [] },
    publishedLayout: { filters: [], rows: [] },
    publishedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'd2',
    title: 'Receita por Região',
    ownerId: 'someone-else',
    departmentId: null,
    visibility: 'DEPARTMENT',
    status: 'DRAFT',
    draftLayout: { filters: [], rows: [] },
    publishedLayout: null,
    publishedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

/**
 * Stub do ConfirmDeleteDialog. Em vez de montar Radix AlertDialog (que
 * dispara focus trap e loop de eventos no jsdom), capturamos as props e
 * renderizamos um botão simples que exercita `onConfirm`. Mantém o teste
 * FOCADO no fluxo "mutation erro → dialog fecha", que é o fix.
 */
type CapturedDialogProps = {
  open: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  title: string;
};
const captured: { current: CapturedDialogProps | null } = { current: null };

vi.mock('@/shared/components/confirm-delete-dialog', () => ({
  ConfirmDeleteDialog: (props: CapturedDialogProps) => {
    captured.current = props;
    if (!props.open) return null;
    return (
      <div data-testid="confirm-delete-stub" data-state="open">
        <h2>{props.title}</h2>
        <p data-testid="item-name">{props.itemName ?? ''}</p>
        <button
          type="button"
          onClick={props.onConfirm}
          disabled={props.isPending}
          data-testid="confirm-btn"
        >
          {props.isPending ? 'Excluindo...' : 'Excluir'}
        </button>
        <button
          type="button"
          onClick={() => props.onOpenChange(false)}
          data-testid="cancel-btn"
        >
          Cancelar
        </button>
      </div>
    );
  },
}));

vi.mock('../hooks', () => ({
  useDashboards: () => ({
    data: {
      dashboards,
      total: dashboards.length,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
  }),
  usePrefetchDashboard: () => prefetchFn,
  useDuplicateDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteDashboard: () => ({
    mutate: deleteMock.mutate,
    get isPending() {
      return deleteMock.isPending;
    },
  }),
  usePublishDashboard: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({ data: { departments: [] } }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

// Importado depois dos mocks.
import { DashboardsPage } from '../components/dashboards-page';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardsPage', () => {
  beforeEach(() => {
    prefetchFn.mockClear();
    deleteMock.mutate.mockClear();
    deleteMock.isPending = false;
    deleteMock.pending = null;
    captured.current = null;
    state.user = { id: 'me', role: 'CREATOR' };
  });

  it('renderiza os cards da lista (dados mock)', () => {
    renderPage();
    expect(screen.getByText('Vendas Mensais')).toBeInTheDocument();
    expect(screen.getByText('Receita por Região')).toBeInTheDocument();
  });

  it('dispara prefetch ao passar o mouse no card (hover)', () => {
    renderPage();
    const card = screen.getByText('Vendas Mensais').closest('[data-slot="card"]')!;
    fireEvent.mouseEnter(card);
    expect(prefetchFn).toHaveBeenCalledWith('d1', 'published');
  });

  it('VIEWER NÃO vê ações de editar/publicar/excluir no menu', async () => {
    state.user = { id: 'viewer', role: 'VIEWER' };
    const user = userEvent.setup();
    renderPage();

    // Abre o menu de ações do primeiro card.
    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Abrir/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('menuitem', { name: /Exportar/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Editar/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /Despublicar|Publicar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Excluir/i })).not.toBeInTheDocument();
  });

  it('CREATOR dono vê editar e despublicar (publicado próprio)', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Editar/i })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('menuitem', { name: /Despublicar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Excluir/i })).toBeInTheDocument();
  });

  /**
   * FIX DO BUG: ConfirmDeleteDialog FECHA após falha da mutation.
   * O stub captura as props do diálogo; após o `settleFail` (que dispara
   * `onSettled` → `close()` no hook), o dialog deve receber `open=false`.
   * Antes do fix, só `onSuccess` resetava o state e a UI travava.
   */
  it('excluir: dialog FECHA quando a mutation falha (onSettled → close)', async () => {
    const user = userEvent.setup();
    renderPage();

    // Abre o menu de ações do primeiro card e clica Excluir.
    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    // Dialog visível com o nome do item.
    expect(screen.getByTestId('confirm-delete-stub')).toBeInTheDocument();
    expect(captured.current?.itemName).toBe('Vendas Mensais');
    expect(captured.current?.open).toBe(true);

    // Confirma a exclusão.
    const confirmBtn = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmBtn);
    expect(deleteMock.mutate).toHaveBeenCalledWith('d1', expect.any(Object));

    // Simula erro: onSettled é disparado, hook chama close().
    deleteMock.settleFail();

    // Dialog FECHOU (stub retorna null quando open=false).
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-stub')).not.toBeInTheDocument();
    });
    expect(captured.current?.open).toBe(false);
  });

  it('excluir: dialog FECHA quando a mutation tem SUCESSO', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    expect(screen.getByTestId('confirm-delete-stub')).toBeInTheDocument();
    const confirmBtn = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmBtn);

    deleteMock.settleOk();

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-stub')).not.toBeInTheDocument();
    });
    expect(captured.current?.open).toBe(false);
  });

  it('excluir: cancelar NÃO chama a mutação', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    expect(screen.getByTestId('confirm-delete-stub')).toBeInTheDocument();

    // Clica em Cancelar (fireEvent evita checagem de pointer-events do
    // overlay do DropdownMenu que está fechando nesse momento).
    const cancelBtn = screen.getByTestId('cancel-btn');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-stub')).not.toBeInTheDocument();
    });
    expect(deleteMock.mutate).not.toHaveBeenCalled();
  });
});
