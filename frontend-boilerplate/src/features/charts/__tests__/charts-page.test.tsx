import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Chart } from '../types';

// Polyfills que o Radix (DropdownMenu) usa e o jsdom não implementa.
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
});

const { state, prefetchFn } = vi.hoisted(() => {
  return {
    state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
    prefetchFn: vi.fn(),
  };
});

/**
 * Stub REATIVO do `useDeleteChart`: usa `useState` para `isPending`/`pending`
 * dentro do hook (via `vi.mock`), então o ArtifactCard re-renderiza quando
 * `mutate`/`settle` rodam.
 */
type DeleteMock = {
  isPending: boolean;
  pending: { onSettled?: () => void } | null;
  mutate: ReturnType<typeof vi.fn> & { __wired?: boolean };
  settleOk: () => void;
  settleFail: () => void;
};
const deleteMock: DeleteMock = {
  isPending: false,
  pending: null,
  mutate: vi.fn(),
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

vi.mock('../hooks', async () => {
  const React = await import('react');
  return {
    useCharts: () => ({
      data: { charts, total: 1, page: 1, pageSize: 12, totalPages: 1 },
      isLoading: false,
      isError: false,
    }),
    usePrefetchChart: () => prefetchFn,
    useDuplicateChart: () => ({ mutate: vi.fn(), isPending: false }),
    // Hook REATIVO: useState para isPending/pending, re-renderiza o card.
    useDeleteChart: () => {
      const [isPending, setIsPending] = React.useState(false);
      const [pending, setPending] = React.useState<{ onSettled?: () => void } | null>(
        null,
      );
      if (!deleteMock.mutate.__wired) {
        deleteMock.mutate.mockImplementation(
          (_id: string, options?: { onSettled?: () => void }) => {
            setIsPending(true);
            setPending({ onSettled: options?.onSettled });
          },
        );
        deleteMock.mutate.__wired = true;
      }
      deleteMock.isPending = isPending;
      deleteMock.pending = pending;
      deleteMock.settleOk = () => {
        setIsPending(false);
        const p = pending;
        setPending(null);
        p?.onSettled?.();
      };
      deleteMock.settleFail = () => {
        setIsPending(false);
        const p = pending;
        setPending(null);
        p?.onSettled?.();
      };
      return {
        mutate: deleteMock.mutate,
        isPending,
      };
    },
    usePublishChart: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

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
    // Reseta o mock reativo para que o próximo render religa as closures
    // de useState (evita reutilizar setIsPending/setPending antigos).
    deleteMock.mutate.__wired = false;
    deleteMock.mutate.mockReset();
    deleteMock.isPending = false;
    deleteMock.pending = null;
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
   * FIX DEFINITIVO: o card entra em modo de confirmação INLINE (sem modal,
   * sem overlay, sem portal). Elimina o bug do Radix AlertDialog +
   * react-remove-scroll que deixava a UI travada com `pointer-events: none`
   * no `<body>`.
   */
  it('excluir: card entra em modo de confirmação inline', async () => {
    const user = userEvent.setup();
    renderPage();

    // Card normal (sem data-confirming).
    const card = screen
      .getByText('KPI de Receita')
      .closest('[data-slot="card"]')!;
    expect(card.querySelector('[data-confirming="true"]')).toBeNull();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    const confirmingCard = await screen.findByRole('group', {
      name: /Confirmar exclusão de KPI de Receita/i,
    });
    expect(confirmingCard).toHaveAttribute('data-confirming', 'true');
    expect(
      within(confirmingCard).getByText(/Excluir KPI de Receita\?/),
    ).toBeInTheDocument();
    expect(
      within(confirmingCard).getByRole('button', { name: /Cancelar/i }),
    ).toBeInTheDocument();
    expect(
      within(confirmingCard).getByRole('button', { name: /Sim, excluir/i }),
    ).toBeInTheDocument();
  });

  it('excluir: clicar "Sim, excluir" chama a mutação com o id correto', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    fireEvent.click(await screen.findByTestId('confirm-delete'));
    expect(deleteMock.mutate).toHaveBeenCalledWith('c1', expect.any(Object));
  });

  it('excluir: card SAI do modo de confirmação quando a mutação falha', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    fireEvent.click(screen.getByTestId('confirm-delete'));
    act(() => {
      deleteMock.settleFail();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('group', {
          name: /Confirmar exclusão de KPI de Receita/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('excluir: card SAI do modo de confirmação quando a mutação tem SUCESSO', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    fireEvent.click(screen.getByTestId('confirm-delete'));
    act(() => {
      deleteMock.settleOk();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('group', {
          name: /Confirmar exclusão de KPI de Receita/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('excluir: cancelar NÃO chama a mutação', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    fireEvent.click(screen.getByTestId('cancel-delete'));

    await waitFor(() => {
      expect(
        screen.queryByRole('group', {
          name: /Confirmar exclusão de KPI de Receita/i,
        }),
      ).not.toBeInTheDocument();
    });
    expect(deleteMock.mutate).not.toHaveBeenCalled();
  });

  it('excluir: durante a request, "Sim, excluir" fica disabled e mostra "Excluindo..."', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de KPI de Receita/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Re-busca após re-render (isPending=true no mock reativo).
    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete')).toBeDisabled();
    });
    expect(screen.getByTestId('confirm-delete')).toHaveTextContent(/Excluindo\.\.\./);

    act(() => {
      deleteMock.settleOk();
    });
  });
});
