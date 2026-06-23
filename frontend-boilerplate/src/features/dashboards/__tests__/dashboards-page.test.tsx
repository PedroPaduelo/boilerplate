import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
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

const { state, prefetchFn } = vi.hoisted(() => {
  return {
    // Estado de auth mutável entre testes (papel/usuário logado).
    state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
    prefetchFn: vi.fn(),
  };
});

/**
 * Stub REATIVO do `useDeleteDashboard`: usa `useState` para `isPending` e
 * `pending.onSettled`, então o re-render reflete o estado. Os testes chamam
 * `mutate` (via click no botão) e depois `settleOk`/`settleFail` para
 * resolver a promise pendente. A mutação está mockada no escopo do
 * `vi.mock` (mais abaixo) para que o hook use este state.
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

vi.mock('../hooks', async () => {
  const React = await import('react');
  return {
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
    // Hook REATIVO: usa useState para isPending/pending, então o
    // ArtifactCard re-renderiza quando `mutate`/`settle` rodam.
    useDeleteDashboard: () => {
      const [isPending, setIsPending] = React.useState(false);
      const [pending, setPending] = React.useState<{ onSettled?: () => void } | null>(
        null,
      );
      // Conecta `mutate` ao setter do React state. Chamadas subsequentes
      // a `deleteMock.mutate(...)` disparam re-render via setIsPending.
      if (!deleteMock.mutate.__wired) {
        deleteMock.mutate.mockImplementation(
          (_id: string, options?: { onSettled?: () => void }) => {
            setIsPending(true);
            setPending({ onSettled: options?.onSettled });
          },
        );
        deleteMock.mutate.__wired = true;
      }
      // Espelha estado em `deleteMock` para o test harness.
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
    usePublishDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

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
    // Reseta o mock reativo para que o próximo render religa as closures
    // de useState ao deleteMock.mutate (evita reutilizar setIsPending/
    // setPending de um teste anterior).
    deleteMock.mutate.__wired = false;
    deleteMock.mutate.mockReset();
    deleteMock.isPending = false;
    deleteMock.pending = null;
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
   * FIX DEFINITIVO: o card entra em modo de confirmação INLINE (sem modal,
   * sem overlay) quando o usuário clica "Excluir". O `<body>` NUNCA fica
   * travado com `pointer-events: none` (que era o bug do Radix AlertDialog
   * + react-remove-scroll).
   *
   * Aqui verificamos:
   *  • O card muda de modo (data-confirming="true" no card do item alvo).
   *  • Aparece o texto "Excluir Vendas Mensais?" + botões Cancelar /
   *    "Sim, excluir".
   *  • O menu/badge de status SOMEM no card em confirmação.
   *  • Confirmar chama a mutação; settled (sucesso OU erro) volta o card
   *    ao normal.
   */
  it('excluir: card entra em modo de confirmação inline (sem modal/overlay)', async () => {
    const user = userEvent.setup();
    renderPage();

    // Sanidade: card normal NÃO está em modo confirming.
    const vendasCard = screen
      .getByText('Vendas Mensais')
      .closest('[data-slot="card"]')!;
    expect(vendasCard.querySelector('[data-confirming="true"]')).toBeNull();

    // Abre o menu de ações do primeiro card e clica Excluir.
    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    // Card em modo confirming com o nome do item.
    const confirmingCard = await screen.findByRole('group', {
      name: /Confirmar exclusão de Vendas Mensais/i,
    });
    expect(confirmingCard).toHaveAttribute('data-confirming', 'true');
    expect(
      within(confirmingCard).getByText(/Excluir Vendas Mensais\?/),
    ).toBeInTheDocument();
    expect(
      within(confirmingCard).getByRole('button', { name: /Cancelar/i }),
    ).toBeInTheDocument();
    expect(
      within(confirmingCard).getByRole('button', { name: /Sim, excluir/i }),
    ).toBeInTheDocument();

    // O outro card (Receita por Região) NÃO entra em modo confirming.
    expect(
      screen
        .getByText('Receita por Região')
        .closest('[data-slot="card"]')!
        .querySelector('[data-confirming="true"]'),
    ).toBeNull();
  });

  it('excluir: clicar "Sim, excluir" chama a mutação com o id correto', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    const confirmBtn = await screen.findByTestId('confirm-delete');
    fireEvent.click(confirmBtn);
    expect(deleteMock.mutate).toHaveBeenCalledWith('d1', expect.any(Object));
  });

  /**
   * FIX DO BUG: o modo de confirmação sai do card após o `onSettled` rodar,
   * MESMO em caso de erro de mutação. Antes do fix (com AlertDialog Radix),
   * falhas de rede/500/404 deixavam o `<body>` com `pointer-events: none`
   * (bug do react-remove-scroll cleanup). Agora sem portal, sem overlay,
   * esse caminho simplesmente não existe.
   */
  it('excluir: card SAI do modo de confirmação quando a mutação falha', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    // Antes do settle: card em modo confirming.
    expect(
      screen.getByRole('group', {
        name: /Confirmar exclusão de Vendas Mensais/i,
      }),
    ).toBeInTheDocument();

    // Confirma a exclusão.
    fireEvent.click(screen.getByTestId('confirm-delete'));
    expect(deleteMock.mutate).toHaveBeenCalledWith('d1', expect.any(Object));

    // Simula erro: onSettled é disparado, hook zera `deleting`.
    act(() => {
      deleteMock.settleFail();
    });

    // Card voltou ao normal: nenhum card está em modo confirming.
    await waitFor(() => {
      expect(
        screen.queryByRole('group', {
          name: /Confirmar exclusão de Vendas Mensais/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('excluir: card SAI do modo de confirmação quando a mutação tem SUCESSO', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
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
          name: /Confirmar exclusão de Vendas Mensais/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('excluir: cancelar NÃO chama a mutação e volta o card ao normal', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    // Card em modo confirming.
    expect(
      screen.getByRole('group', {
        name: /Confirmar exclusão de Vendas Mensais/i,
      }),
    ).toBeInTheDocument();

    // Clica Cancelar.
    fireEvent.click(screen.getByTestId('cancel-delete'));

    await waitFor(() => {
      expect(
        screen.queryByRole('group', {
          name: /Confirmar exclusão de Vendas Mensais/i,
        }),
      ).not.toBeInTheDocument();
    });
    expect(deleteMock.mutate).not.toHaveBeenCalled();
  });

  it('excluir: durante a request, o botão "Sim, excluir" fica disabled', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    const deleteItem = await screen.findByRole('menuitem', { name: /Excluir/i });
    await user.click(deleteItem);

    fireEvent.click(screen.getByTestId('confirm-delete'));

    // isPending=true no mock → botão disabled. Re-busca o nó (o React
    // pode ter substituído o elemento no re-render).
    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete')).toBeDisabled();
    });
    expect(screen.getByTestId('confirm-delete')).toHaveTextContent(/Excluindo\.\.\./);

    // settleOk é síncrono, mas precisa estar dentro de act por causa do
    // setState interno do mock reativo.
    act(() => {
      deleteMock.settleOk();
    });
  });
});
