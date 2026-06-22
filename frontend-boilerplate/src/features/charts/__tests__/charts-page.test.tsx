import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Chart } from '../types';

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
    state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
    prefetchFn: vi.fn(),
    deleteMock,
  };
});

const charts: Chart[] = [
  {
    id: 'c1',
    title: 'KPI de Receita',
    catalogType: 'kpi',
    ownerId: 'me',
    departmentId: null,
    visibility: 'ORG',
    status: 'PUBLISHED',
    draftProps: {},
    draftDataBinding: { connectionId: 'conn', query: 'select 1' },
    publishedProps: {},
    publishedDataBinding: { connectionId: 'conn', query: 'select 1' },
    publishedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

/**
 * Stub do ConfirmDeleteDialog para evitar o focus trap do Radix AlertDialog
 * em jsdom. Capturamos as props para asserir o estado do diálogo.
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
  useCharts: () => ({
    data: { charts, total: 1, page: 1, pageSize: 12, totalPages: 1 },
    isLoading: false,
    isError: false,
  }),
  usePrefetchChart: () => prefetchFn,
  useDuplicateChart: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteChart: () => ({
    mutate: deleteMock.mutate,
    get isPending() {
      return deleteMock.isPending;
    },
  }),
  usePublishChart: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({ data: { departments: [] } }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

import { ChartsPage } from '../components/charts-page';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChartsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChartsPage', () => {
  beforeEach(() => {
    prefetchFn.mockClear();
    deleteMock.mutate.mockClear();
    deleteMock.isPending = false;
    deleteMock.pending = null;
    captured.current = null;
    state.user = { id: 'me', role: 'CREATOR' };
  });

  it('renderiza os cards de gráficos (dados mock)', () => {
    renderPage();
    expect(screen.getByText('KPI de Receita')).toBeInTheDocument();
  });

  it('dispara prefetch no hover do card', () => {
    renderPage();
    const card = screen.getByText('KPI de Receita').closest('[data-slot="card"]')!;
    fireEvent.mouseEnter(card);
    expect(prefetchFn).toHaveBeenCalledWith('c1', 'published');
  });

  /**
   * FIX DO BUG: ConfirmDeleteDialog FECHA após falha da mutation. Antes do
   * `useConfirmDelete`, só `onSuccess` resetava o state e a UI travava com
   * o overlay Radix preso em qualquer falha de rede/500/404.
   */
  it('excluir: dialog FECHA quando a mutation falha (onSettled → close)', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    expect(screen.getByTestId('confirm-delete-stub')).toBeInTheDocument();
    expect(captured.current?.itemName).toBe('KPI de Receita');
    expect(captured.current?.open).toBe(true);

    const confirmBtn = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmBtn);
    expect(deleteMock.mutate).toHaveBeenCalledWith('c1', expect.any(Object));

    deleteMock.settleFail();

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-stub')).not.toBeInTheDocument();
    });
    expect(captured.current?.open).toBe(false);
  });

  it('excluir: dialog FECHA quando a mutation tem SUCESSO', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    expect(screen.getByTestId('confirm-delete-stub')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm-btn'));

    deleteMock.settleOk();

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-stub')).not.toBeInTheDocument();
    });
    expect(captured.current?.open).toBe(false);
  });

  it('excluir: cancelar NÃO chama a mutação', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    expect(screen.getByTestId('confirm-delete-stub')).toBeInTheDocument();

    // fireEvent evita checagem de pointer-events do overlay do DropdownMenu
    // que está fechando nesse momento.
    fireEvent.click(screen.getByTestId('cancel-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-stub')).not.toBeInTheDocument();
    });
    expect(deleteMock.mutate).not.toHaveBeenCalled();
  });
});